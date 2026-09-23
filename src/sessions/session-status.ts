import type Database from "better-sqlite3";

import { type Clock, systemClock } from "../clock/clock.js";
import { calculateEarnings } from "../money/earnings.js";
import type { Session } from "./session.js";

interface ActiveSessionRow {
  id: bigint;
  project_id: bigint;
  project_name: string;
  rate_snapshot: bigint;
  currency_snapshot: string;
  started_at: bigint;
}

export interface SessionStatus {
  session: Session;
  durationMilliseconds: number;
  earnings: bigint;
}

export function getSessionStatus(
  database: Database.Database,
  clock: Clock = systemClock,
): SessionStatus | null {
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
    return null;
  }

  const startedAt = Number(row.started_at);
  const currentTime = clock.now();

  if (!Number.isSafeInteger(currentTime) || currentTime < 0) {
    throw new Error("Clock returned an invalid timestamp.");
  }

  if (currentTime < startedAt) {
    throw new Error(
      "Current time cannot be earlier than the session start time.",
    );
  }

  const durationMilliseconds = currentTime - startedAt;

  return {
    session: {
      id: row.id,
      projectId: row.project_id,
      projectName: row.project_name,
      rateSnapshot: row.rate_snapshot,
      currencySnapshot: row.currency_snapshot,
      startedAt,
      finishedAt: null,
    },
    durationMilliseconds,
    earnings: calculateEarnings(row.rate_snapshot, durationMilliseconds),
  };
}
