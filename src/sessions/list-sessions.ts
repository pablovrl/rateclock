import type Database from "better-sqlite3";

import type { Session } from "./session.js";

interface SessionRow {
  id: bigint;
  project_id: bigint;
  project_name: string;
  rate_snapshot: bigint;
  currency_snapshot: string;
  started_at: bigint;
  finished_at: bigint | null;
}

export function listSessions(database: Database.Database): Session[] {
  const rows = database
    .prepare(
      `
        SELECT
          sessions.id,
          sessions.project_id,
          projects.name AS project_name,
          sessions.rate_snapshot,
          sessions.currency_snapshot,
          sessions.started_at,
          sessions.finished_at
        FROM sessions
        JOIN projects ON projects.id = sessions.project_id
        ORDER BY sessions.started_at DESC, sessions.id DESC
      `,
    )
    .safeIntegers()
    .all() as SessionRow[];

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    rateSnapshot: row.rate_snapshot,
    currencySnapshot: row.currency_snapshot,
    startedAt: Number(row.started_at),
    finishedAt: row.finished_at === null ? null : Number(row.finished_at),
  }));
}
