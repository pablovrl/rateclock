import type Database from "better-sqlite3";

import { type Clock, systemClock } from "../clock/clock.js";
import { validateProjectName } from "../projects/validation.js";
import type { Session } from "./session.js";

interface ProjectRow {
  id: bigint;
  name: string;
  rate_per_hour: bigint;
  currency: string;
  active: bigint;
}

interface ActiveSessionRow {
  project_name: string;
}

export function startSession(
  database: Database.Database,
  projectName: string,
  clock: Clock = systemClock,
): Session {
  const validatedName = validateProjectName(projectName);
  const startedAt = clock.now();

  if (!Number.isSafeInteger(startedAt) || startedAt < 0) {
    throw new Error("Clock returned an invalid timestamp.");
  }

  const start = database.transaction(() => {
    const project = database
      .prepare(
        `
          SELECT id, name, rate_per_hour, currency, active
          FROM projects
          WHERE name = ?
        `,
      )
      .safeIntegers()
      .get(validatedName) as ProjectRow | undefined;

    if (!project) {
      throw new Error(`Project "${validatedName}" does not exist.`);
    }

    if (project.active === 0n) {
      throw new Error(`Project "${validatedName}" is archived.`);
    }

    const activeSession = database
      .prepare(
        `
          SELECT projects.name AS project_name
          FROM sessions
          JOIN projects ON projects.id = sessions.project_id
          WHERE sessions.finished_at IS NULL
        `,
      )
      .get() as ActiveSessionRow | undefined;

    if (activeSession) {
      throw new Error(
        `A session for project "${activeSession.project_name}" is already active.`,
      );
    }

    const result = database
      .prepare(
        `
          INSERT INTO sessions (
            project_id,
            rate_snapshot,
            currency_snapshot,
            started_at
          )
          VALUES (?, ?, ?, ?)
        `,
      )
      .safeIntegers()
      .run(project.id, project.rate_per_hour, project.currency, startedAt);

    return {
      id: BigInt(result.lastInsertRowid),
      projectId: project.id,
      projectName: project.name,
      rateSnapshot: project.rate_per_hour,
      currencySnapshot: project.currency,
      startedAt,
      finishedAt: null,
    };
  });

  return start.immediate();
}
