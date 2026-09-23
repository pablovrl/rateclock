import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";

interface TableInfo {
  name: string;
}

describe("database migrations", () => {
  it("creates the projects and sessions tables at schema version 2", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");

    try {
      const database = openDatabase(databasePath);

      try {
        const projectColumns = database.pragma(
          "table_info(projects)",
        ) as TableInfo[];
        const sessionColumns = database.pragma(
          "table_info(sessions)",
        ) as TableInfo[];

        expect(projectColumns.map((column) => column.name)).toEqual([
          "id",
          "name",
          "rate_per_hour",
          "currency",
          "active",
          "created_at",
        ]);
        expect(sessionColumns.map((column) => column.name)).toEqual([
          "id",
          "project_id",
          "rate_snapshot",
          "currency_snapshot",
          "started_at",
          "finished_at",
        ]);
        expect(database.pragma("user_version", { simple: true })).toBe(2);
      } finally {
        database.close();
      }
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("upgrades schema version 1 without losing projects", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");

    try {
      const versionOneDatabase = openDatabase(databasePath);
      versionOneDatabase
        .prepare(
          `
            INSERT INTO projects (name, rate_per_hour, currency, created_at)
            VALUES (?, ?, ?, ?)
          `,
        )
        .run("client-a", 30_000_000n, "EUR", 1_000);
      versionOneDatabase.exec("DROP TABLE sessions");
      versionOneDatabase.pragma("user_version = 1");
      versionOneDatabase.close();

      const upgradedDatabase = openDatabase(databasePath);

      try {
        const project = upgradedDatabase
          .prepare("SELECT name FROM projects")
          .get() as { name: string };
        const sessionColumns = upgradedDatabase.pragma(
          "table_info(sessions)",
        ) as TableInfo[];

        expect(project.name).toBe("client-a");
        expect(sessionColumns).toHaveLength(6);
        expect(upgradedDatabase.pragma("user_version", { simple: true })).toBe(
          2,
        );
      } finally {
        upgradedDatabase.close();
      }
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("can open an already migrated database", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");

    try {
      openDatabase(databasePath).close();

      const database = openDatabase(databasePath);
      database.close();
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("enforces the main projects constraints", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");

    try {
      const database = openDatabase(databasePath);

      try {
        const insertProject = database.prepare(`
          INSERT INTO projects (name, rate_per_hour, currency, created_at)
          VALUES (?, ?, ?, ?)
        `);

        insertProject.run("client-a", 30_000_000n, "EUR", 0);

        expect(() =>
          insertProject.run("client-a", 30_000_000n, "EUR", 0),
        ).toThrow();
        expect(() => insertProject.run("client-b", 0n, "EUR", 0)).toThrow();
        expect(() =>
          insertProject.run("client-c", 30_000_000n, "eur", 0),
        ).toThrow();
      } finally {
        database.close();
      }
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("enforces session relationships, snapshots, and time intervals", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");

    try {
      const database = openDatabase(databasePath);

      try {
        const project = database
          .prepare(
            `
              INSERT INTO projects (name, rate_per_hour, currency, created_at)
              VALUES (?, ?, ?, ?)
            `,
          )
          .run("client-a", 30_000_000n, "EUR", 0);
        const insertSession = database.prepare(`
          INSERT INTO sessions (
            project_id,
            rate_snapshot,
            currency_snapshot,
            started_at,
            finished_at
          )
          VALUES (?, ?, ?, ?, ?)
        `);

        insertSession.run(
          project.lastInsertRowid,
          30_000_000n,
          "EUR",
          1_000,
          null,
        );

        expect(() =>
          insertSession.run(
            project.lastInsertRowid,
            30_000_000n,
            "EUR",
            2_000,
            null,
          ),
        ).toThrow();
        expect(() =>
          insertSession.run(999, 30_000_000n, "EUR", 1_000, 2_000),
        ).toThrow();
        expect(() =>
          insertSession.run(project.lastInsertRowid, 0n, "EUR", 1_000, 2_000),
        ).toThrow();
        expect(() =>
          insertSession.run(
            project.lastInsertRowid,
            30_000_000n,
            "eur",
            1_000,
            2_000,
          ),
        ).toThrow();
        expect(() =>
          insertSession.run(
            project.lastInsertRowid,
            30_000_000n,
            "EUR",
            2_000,
            1_000,
          ),
        ).toThrow();

        expect(() =>
          insertSession.run(
            project.lastInsertRowid,
            30_000_000n,
            "EUR",
            2_000,
            3_000,
          ),
        ).not.toThrow();
        expect(() =>
          insertSession.run(
            project.lastInsertRowid,
            30_000_000n,
            "EUR",
            3_000,
            4_000,
          ),
        ).not.toThrow();
      } finally {
        database.close();
      }
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a database schema created by a newer Rateclock version", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");

    try {
      const database = new Database(databasePath);
      database.pragma("user_version = 3");
      database.close();

      expect(() => openDatabase(databasePath)).toThrow(
        "Database schema version 3 is newer than supported version 2.",
      );
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
