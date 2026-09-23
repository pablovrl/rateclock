# Rateclock

Rateclock is a Linux command-line application for tracking work sessions and
calculating earnings from project-specific hourly rates.

It stores data locally in SQLite, preserves the rate and currency used by each
session, and can display the active session in real time.

## Features

- Create, list, update, and archive projects.
- Start and stop one work session at a time.
- Watch elapsed time and accrued earnings update every second.
- Keep historical rates and currencies with each session.
- List active and completed sessions.
- Report time and earnings for a project by local date or inclusive date range.
- Persist data across CLI invocations and system restarts.
- Calculate money with integer microunits and `BigInt` instead of floating-point
  numbers.

## Requirements

- Linux
- Node.js 22 or newer
- pnpm 12 when building from source

`better-sqlite3` uses a native SQLite binary. The supported Linux x64 binary is
included by the installed package.

## Installation

Install Rateclock from npm with pnpm:

```bash
pnpm add --global @pablovrl/rateclock
```

Alternatively, use npm:

```bash
npm install --global @pablovrl/rateclock
```

Confirm the installation:

```bash
rateclock --version
# 0.1.0

rateclock --help
```

### Install from source

Clone the repository, install dependencies, and build the CLI:

```bash
git clone https://github.com/pablovrl/rateclock.git
cd rateclock
pnpm install
pnpm build
pnpm add --global .
```

During development, commands can also run directly from TypeScript:

```bash
pnpm dev --help
```

## Usage

### Projects

Create a project with an hourly rate and a three-letter uppercase currency:

```bash
rateclock project add client-a --rate 30.50 --currency USD
```

List active and archived projects:

```bash
rateclock project list
```

Update the hourly rate used by future sessions:

```bash
rateclock project update client-a --rate 45
```

Archive a project without deleting its history:

```bash
rateclock project archive client-a
```

Archived projects cannot start new sessions.

### Work sessions

Start a session:

```bash
rateclock start client-a
```

Only one unfinished session can exist at a time.

Show the current session once:

```bash
rateclock status
```

Continuously refresh the current session once per second:

```bash
rateclock status --watch
```

Press `Ctrl+C` to stop watching without stopping the work session. If another
process runs `rateclock stop`, watch mode detects it and exits automatically.

Stop the active session:

```bash
rateclock stop
```

The result includes the total duration and earnings for that session.

List active and completed sessions:

```bash
rateclock sessions list
```

Dates are displayed in the system's local time.

### Reports

Report one local calendar date:

```bash
rateclock report client-a --date 2026-09-23
```

Report an inclusive local date range:

```bash
rateclock report client-a --from 2026-09-01 --to 2026-09-30
```

Dates must use the `YYYY-MM-DD` format. Sessions crossing a period boundary are
clipped to the requested period. Active sessions count up to the current time.
