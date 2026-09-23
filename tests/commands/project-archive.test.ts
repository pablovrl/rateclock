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

describe("rateclock project archive", () => {
  it("archives a project and reports repeated attempts", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(
      join(temporaryDirectory, "rateclock", "rateclock.db"),
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
      const firstRun = runCli(temporaryDirectory, [
        "project",
        "archive",
        "client-a",
      ]);

      expect(firstRun.status).toBe(0);
      expect(firstRun.stdout).toBe('Project "client-a" archived.\n');
      expect(firstRun.stderr).toBe("");

      const listResult = runCli(temporaryDirectory, ["project", "list"]);

      expect(listResult.status).toBe(0);
      expect(listResult.stdout).toBe("client-a  30.00 EUR/h  archived\n");

      const secondRun = runCli(temporaryDirectory, [
        "project",
        "archive",
        "client-a",
      ]);

      expect(secondRun.status).toBe(1);
      expect(secondRun.stdout).toBe("");
      expect(secondRun.stderr).toBe(
        'Error: Project "client-a" is already archived.\n',
      );
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
