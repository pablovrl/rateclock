import { parseHourlyRate } from "../money/rate.js";

export interface ProjectInput {
  name: string;
  rate: string;
  currency: string;
}

export interface ValidatedProjectInput {
  name: string;
  ratePerHour: bigint;
  currency: string;
}

export function validateProjectName(value: string): string {
  const name = value.trim();

  if (!name) {
    throw new Error("Project name cannot be empty.");
  }

  return name;
}

export function validateProjectInput(
  input: ProjectInput,
): ValidatedProjectInput {
  const name = validateProjectName(input.name);

  if (!/^[A-Z]{3}$/.test(input.currency)) {
    throw new Error("Currency must be exactly 3 uppercase letters.");
  }

  return {
    name,
    ratePerHour: parseHourlyRate(input.rate),
    currency: input.currency,
  };
}
