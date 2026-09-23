import type Database from "better-sqlite3";

import { type Clock, systemClock } from "../clock/clock.js";
import type { FinishedSession } from "./session.js";

interface ActiveSessionRow {
  id: bigint;
  project_id: bigint;
  project_name: string;
  rate_snapshot: bigint;
  currency_snapshot: string;
  started_at: bigint;
}

export function stopSession(
  database: Database.Database,
  clock: Clock = systemClock,
): FinishedSession {
  const stop = database.transaction(() => {
    const row = database
      .prepare(
        `
          SELECT
            sessions.id,
            sessions.project_id,
            projects.name AS project_name,
            sessions.rate_snapshot,
            sessions.currency_snapshot,
            sessions.started_at
          FROM sessions
          JOIN projects ON projects.id = sessions.project_id
          WHERE sessions.finished_at IS NULL
        `,
      )
      .safeIntegers()
      .get() as ActiveSessionRow | undefined;

    if (!row) {
      throw new Error("No active session.");
    }

    const startedAt = Number(row.started_at);
    const finishedAt = clock.now();

    if (!Number.isSafeInteger(finishedAt) || finishedAt < 0) {
      throw new Error("Clock returned an invalid timestamp.");
    }

    if (finishedAt < startedAt) {
      throw new Error(
        "Current time cannot be earlier than the session start time.",
      );
    }

    database
      .prepare("UPDATE sessions SET finished_at = ? WHERE id = ?")
      .run(finishedAt, row.id);

    return {
      id: row.id,
      projectId: row.project_id,
      projectName: row.project_name,
      rateSnapshot: row.rate_snapshot,
      currencySnapshot: row.currency_snapshot,
      startedAt,
      finishedAt,
    };
  });

  return stop.immediate();
}
