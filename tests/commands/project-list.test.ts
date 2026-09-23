import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";

const cliPath = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runProjectList(dataHome: string) {
  return spawnSync(process.execPath, [cliPath, "project", "list"], {
    encoding: "utf8",
    env: {
      ...process.env,
      XDG_DATA_HOME: dataHome,
    },
  });
}

describe("worktime project list", () => {
  it("reports when there are no projects", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));

    try {
      const result = runProjectList(temporaryDirectory);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("No projects found.\n");
      expect(result.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("lists active and archived projects in creation order", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const databasePath = join(
      temporaryDirectory,
      "worktime",
      "worktime.db",
    );
    const database = openDatabase(databasePath);

    try {
      createProject(
        database,
        { name: "client-a", rate: "30.5", currency: "EUR" },
        { now: () => 1_000 },
      );
      const archivedProject = createProject(
        database,
        { name: "client-b", rate: "45.123456", currency: "USD" },
        { now: () => 2_000 },
      );

      database
        .prepare("UPDATE projects SET active = 0 WHERE id = ?")
        .run(archivedProject.id);
    } finally {
      database.close();
    }

    try {
      const result = runProjectList(temporaryDirectory);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe(
        "client-a  30.50 EUR/h  active\n" +
          "client-b  45.123456 USD/h  archived\n",
      );
      expect(result.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
