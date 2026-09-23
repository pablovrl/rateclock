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

function runSessionsList(dataHome: string) {
  return spawnSync(process.execPath, [cliPath, "sessions", "list"], {
    encoding: "utf8",
    env: {
      ...process.env,
      XDG_DATA_HOME: dataHome,
    },
  });
}

describe("worktime sessions list", () => {
  it("reports when there are no sessions", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));

    try {
      const result = runSessionsList(temporaryDirectory);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe("No sessions found.\n");
      expect(result.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("lists a finished session using local time", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(
      join(temporaryDirectory, "worktime", "worktime.db"),
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
      const result = runSessionsList(temporaryDirectory);

      expect(result.status).toBe(0);
      expect(result.stdout).toBe(
        "#1 client-a | 2026-01-02 09:00:00 → 2026-01-02 10:30:00 | " +
          "01:30:00 | 45.00 EUR\n",
      );
      expect(result.stderr).toBe("");
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
