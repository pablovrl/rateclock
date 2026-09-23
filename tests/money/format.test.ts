import { describe, expect, it } from "vitest";

import { formatMicrounits } from "../../src/money/format.js";

describe("formatMicrounits", () => {
  it.each([
    [0n, "0.00"],
    [30_000_000n, "30.00"],
    [30_500_000n, "30.50"],
    [30_123_456n, "30.123456"],
    [1n, "0.000001"],
    [-30_500_000n, "-30.50"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatMicrounits(value)).toBe(expected);
  });
});
