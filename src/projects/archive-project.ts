import type Database from "better-sqlite3";

import type { Project } from "./project.js";
import { type ProjectRow, projectFromRow } from "./project-row.js";
import { validateProjectName } from "./validation.js";

interface ProjectStatusRow {
  active: bigint;
}

export function archiveProject(
  database: Database.Database,
  name: string,
): Project {
  const validatedName = validateProjectName(name);

  const archive = database.transaction(() => {
    const row = database
      .prepare(
        `
          UPDATE projects
          SET active = 0
          WHERE name = ? AND active = 1
          RETURNING id, name, rate_per_hour, currency, active, created_at
        `,
      )
      .safeIntegers()
      .get(validatedName) as ProjectRow | undefined;

    if (row) {
      return projectFromRow(row);
    }

    const existingProject = database
      .prepare("SELECT active FROM projects WHERE name = ?")
      .safeIntegers()
      .get(validatedName) as ProjectStatusRow | undefined;

    if (!existingProject) {
      throw new Error(`Project "${validatedName}" does not exist.`);
    }

    throw new Error(`Project "${validatedName}" is already archived.`);
  });

  return archive();
}
