import type { Command } from "commander";

import { openDatabase } from "../database/connection.js";
import { startSession } from "../sessions/start-session.js";

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
}
