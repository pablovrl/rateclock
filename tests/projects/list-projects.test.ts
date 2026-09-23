import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";
import { listProjects } from "../../src/projects/list-projects.js";

describe("listProjects", () => {
  it("returns an empty list when there are no projects", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      expect(listProjects(database)).toEqual([]);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("returns all projects ordered by creation time and id", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));

    try {
      const firstProject = createProject(
        database,
        { name: "client-a", rate: "30.5", currency: "EUR" },
        { now: () => 2_000 },
      );
      const secondProject = createProject(
        database,
        { name: "client-b", rate: "45", currency: "USD" },
        { now: () => 1_000 },
      );

      database
        .prepare("UPDATE projects SET active = 0 WHERE id = ?")
        .run(secondProject.id);

      expect(listProjects(database)).toEqual([
        {
          ...secondProject,
          active: false,
        },
        firstProject,
      ]);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
