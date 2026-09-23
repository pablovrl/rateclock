import { describe, expect, it } from "vitest";

import { resolveDatabasePath } from "../../src/database/paths.js";

describe("resolveDatabasePath", () => {
  it("uses XDG_DATA_HOME when it is set", () => {
    const path = resolveDatabasePath({
      HOME: "/home/alice",
      XDG_DATA_HOME: "/custom/data",
    });

    expect(path).toBe("/custom/data/rateclock/rateclock.db");
  });

  it("falls back to the default directory inside HOME", () => {
    const path = resolveDatabasePath({ HOME: "/home/alice" });

    expect(path).toBe("/home/alice/.local/share/rateclock/rateclock.db");
  });

  it("throws when the data directory cannot be determined", () => {
    expect(() => resolveDatabasePath({})).toThrow(
      "Cannot determine the data directory: XDG_DATA_HOME and HOME are not set.",
    );
  });
});
