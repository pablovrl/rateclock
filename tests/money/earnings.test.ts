import { describe, expect, it } from "vitest";

import {
  calculateEarnings,
  calculateTotalEarnings,
} from "../../src/money/earnings.js";

describe("calculateEarnings", () => {
  it.each([
    [30_000_000n, 3_600_000, 30_000_000n],
    [30_000_000n, 5_400_000, 45_000_000n],
    [1n, 1_799_999, 0n],
    [1n, 1_800_000, 1n],
  ])(
    "calculates %s microunits per hour over %s milliseconds",
    (rate, duration, expected) => {
      expect(calculateEarnings(rate, duration)).toBe(expected);
    },
  );

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid duration %s",
    (duration) => {
      expect(() => calculateEarnings(30_000_000n, duration)).toThrow(
        "Duration must be a non-negative integer of milliseconds.",
      );
    },
  );

  it("sums exact values before rounding the total", () => {
    expect(
      calculateTotalEarnings([
        { ratePerHour: 1n, durationMilliseconds: 1_800_000 },
        { ratePerHour: 1n, durationMilliseconds: 1_800_000 },
      ]),
    ).toBe(1n);
  });
});
