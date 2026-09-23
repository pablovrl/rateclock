import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import packageJson from "../package.json" with { type: "json" };

describe("rateclock CLI", () => {
  it("displays the version defined in package.json", () => {
    const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
    const output = execFileSync(process.execPath, [cliPath, "--version"], {
      encoding: "utf8",
    });

    expect(output.trim()).toBe(packageJson.version);
  });
});
