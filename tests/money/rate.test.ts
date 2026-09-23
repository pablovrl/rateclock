import { describe, expect, it } from "vitest";

import { parseHourlyRate } from "../../src/money/rate.js";

describe("parseHourlyRate", () => {
  it.each([
    ["30", 30_000_000n],
    ["30.5", 30_500_000n],
    ["30.123456", 30_123_456n],
    ["0.000001", 1n],
  ])("converts %s to microunits", (value, expected) => {
    expect(parseHourlyRate(value)).toBe(expected);
  });

  it.each(["", "-1", "30,5", "30.1234567", ".5", "30.", "abc"])(
    "rejects invalid rate %j",
    (value) => {
      expect(() => parseHourlyRate(value)).toThrow(
        "Hourly rate must be a positive decimal with up to 6 decimal places.",
      );
    },
  );

  it("rejects a zero rate", () => {
    expect(() => parseHourlyRate("0")).toThrow(
      "Hourly rate must be greater than zero.",
    );
  });

  it("rejects a rate larger than a SQLite integer", () => {
    expect(() => parseHourlyRate("9223372036854.775808")).toThrow(
      "Hourly rate is too large.",
    );
  });
});
