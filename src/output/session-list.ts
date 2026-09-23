import { calculateEarnings } from "../money/earnings.js";
import { formatMicrounits } from "../money/format.js";
import type { Session } from "../sessions/session.js";
import { formatLocalDateTime } from "./date-time.js";
import { formatDuration } from "./duration.js";

export function formatSessionListEntry(
  session: Session,
  currentTime: number,
): string {
  const effectiveEnd = session.finishedAt ?? currentTime;

  if (effectiveEnd < session.startedAt) {
    throw new Error(
      "Current time cannot be earlier than the session start time.",
    );
  }

  const duration = effectiveEnd - session.startedAt;
  const earnings = calculateEarnings(session.rateSnapshot, duration);
  const end =
    session.finishedAt === null
      ? "active"
      : formatLocalDateTime(session.finishedAt);

  return (
    `#${session.id} ${session.projectName} | ` +
    `${formatLocalDateTime(session.startedAt)} → ${end} | ` +
    `${formatDuration(duration)} | ` +
    `${formatMicrounits(earnings)} ${session.currencySnapshot}`
  );
}
