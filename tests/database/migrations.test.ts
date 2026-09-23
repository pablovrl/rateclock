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
  it("creates the projects table and records schema version 1", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const databasePath = join(temporaryDirectory, "worktime.db");

    try {
      const database = openDatabase(databasePath);

      try {
        const columns = database.pragma("table_info(projects)") as TableInfo[];

        expect(columns.map((column) => column.name)).toEqual([
          "id",
          "name",
          "rate_per_hour",
          "currency",
          "active",
          "created_at",
        ]);
        expect(database.pragma("user_version", { simple: true })).toBe(1);
      } finally {
        database.close();
      }
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("can open an already migrated database", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const databasePath = join(temporaryDirectory, "worktime.db");

    try {
      openDatabase(databasePath).close();

      const database = openDatabase(databasePath);
      database.close();
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("enforces the main projects constraints", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const databasePath = join(temporaryDirectory, "worktime.db");

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
        expect(() =>
          insertProject.run("client-b", 0n, "EUR", 0),
        ).toThrow();
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

  it("rejects a database schema created by a newer Worktime version", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const databasePath = join(temporaryDirectory, "worktime.db");

    try {
      const database = new Database(databasePath);
      database.pragma("user_version = 2");
      database.close();

      expect(() => openDatabase(databasePath)).toThrow(
        "Database schema version 2 is newer than supported version 1.",
      );
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
