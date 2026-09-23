import { describe, expect, it } from "vitest";

import { validateProjectInput } from "../../src/projects/validation.js";

describe("validateProjectInput", () => {
  it("validates and normalizes project input", () => {
    expect(
      validateProjectInput({
        name: "  client-a  ",
        rate: "30.5",
        currency: "EUR",
      }),
    ).toEqual({
      name: "client-a",
      ratePerHour: 30_500_000n,
      currency: "EUR",
    });
  });

  it("rejects an empty project name", () => {
    expect(() =>
      validateProjectInput({ name: "   ", rate: "30", currency: "EUR" }),
    ).toThrow("Project name cannot be empty.");
  });

  it.each(["eur", "EU", "EURO", "E1R"])(
    "rejects invalid currency %j",
    (currency) => {
      expect(() =>
        validateProjectInput({ name: "client-a", rate: "30", currency }),
      ).toThrow("Currency must be exactly 3 uppercase letters.");
    },
  );
});
