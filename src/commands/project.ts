import type { Command } from "commander";

import { openDatabase } from "../database/connection.js";
import { formatMicrounits } from "../money/format.js";
import { createProject } from "../projects/create-project.js";
import { listProjects } from "../projects/list-projects.js";

interface AddProjectOptions {
  rate: string;
  currency: string;
}

export function registerProjectCommands(program: Command): void {
  const projectCommand = program
    .command("project")
    .description("Manage projects");

  projectCommand
    .command("add")
    .description("Create a project")
    .argument("<name>", "project name")
    .requiredOption("--rate <rate>", "hourly rate")
    .requiredOption("--currency <currency>", "three-letter currency code")
    .action((name: string, options: AddProjectOptions) => {
      const database = openDatabase();

      try {
        const project = createProject(database, {
          name,
          rate: options.rate,
          currency: options.currency,
        });

        console.log(`Project "${project.name}" created.`);
      } finally {
        database.close();
      }
    });

  projectCommand
    .command("list")
    .description("List projects")
    .action(() => {
      const database = openDatabase();

      try {
        const projects = listProjects(database);

        if (projects.length === 0) {
          console.log("No projects found.");
          return;
        }

        for (const project of projects) {
          const rate = formatMicrounits(project.ratePerHour);
          const status = project.active ? "active" : "archived";

          console.log(
            `${project.name}  ${rate} ${project.currency}/h  ${status}`,
          );
        }
      } finally {
        database.close();
      }
    });
}
