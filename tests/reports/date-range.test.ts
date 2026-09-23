import { describe, expect, it } from "vitest";

import { resolveLocalDateRange } from "../../src/reports/date-range.js";

describe("resolveLocalDateRange", () => {
  it("resolves one local date", () => {
    const range = resolveLocalDateRange({ date: "2026-09-23" });
    const start = new Date(range.startAt);
    const end = new Date(range.endAt);

    expect(range.from).toBe("2026-09-23");
    expect(range.to).toBe("2026-09-23");
    expect([
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
    ]).toEqual([2026, 9, 23, 0]);
    expect([
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
    ]).toEqual([2026, 9, 24, 0]);
  });

  it("resolves an inclusive local date range", () => {
    const range = resolveLocalDateRange({
      from: "2026-12-31",
      to: "2027-01-02",
    });
    const end = new Date(range.endAt);

    expect(range.from).toBe("2026-12-31");
    expect(range.to).toBe("2027-01-02");
    expect([end.getFullYear(), end.getMonth() + 1, end.getDate()]).toEqual([
      2027, 1, 3,
    ]);
  });

  it.each(["2026-02-30", "2026-13-01", "23-09-2026", "invalid"])(
    "rejects invalid date %j",
    (date) => {
      expect(() => resolveLocalDateRange({ date })).toThrow(
        `Invalid date "${date}". Use YYYY-MM-DD.`,
      );
    },
  );

  it("rejects incomplete, mixed, and reversed ranges", () => {
    expect(() => resolveLocalDateRange({})).toThrow(
      "Provide --date or both --from and --to.",
    );
    expect(() => resolveLocalDateRange({ from: "2026-09-23" })).toThrow(
      "--from and --to must be used together.",
    );
    expect(() =>
      resolveLocalDateRange({
        date: "2026-09-23",
        from: "2026-09-23",
        to: "2026-09-24",
      }),
    ).toThrow("Use either --date or --from with --to, not both.");
    expect(() =>
      resolveLocalDateRange({ from: "2026-09-24", to: "2026-09-23" }),
    ).toThrow("--from cannot be later than --to.");
  });
});
