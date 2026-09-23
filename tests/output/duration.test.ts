import { describe, expect, it } from "vitest";

import { formatDuration } from "../../src/output/duration.js";

describe("formatDuration", () => {
  it.each([
    [0, "00:00:00"],
    [3_723_999, "01:02:03"],
    [98_108_000, "27:15:08"],
  ])("formats %s milliseconds as %s", (duration, expected) => {
    expect(formatDuration(duration)).toBe(expected);
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid duration %s",
    (duration) => {
      expect(() => formatDuration(duration)).toThrow(
        "Duration must be a non-negative integer of milliseconds.",
      );
    },
  );
});
