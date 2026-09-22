#!/usr/bin/env node

import { Command } from "commander";

import packageJson from "../package.json" with { type: "json" };

const program = new Command();

program
  .name("worktime")
  .description("CLI para registrar tiempo de trabajo e ingresos")
  .version(packageJson.version);

program.parse();
