import Database from "better-sqlite3";

import { type Clock, systemClock } from "../clock/clock.js";
import {
  type ProjectInput,
  validateProjectInput,
} from "./validation.js";

export interface Project {
  id: bigint;
  name: string;
  ratePerHour: bigint;
  currency: string;
  active: boolean;
  createdAt: number;
}

export function createProject(
  database: Database.Database,
  input: ProjectInput,
  clock: Clock = systemClock,
): Project {
  const validatedInput = validateProjectInput(input);
  const createdAt = clock.now();

  try {
    const result = database
      .prepare(
        `
          INSERT INTO projects (name, rate_per_hour, currency, created_at)
          VALUES (?, ?, ?, ?)
        `,
      )
      .safeIntegers()
      .run(
        validatedInput.name,
        validatedInput.ratePerHour,
        validatedInput.currency,
        createdAt,
      );

    return {
      id: BigInt(result.lastInsertRowid),
      name: validatedInput.name,
      ratePerHour: validatedInput.ratePerHour,
      currency: validatedInput.currency,
      active: true,
      createdAt,
    };
  } catch (error) {
    if (
      error instanceof Database.SqliteError &&
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      throw new Error(
        `Project "${validatedInput.name}" already exists.`,
        { cause: error },
      );
    }

    throw error;
  }
}
