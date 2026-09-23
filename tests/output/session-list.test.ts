import { describe, expect, it } from "vitest";

import { formatSessionListEntry } from "../../src/output/session-list.js";
import type { Session } from "../../src/sessions/session.js";

const startedAt = new Date(2026, 0, 2, 9, 0, 0).getTime();

const session: Session = {
  id: 1n,
  projectId: 1n,
  projectName: "client-a",
  rateSnapshot: 30_000_000n,
  currencySnapshot: "EUR",
  startedAt,
  finishedAt: startedAt + 5_400_000,
};

describe("formatSessionListEntry", () => {
  it("formats a finished session", () => {
    expect(formatSessionListEntry(session, startedAt + 10_000_000)).toBe(
      "#1 client-a | 2026-01-02 09:00:00 → 2026-01-02 10:30:00 | " +
        "01:30:00 | 45.00 EUR",
    );
  });

  it("formats an active session using the current time", () => {
    expect(
      formatSessionListEntry(
        { ...session, id: 2n, finishedAt: null },
        startedAt + 3_600_000,
      ),
    ).toBe("#2 client-a | 2026-01-02 09:00:00 → active | 01:00:00 | 30.00 EUR");
  });
});
