import { formatMicrounits } from "../money/format.js";
import type { ProjectReport } from "../reports/project-report.js";
import { formatDuration } from "./duration.js";

export function formatProjectReport(report: ProjectReport): string {
  const period =
    report.range.from === report.range.to
      ? report.range.from
      : `${report.range.from} → ${report.range.to}`;
  const earnings = report.earnings.map(
    (total) => `Earned:    ${formatMicrounits(total.amount)} ${total.currency}`,
  );

  return [
    `Project:   ${report.projectName}`,
    `Period:    ${period}`,
    `Duration:  ${formatDuration(report.durationMilliseconds)}`,
    ...earnings,
  ].join("\n");
}
