import type { Command } from "commander";

import { openDatabase } from "../database/connection.js";
import { formatProjectReport } from "../output/project-report.js";
import {
  type DateRangeOptions,
  resolveLocalDateRange,
} from "../reports/date-range.js";
import { createProjectReport } from "../reports/project-report.js";

export function registerReportCommand(program: Command): void {
  program
    .command("report")
    .description("Report time and earnings for a project")
    .argument("<project>", "project name")
    .option("--date <date>", "local date in YYYY-MM-DD format")
    .option("--from <date>", "first local date in YYYY-MM-DD format")
    .option("--to <date>", "last local date in YYYY-MM-DD format")
    .action((projectName: string, options: DateRangeOptions) => {
      const range = resolveLocalDateRange(options);
      const database = openDatabase();

      try {
        const report = createProjectReport(database, projectName, range);

        console.log(formatProjectReport(report));
      } finally {
        database.close();
      }
    });
}
