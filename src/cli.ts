#!/usr/bin/env node

import { Command } from "commander";

import packageJson from "../package.json" with { type: "json" };
import { registerProjectCommands } from "./commands/project.js";

const program = new Command();

program
  .name("worktime")
  .description("CLI para registrar tiempo de trabajo e ingresos")
  .version(packageJson.version);

registerProjectCommands(program);

try {
  program.parse();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error.";

  console.error(`Error: ${message}`);
  process.exitCode = 1;
}
