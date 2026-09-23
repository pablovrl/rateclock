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

describe("worktime stop", () => {
  it("stops an active session and reports a repeated attempt", () => {
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
      const startResult = runCli(temporaryDirectory, ["start", "client-a"]);
      expect(startResult.status).toBe(0);

      const firstStop = runCli(temporaryDirectory, ["stop"]);

      expect(firstStop.status).toBe(0);
      expect(firstStop.stdout).toMatch(
        /^Session stopped for project "client-a"\.\nDuration: \d{2,}:\d{2}:\d{2}\nEarned: {3}\d+\.\d{2,6} EUR\n$/,
      );
      expect(firstStop.stderr).toBe("");

      const secondStop = runCli(temporaryDirectory, ["stop"]);

      expect(secondStop.status).toBe(1);
      expect(secondStop.stdout).toBe("");
      expect(secondStop.stderr).toBe("Error: No active session.\n");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
