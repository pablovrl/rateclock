import { clearScreenDown, cursorTo, moveCursor } from "node:readline";

import type { Command } from "commander";

import { systemClock } from "../clock/clock.js";
import { openDatabase } from "../database/connection.js";
import { calculateEarnings } from "../money/earnings.js";
import { formatMicrounits } from "../money/format.js";
import { formatDuration } from "../output/duration.js";
import { formatSessionListEntry } from "../output/session-list.js";
import { formatSessionStatus } from "../output/session-status.js";
import { listSessions } from "../sessions/list-sessions.js";
import { getSessionStatus } from "../sessions/session-status.js";
import { startSession } from "../sessions/start-session.js";
import { stopSession } from "../sessions/stop-session.js";
import { watchSessionStatus } from "../sessions/watch-session-status.js";

interface StatusOptions {
  watch: boolean;
}

export function registerSessionCommands(program: Command): void {
  const sessionsCommand = program
    .command("sessions")
    .description("Manage work session history");

  sessionsCommand
    .command("list")
    .description("List work sessions")
    .action(() => {
      const database = openDatabase();

      try {
        const sessions = listSessions(database);

        if (sessions.length === 0) {
          console.log("No sessions found.");
          return;
        }

        const currentTime = systemClock.now();

        for (const session of sessions) {
          console.log(formatSessionListEntry(session, currentTime));
        }
      } finally {
        database.close();
      }
    });

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

  program
    .command("status")
    .description("Show the active work session")
    .option("--watch", "refresh the status every second", false)
    .action((options: StatusOptions) => {
      const database = openDatabase();

      if (!options.watch) {
        try {
          const status = getSessionStatus(database);

          console.log(status ? formatSessionStatus(status) : "No active session.");
        } finally {
          database.close();
        }

        return;
      }

      let renderedLineCount = 0;

      watchSessionStatus({
        readStatus: () => getSessionStatus(database),
        render: (status) => {
          const output = status
            ? formatSessionStatus(status)
            : "No active session.";

          if (process.stdout.isTTY && renderedLineCount > 0) {
            moveCursor(process.stdout, 0, -renderedLineCount);
            cursorTo(process.stdout, 0);
            clearScreenDown(process.stdout);
          }

          process.stdout.write(`${output}\n`);
          renderedLineCount = output.split("\n").length;
        },
        registerInterrupt: (listener) => {
          process.once("SIGINT", listener);

          return () => process.off("SIGINT", listener);
        },
        onStop: () => database.close(),
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Unknown error.";

          console.error(`Error: ${message}`);
          process.exitCode = 1;
        },
        setInterval,
        clearInterval,
      });
    });
}
