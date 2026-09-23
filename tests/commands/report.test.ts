import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";
import { startSession } from "../../src/sessions/start-session.js";
import { stopSession } from "../../src/sessions/stop-session.js";

const cliPath = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

function runReport(dataHome: string, args: string[]) {
  return spawnSync(process.execPath, [cliPath, "report", ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      XDG_DATA_HOME: dataHome,
    },
  });
}

describe("rateclock report", () => {
  it("reports time and earnings for one local date", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(
      join(temporaryDirectory, "rateclock", "rateclock.db"),
    );
    const startedAt = new Date(2026, 0, 2, 9, 0, 0).getTime();

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => startedAt - 1_000 },
      );
      startSession(database, "client-a", { now: () => startedAt });
      stopSession(database, { now: () => startedAt + 5_400_000 });
    } finally {
      database.close();
    }

    try {
      const result = runReport(temporaryDirectory, [
        "client-a",
        "--date",
        "2026-01-02",
      ]);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe(
        "Project:   client-a\n" +
          "Period:    2026-01-02\n" +
          "Duration:  01:30:00\n" +
          "Earned:    45.00 EUR\n",
      );
      expect(result.stderr).toBe("");

      const rangeResult = runReport(temporaryDirectory, [
        "client-a",
        "--from",
        "2026-01-01",
        "--to",
        "2026-01-02",
      ]);

      expect(rangeResult.status).toBe(0);
      expect(rangeResult.stdout).toBe(
        "Project:   client-a\n" +
          "Period:    2026-01-01 → 2026-01-02\n" +
          "Duration:  01:30:00\n" +
          "Earned:    45.00 EUR\n",
      );
      expect(rangeResult.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects an invalid date", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));

    try {
      const result = runReport(temporaryDirectory, [
        "client-a",
        "--date",
        "2026-02-30",
      ]);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).toBe(
        'Error: Invalid date "2026-02-30". Use YYYY-MM-DD.\n',
      );
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
