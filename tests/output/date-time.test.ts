import { describe, expect, it } from "vitest";

import { formatLocalDateTime } from "../../src/output/date-time.js";

describe("formatLocalDateTime", () => {
  it("formats a timestamp in the system local time", () => {
    const timestamp = new Date(2026, 0, 2, 3, 4, 5).getTime();

    expect(formatLocalDateTime(timestamp)).toBe("2026-01-02 03:04:05");
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid timestamp %s",
    (timestamp) => {
      expect(() => formatLocalDateTime(timestamp)).toThrow(
        "Timestamp must be a non-negative integer of milliseconds.",
      );
    },
  );
});
