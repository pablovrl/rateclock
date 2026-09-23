import { join } from "node:path";

const APPLICATION_DIRECTORY = "rateclock";
const DATABASE_FILENAME = "rateclock.db";

export function resolveDatabasePath(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const dataHome = environment.XDG_DATA_HOME;

  if (dataHome) {
    return join(dataHome, APPLICATION_DIRECTORY, DATABASE_FILENAME);
  }

  const home = environment.HOME;

  if (!home) {
    throw new Error(
      "Cannot determine the data directory: XDG_DATA_HOME and HOME are not set.",
    );
  }

  return join(
    home,
    ".local",
    "share",
    APPLICATION_DIRECTORY,
    DATABASE_FILENAME,
  );
}
