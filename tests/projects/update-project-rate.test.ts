import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { createProject } from "../../src/projects/create-project.js";
import { listProjects } from "../../src/projects/list-projects.js";
import { updateProjectRate } from "../../src/projects/update-project-rate.js";

const fixedClock = { now: () => 1_700_000_000_000 };

describe("updateProjectRate", () => {
  it("updates the rate of an active project", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      const originalProject = createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        fixedClock,
      );

      expect(updateProjectRate(database, "  client-a  ", "45.123456")).toEqual({
        ...originalProject,
        ratePerHour: 45_123_456n,
      });
      expect(listProjects(database)[0]?.ratePerHour).toBe(45_123_456n);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a project that does not exist", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      expect(() => updateProjectRate(database, "unknown", "45")).toThrow(
        'Project "unknown" does not exist.',
      );
      expect(listProjects(database)).toEqual([]);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects an archived project", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      const project = createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        fixedClock,
      );
      database
        .prepare("UPDATE projects SET active = 0 WHERE id = ?")
        .run(project.id);

      expect(() => updateProjectRate(database, "client-a", "45")).toThrow(
        'Project "client-a" is archived.',
      );
      expect(listProjects(database)[0]?.ratePerHour).toBe(30_000_000n);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("does not change the project when the rate is invalid", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        fixedClock,
      );

      expect(() => updateProjectRate(database, "client-a", "0")).toThrow(
        "Hourly rate must be greater than zero.",
      );
      expect(listProjects(database)[0]?.ratePerHour).toBe(30_000_000n);
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
