import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { archiveProject } from "../../src/projects/archive-project.js";
import { createProject } from "../../src/projects/create-project.js";
import { updateProjectRate } from "../../src/projects/update-project-rate.js";
import { resolveLocalDateRange } from "../../src/reports/date-range.js";
import { createProjectReport } from "../../src/reports/project-report.js";
import { startSession } from "../../src/sessions/start-session.js";
import { stopSession } from "../../src/sessions/stop-session.js";

describe("createProjectReport", () => {
  it("clips sessions to the local date and uses historical rates", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));
    const range = resolveLocalDateRange({ date: "2026-09-23" });

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => range.startAt - 7_200_000 },
      );
      startSession(database, "client-a", {
        now: () => range.startAt - 3_600_000,
      });
      stopSession(database, { now: () => range.startAt + 3_600_000 });
      updateProjectRate(database, "client-a", "60");
      startSession(database, "client-a", {
        now: () => range.startAt + 7_200_000,
      });
      stopSession(database, { now: () => range.startAt + 10_800_000 });
      archiveProject(database, "client-a");

      expect(
        createProjectReport(database, "client-a", range, {
          now: () => range.startAt + 43_200_000,
        }),
      ).toEqual({
        projectName: "client-a",
        range,
        durationMilliseconds: 7_200_000,
        earnings: [{ currency: "EUR", amount: 90_000_000n }],
      });
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("includes an active session up to the current time", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));
    const range = resolveLocalDateRange({ date: "2026-09-23" });

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => range.startAt },
      );
      startSession(database, "client-a", {
        now: () => range.startAt + 14_400_000,
      });

      expect(
        createProjectReport(database, "client-a", range, {
          now: () => range.startAt + 16_200_000,
        }),
      ).toMatchObject({
        durationMilliseconds: 1_800_000,
        earnings: [{ currency: "EUR", amount: 15_000_000n }],
      });
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("returns zero totals for a project without sessions", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const database = openDatabase(join(temporaryDirectory, "rateclock.db"));
    const range = resolveLocalDateRange({ date: "2026-09-23" });

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => range.startAt },
      );

      expect(
        createProjectReport(database, "client-a", range, {
          now: () => range.startAt,
        }),
      ).toMatchObject({
        durationMilliseconds: 0,
        earnings: [{ currency: "EUR", amount: 0n }],
      });
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
