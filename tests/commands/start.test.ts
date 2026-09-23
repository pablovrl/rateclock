import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";

const cliPath = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runStart(dataHome: string, projectName: string) {
  return spawnSync(process.execPath, [cliPath, "start", projectName], {
    encoding: "utf8",
    env: {
      ...process.env,
      XDG_DATA_HOME: dataHome,
    },
  });
}

describe("worktime start", () => {
  it("starts one session and rejects a second one", () => {
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
      createProject(
        database,
        { name: "client-b", rate: "45", currency: "USD" },
        { now: () => 1_000 },
      );
    } finally {
      database.close();
    }

    try {
      const firstRun = runStart(temporaryDirectory, "client-a");

      expect(firstRun.status).toBe(0);
      expect(firstRun.stdout).toBe(
        'Session started for project "client-a".\n',
      );
      expect(firstRun.stderr).toBe("");

      const secondRun = runStart(temporaryDirectory, "client-b");

      expect(secondRun.status).toBe(1);
      expect(secondRun.stdout).toBe("");
      expect(secondRun.stderr).toBe(
        'Error: A session for project "client-a" is already active.\n',
      );
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
