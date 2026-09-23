import { formatMicrounits } from "../money/format.js";
import type { SessionStatus } from "../sessions/session-status.js";
import { formatDuration } from "./duration.js";

export function formatSessionStatus(status: SessionStatus): string {
  const { session } = status;

  return [
    `Project:     ${session.projectName}`,
    "Status:      working",
    `Duration:    ${formatDuration(status.durationMilliseconds)}`,
    `Rate:        ${formatMicrounits(session.rateSnapshot)} ${session.currencySnapshot}/h`,
    `Earned:      ${formatMicrounits(status.earnings)} ${session.currencySnapshot}`,
  ].join("\n");
}
