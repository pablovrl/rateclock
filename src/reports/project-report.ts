import type Database from "better-sqlite3";

import { type Clock, systemClock } from "../clock/clock.js";
import {
  type EarningsPeriod,
  calculateTotalEarnings,
} from "../money/earnings.js";
import { validateProjectName } from "../projects/validation.js";
import type { LocalDateRange } from "./date-range.js";

interface ProjectRow {
  id: bigint;
  name: string;
  currency: string;
}

interface SessionRow {
  rate_snapshot: bigint;
  currency_snapshot: string;
  started_at: bigint;
  finished_at: bigint | null;
}

export interface CurrencyEarnings {
  currency: string;
  amount: bigint;
}

export interface ProjectReport {
  projectName: string;
  range: LocalDateRange;
  durationMilliseconds: number;
  earnings: CurrencyEarnings[];
}

export function createProjectReport(
  database: Database.Database,
  projectName: string,
  range: LocalDateRange,
  clock: Clock = systemClock,
): ProjectReport {
  const validatedName = validateProjectName(projectName);
  const project = database
    .prepare("SELECT id, name, currency FROM projects WHERE name = ?")
    .safeIntegers()
    .get(validatedName) as ProjectRow | undefined;

  if (!project) {
    throw new Error(`Project "${validatedName}" does not exist.`);
  }

  const currentTime = clock.now();

  if (!Number.isSafeInteger(currentTime) || currentTime < 0) {
    throw new Error("Clock returned an invalid timestamp.");
  }

  const rows = database
    .prepare(
      `
        SELECT rate_snapshot, currency_snapshot, started_at, finished_at
        FROM sessions
        WHERE project_id = ?
          AND started_at < ?
          AND (finished_at IS NULL OR finished_at > ?)
        ORDER BY started_at ASC, id ASC
      `,
    )
    .safeIntegers()
    .all(project.id, range.endAt, range.startAt) as SessionRow[];
  const periodsByCurrency = new Map<string, EarningsPeriod[]>();
  let durationMilliseconds = 0;

  for (const row of rows) {
    const startedAt = Number(row.started_at);
    const finishedAt =
      row.finished_at === null ? currentTime : Number(row.finished_at);
    const intervalStart = Math.max(startedAt, range.startAt);
    const intervalEnd = Math.min(finishedAt, range.endAt);

    if (intervalEnd <= intervalStart) {
      continue;
    }

    const duration = intervalEnd - intervalStart;
    durationMilliseconds += duration;

    if (!Number.isSafeInteger(durationMilliseconds)) {
      throw new Error("Report duration is too large.");
    }

    const periods = periodsByCurrency.get(row.currency_snapshot) ?? [];
    periods.push({
      ratePerHour: row.rate_snapshot,
      durationMilliseconds: duration,
    });
    periodsByCurrency.set(row.currency_snapshot, periods);
  }

  if (periodsByCurrency.size === 0) {
    periodsByCurrency.set(project.currency, []);
  }

  const earnings = [...periodsByCurrency]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, periods]) => ({
      currency,
      amount: calculateTotalEarnings(periods),
    }));

  return {
    projectName: project.name,
    range,
    durationMilliseconds,
    earnings,
  };
}
