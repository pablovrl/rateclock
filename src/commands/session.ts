import type { Command } from "commander";

import { openDatabase } from "../database/connection.js";
import { calculateEarnings } from "../money/earnings.js";
import { formatMicrounits } from "../money/format.js";
import { formatDuration } from "../output/duration.js";
import { startSession } from "../sessions/start-session.js";
import { stopSession } from "../sessions/stop-session.js";

export function registerSessionCommands(program: Command): void {
  program
    .command("start")
    .description("Start a work session")
    .argument("<project>", "project name")
    .action((projectName: string) => {
      const database = openDatabase();

      try {
        const session = startSession(database, projectName);

        console.log(`Session started for project "${session.projectName}".`);
      } finally {
        database.close();
      }
    });

  program
    .command("stop")
    .description("Stop the active work session")
    .action(() => {
      const database = openDatabase();

      try {
        const session = stopSession(database);
        const duration = session.finishedAt - session.startedAt;
        const earnings = calculateEarnings(session.rateSnapshot, duration);

        console.log(`Session stopped for project "${session.projectName}".`);
        console.log(`Duration: ${formatDuration(duration)}`);
        console.log(
          `Earned:   ${formatMicrounits(earnings)} ${session.currencySnapshot}`,
        );
      } finally {
        database.close();
      }
    });
}
