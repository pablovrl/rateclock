import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { resolveDatabasePath } from "./paths.js";

export function openDatabase(
  databasePath: string = resolveDatabasePath(),
): Database.Database {
  mkdirSync(dirname(databasePath), { recursive: true });

  return new Database(databasePath);
}
