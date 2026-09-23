import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { archiveProject } from "../../src/projects/archive-project.js";
import { createProject } from "../../src/projects/create-project.js";
import { updateProjectRate } from "../../src/projects/update-project-rate.js";
import { listSessions } from "../../src/sessions/list-sessions.js";
import { startSession } from "../../src/sessions/start-session.js";
import { stopSession } from "../../src/sessions/stop-session.js";

describe("listSessions", () => {
  it("returns an empty list when there are no sessions", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      expect(listSessions(database)).toEqual([]);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("returns active and finished sessions with historical snapshots", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      const archivedProject = createProject(
        database,
        { name: "archived-client", rate: "20", currency: "EUR" },
        { now: () => 100 },
      );
      const activeProject = createProject(
        database,
        { name: "active-client", rate: "30", currency: "USD" },
        { now: () => 200 },
      );

      const archivedSession = startSession(database, "archived-client", {
        now: () => 1_000,
      });
      stopSession(database, { now: () => 2_000 });
      archiveProject(database, "archived-client");

      const historicalRateSession = startSession(database, "active-client", {
        now: () => 3_000,
      });
      stopSession(database, { now: () => 4_000 });
      updateProjectRate(database, "active-client", "45");
      const activeSession = startSession(database, "active-client", {
        now: () => 5_000,
      });

      expect(listSessions(database)).toEqual([
        activeSession,
        {
          ...historicalRateSession,
          finishedAt: 4_000,
        },
        {
          ...archivedSession,
          finishedAt: 2_000,
        },
      ]);
      expect(historicalRateSession.rateSnapshot).toBe(30_000_000n);
      expect(activeSession.rateSnapshot).toBe(45_000_000n);
      expect(archivedSession.projectId).toBe(archivedProject.id);
      expect(activeSession.projectId).toBe(activeProject.id);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
