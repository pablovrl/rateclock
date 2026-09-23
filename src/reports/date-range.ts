export interface LocalDateRange {
  from: string;
  to: string;
  startAt: number;
  endAt: number;
}

export interface DateRangeOptions {
  date?: string;
  from?: string;
  to?: string;
}

function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (
    !match ||
    match[1] === undefined ||
    match[2] === undefined ||
    match[3] === undefined
  ) {
    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);

  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
  }

  return date;
}

function startOfNextLocalDay(date: Date): number {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  return nextDay.getTime();
}

export function resolveLocalDateRange(
  options: DateRangeOptions,
): LocalDateRange {
  if (options.date && (options.from || options.to)) {
    throw new Error("Use either --date or --from with --to, not both.");
  }

  if (options.date) {
    const date = parseLocalDate(options.date);

    return {
      from: options.date,
      to: options.date,
      startAt: date.getTime(),
      endAt: startOfNextLocalDay(date),
    };
  }

  if ((options.from && !options.to) || (!options.from && options.to)) {
    throw new Error("--from and --to must be used together.");
  }

  if (!options.from || !options.to) {
    throw new Error("Provide --date or both --from and --to.");
  }

  const from = parseLocalDate(options.from);
  const to = parseLocalDate(options.to);

  if (from.getTime() > to.getTime()) {
    throw new Error("--from cannot be later than --to.");
  }

  return {
    from: options.from,
    to: options.to,
    startAt: from.getTime(),
    endAt: startOfNextLocalDay(to),
  };
}
