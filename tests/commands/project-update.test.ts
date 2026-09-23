import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";

const cliPath = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runCli(dataHome: string, args: string[]) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      XDG_DATA_HOME: dataHome,
    },
  });
}

describe("worktime project update", () => {
  it("updates a project's hourly rate", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(
      join(temporaryDirectory, "worktime", "worktime.db"),
    );

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => 1_000 },
      );
    } finally {
      database.close();
    }

    try {
      const updateResult = runCli(temporaryDirectory, [
        "project",
        "update",
        "client-a",
        "--rate",
        "45.5",
      ]);

      expect(updateResult.status).toBe(0);
      expect(updateResult.stdout).toBe(
        'Project "client-a" rate updated to 45.50 EUR/h.\n',
      );
      expect(updateResult.stderr).toBe("");

      const listResult = runCli(temporaryDirectory, ["project", "list"]);

      expect(listResult.status).toBe(0);
      expect(listResult.stdout).toBe("client-a  45.50 EUR/h  active\n");
      expect(listResult.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("reports a project that does not exist", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));

    try {
      const result = runCli(temporaryDirectory, [
        "project",
        "update",
        "unknown",
        "--rate",
        "45",
      ]);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe('Error: Project "unknown" does not exist.\n');
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
