import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const cliPath = fileURLToPath(new URL("../../dist/cli.js", import.meta.url));

describe("rateclock project add", () => {
  it("creates a project and reports a duplicate name", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "rateclock-"));
    const environment = {
      ...process.env,
      XDG_DATA_HOME: temporaryDirectory,
    };
    const args = [
      cliPath,
      "project",
      "add",
      "client-a",
      "--rate",
      "30.5",
      "--currency",
      "EUR",
    ];

    try {
      const firstRun = spawnSync(process.execPath, args, {
        encoding: "utf8",
        env: environment,
      });

      expect(firstRun.status).toBe(0);
      expect(firstRun.stdout).toBe('Project "client-a" created.\n');
      expect(firstRun.stderr).toBe("");

      const secondRun = spawnSync(process.execPath, args, {
        encoding: "utf8",
        env: environment,
      });

      expect(secondRun.status).toBe(1);
      expect(secondRun.stdout).toBe("");
      expect(secondRun.stderr).toBe(
        'Error: Project "client-a" already exists.\n',
      );
    } finally {
      rmSync(temporaryDirectory, { force: true, recursive: true });
    }
  });
});
