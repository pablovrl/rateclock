import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";
import { startSession } from "../../src/sessions/start-session.js";

const cliPath = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runStatus(dataHome: string, watch = false) {
  return spawnSync(
    process.execPath,
    [cliPath, "status", ...(watch ? ["--watch"] : [])],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        XDG_DATA_HOME: dataHome,
      },
    },
  );
}

describe("worktime status", () => {
  it("reports an empty status", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));

    try {
      const result = runStatus(temporaryDirectory);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("No active session.\n");
      expect(result.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("reports the active session", () => {
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
      startSession(database, "client-a", {
        now: () => Date.now() - 3_600_000,
      });
    } finally {
      database.close();
    }

    try {
      const result = runStatus(temporaryDirectory);

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(
        /^Project:     client-a\nStatus:      working\nDuration:    01:00:\d{2}\nRate:        30\.00 EUR\/h\nEarned:      30\.\d{2,6} EUR\n$/,
      );
      expect(result.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("exits watch mode when there is no active session", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));

    try {
      const result = runStatus(temporaryDirectory, true);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("No active session.\n");
      expect(result.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
