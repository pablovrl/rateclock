import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { archiveProject } from "../../src/projects/archive-project.js";
import { createProject } from "../../src/projects/create-project.js";
import { listProjects } from "../../src/projects/list-projects.js";

const fixedClock = { now: () => 1_700_000_000_000 };

describe("archiveProject", () => {
  it("archives a project without deleting or changing its data", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      const project = createProject(
        database,
        { name: "client-a", rate: "30.5", currency: "EUR" },
        fixedClock,
      );

      expect(archiveProject(database, "  client-a  ")).toEqual({
        ...project,
        active: false,
      });
      expect(listProjects(database)).toEqual([
        {
          ...project,
          active: false,
        },
      ]);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a project that does not exist", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      expect(() => archiveProject(database, "unknown")).toThrow(
        'Project "unknown" does not exist.',
      );
      expect(listProjects(database)).toEqual([]);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a project that is already archived", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        fixedClock,
      );
      archiveProject(database, "client-a");

      expect(() => archiveProject(database, "client-a")).toThrow(
        'Project "client-a" is already archived.',
      );
      expect(listProjects(database)).toHaveLength(1);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
