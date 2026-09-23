import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { openDatabase } from "../../src/database/connection.js";

describe("openDatabase", () => {
  it("creates the parent directory and opens the database", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const databasePath = join(temporaryDirectory, "data", "rateclock.db");

    try {
      const database = openDatabase(databasePath);

      try {
        expect(database.open).toBe(true);
        expect(existsSync(databasePath)).toBe(true);
      } finally {
        database.close();
      }

      expect(database.open).toBe(false);
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
