import type Database from "better-sqlite3";

const LATEST_SCHEMA_VERSION = 2;

const migrations = [
  {
    version: 1,
    migrate(database: Database.Database): void {
      database.exec(`
        CREATE TABLE projects (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
          rate_per_hour INTEGER NOT NULL CHECK (rate_per_hour > 0),
          currency TEXT NOT NULL CHECK (currency GLOB '[A-Z][A-Z][A-Z]'),
          active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
          created_at INTEGER NOT NULL CHECK (created_at >= 0)
        ) STRICT;
      `);
    },
  },
  {
    version: 2,
    migrate(database: Database.Database): void {
      database.exec(`
        CREATE TABLE sessions (
          id INTEGER PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES projects(id),
          rate_snapshot INTEGER NOT NULL CHECK (rate_snapshot > 0),
          currency_snapshot TEXT NOT NULL CHECK (
            currency_snapshot GLOB '[A-Z][A-Z][A-Z]'
          ),
          started_at INTEGER NOT NULL CHECK (started_at >= 0),
          finished_at INTEGER CHECK (
            finished_at IS NULL OR finished_at >= started_at
          )
        ) STRICT;

        CREATE UNIQUE INDEX sessions_one_unfinished
        ON sessions ((1))
        WHERE finished_at IS NULL;
      `);
    },
  },
] as const;

export function migrateDatabase(database: Database.Database): void {
  const currentVersion = database.pragma("user_version", {
    simple: true,
  });

  if (typeof currentVersion !== "number") {
    throw new Error("Cannot read the database schema version.");
  }

  if (currentVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `Database schema version ${currentVersion} is newer than supported version ${LATEST_SCHEMA_VERSION}.`,
    );
  }

  const pendingMigrations = migrations.filter(
    (migration) => migration.version > currentVersion,
  );

  const runPendingMigrations = database.transaction(() => {
    for (const migration of pendingMigrations) {
      migration.migrate(database);
      database.pragma(`user_version = ${migration.version}`);
    }
  });

  runPendingMigrations();
}
