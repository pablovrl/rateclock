import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";
import { startSession } from "../../src/sessions/start-session.js";
import { stopSession } from "../../src/sessions/stop-session.js";

describe("stopSession", () => {
  it("stops the active session and allows another one to start", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      const project = createProject(
        database,
        { name: "client-a", rate: "30.5", currency: "EUR" },
        { now: () => 500 },
      );
      const activeSession = startSession(database, "client-a", {
        now: () => 1_000,
      });

      expect(stopSession(database, { now: () => 3_000 })).toEqual({
        ...activeSession,
        finishedAt: 3_000,
      });

      expect(startSession(database, "client-a", { now: () => 4_000 })).toEqual({
        id: 2n,
        projectId: project.id,
        projectName: "client-a",
        rateSnapshot: 30_500_000n,
        currencySnapshot: "EUR",
        startedAt: 4_000,
        finishedAt: null,
      });
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects when there is no active session", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      expect(() => stopSession(database, { now: () => 1_000 })).toThrow(
        "No active session.",
      );
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("does not stop the session when the clock is earlier than its start", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => 500 },
      );
      startSession(database, "client-a", { now: () => 2_000 });

      expect(() => stopSession(database, { now: () => 1_000 })).toThrow(
        "Current time cannot be earlier than the session start time.",
      );

      const row = database
        .prepare("SELECT finished_at FROM sessions")
        .get() as { finished_at: number | null };

      expect(row.finished_at).toBeNull();
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
