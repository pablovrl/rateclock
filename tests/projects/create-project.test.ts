import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Clock } from "../../src/clock/clock.js";
import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";

interface ProjectRow {
  id: bigint;
  name: string;
  rate_per_hour: bigint;
  currency: string;
  active: bigint;
  created_at: bigint;
}

const fixedClock: Clock = {
  now: () => 1_700_000_000_000,
};

describe("createProject", () => {
  it("persists a validated active project", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");
    const database = openDatabase(databasePath);

    try {
      const project = createProject(
        database,
        { name: "  client-a  ", rate: "30.5", currency: "EUR" },
        fixedClock,
      );
      const row = database
        .prepare("SELECT * FROM projects WHERE id = ?")
        .safeIntegers()
        .get(project.id) as ProjectRow | undefined;

      expect(project).toEqual({
        id: 1n,
        name: "client-a",
        ratePerHour: 30_500_000n,
        currency: "EUR",
        active: true,
        createdAt: 1_700_000_000_000,
      });
      expect(row).toEqual({
        id: 1n,
        name: "client-a",
        rate_per_hour: 30_500_000n,
        currency: "EUR",
        active: 1n,
        created_at: 1_700_000_000_000n,
      });
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a duplicate name without inserting another project", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "rateclock.db");
    const database = openDatabase(databasePath);

    try {
      const input = { name: "client-a", rate: "30", currency: "EUR" };

      createProject(database, input, fixedClock);

      expect(() => createProject(database, input, fixedClock)).toThrow(
        'Project "client-a" already exists.',
      );

      const row = database
        .prepare("SELECT count(*) AS count FROM projects")
        .safeIntegers()
        .get() as { count: bigint };

      expect(row.count).toBe(1n);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
