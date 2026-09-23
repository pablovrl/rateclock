import type Database from "better-sqlite3";

import { parseHourlyRate } from "../money/rate.js";
import type { Project } from "./project.js";
import { type ProjectRow, projectFromRow } from "./project-row.js";
import { validateProjectName } from "./validation.js";

interface ProjectStatusRow {
  active: bigint;
}

export function updateProjectRate(
  database: Database.Database,
  name: string,
  rate: string,
): Project {
  const validatedName = validateProjectName(name);
  const ratePerHour = parseHourlyRate(rate);

  const update = database.transaction(() => {
    const row = database
      .prepare(
        `
          UPDATE projects
          SET rate_per_hour = ?
          WHERE name = ? AND active = 1
          RETURNING id, name, rate_per_hour, currency, active, created_at
        `,
      )
      .safeIntegers()
      .get(ratePerHour, validatedName) as ProjectRow | undefined;

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

    throw new Error(`Project "${validatedName}" is archived.`);
  });

  return update();
}
