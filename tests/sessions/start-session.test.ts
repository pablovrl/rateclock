import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { archiveProject } from "../../src/projects/archive-project.js";
import { createProject } from "../../src/projects/create-project.js";
import { startSession } from "../../src/sessions/start-session.js";

interface SessionRow {
  project_id: bigint;
  rate_snapshot: bigint;
  currency_snapshot: string;
  started_at: bigint;
  finished_at: bigint | null;
}

describe("startSession", () => {
  it("starts a session with project and clock snapshots", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      const project = createProject(
        database,
        { name: "client-a", rate: "30.5", currency: "EUR" },
        { now: () => 1_000 },
      );
      const session = startSession(database, "  client-a  ", {
        now: () => 2_000,
      });
      const row = database
        .prepare(
          `
            SELECT project_id, rate_snapshot, currency_snapshot,
                   started_at, finished_at
            FROM sessions
            WHERE id = ?
          `,
        )
        .safeIntegers()
        .get(session.id) as SessionRow;

      expect(session).toEqual({
        id: 1n,
        projectId: project.id,
        projectName: "client-a",
        rateSnapshot: 30_500_000n,
        currencySnapshot: "EUR",
        startedAt: 2_000,
        finishedAt: null,
      });
      expect(row).toEqual({
        project_id: project.id,
        rate_snapshot: 30_500_000n,
        currency_snapshot: "EUR",
        started_at: 2_000n,
        finished_at: null,
      });
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a project that does not exist", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      expect(() =>
        startSession(database, "unknown", { now: () => 1_000 }),
      ).toThrow('Project "unknown" does not exist.');
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects an archived project", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => 1_000 },
      );
      archiveProject(database, "client-a");

      expect(() =>
        startSession(database, "client-a", { now: () => 2_000 }),
      ).toThrow('Project "client-a" is archived.');
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a second active session without inserting it", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

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
      startSession(database, "client-a", { now: () => 2_000 });

      expect(() =>
        startSession(database, "client-b", { now: () => 3_000 }),
      ).toThrow('A session for project "client-a" is already active.');

      const row = database
        .prepare("SELECT count(*) AS count FROM sessions")
        .safeIntegers()
        .get() as { count: bigint };

      expect(row.count).toBe(1n);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
