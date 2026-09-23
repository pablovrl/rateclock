import type Database from "better-sqlite3";

import type { Project } from "./project.js";
import { type ProjectRow, projectFromRow } from "./project-row.js";

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

  return rows.map(projectFromRow);
}
