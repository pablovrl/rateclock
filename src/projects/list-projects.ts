import type Database from "better-sqlite3";

import type { Project } from "./project.js";

interface ProjectRow {
  id: bigint;
  name: string;
  rate_per_hour: bigint;
  currency: string;
  active: bigint;
  created_at: bigint;
}

export function listProjects(database: Database.Database): Project[] {
  const rows = database
    .prepare(
      `
        SELECT id, name, rate_per_hour, currency, active, created_at
        FROM projects
        ORDER BY created_at ASC, id ASC
      `,
    )
    .safeIntegers()
    .all() as ProjectRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    ratePerHour: row.rate_per_hour,
    currency: row.currency,
    active: row.active === 1n,
    createdAt: Number(row.created_at),
  }));
}
