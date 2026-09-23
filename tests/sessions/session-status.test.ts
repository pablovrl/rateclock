import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";
import { formatSessionStatus } from "../../src/output/session-status.js";
import { createProject } from "../../src/projects/create-project.js";
import { getSessionStatus } from "../../src/sessions/session-status.js";
import { startSession } from "../../src/sessions/start-session.js";

describe("getSessionStatus", () => {
  it("returns null when there is no active session", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      expect(getSessionStatus(database, { now: () => 1_000 })).toBeNull();
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("calculates and formats the active session status", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => 500 },
      );
      const session = startSession(database, "client-a", { now: () => 1_000 });
      const status = getSessionStatus(database, { now: () => 3_601_000 });

      expect(status).toEqual({
        session,
        durationMilliseconds: 3_600_000,
        earnings: 30_000_000n,
      });
      expect(formatSessionStatus(status!)).toBe(
        "Project:     client-a\n" +
          "Status:      working\n" +
          "Duration:    01:00:00\n" +
          "Rate:        30.00 EUR/h\n" +
          "Earned:      30.00 EUR",
      );
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a clock earlier than the session start", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "worktime-"));
    const database = openDatabase(join(temporaryDirectory, "worktime.db"));

    try {
      createProject(
        database,
        { name: "client-a", rate: "30", currency: "EUR" },
        { now: () => 500 },
      );
      startSession(database, "client-a", { now: () => 2_000 });

      expect(() => getSessionStatus(database, { now: () => 1_000 })).toThrow(
        "Current time cannot be earlier than the session start time.",
      );
    } finally {
      database.close();
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
