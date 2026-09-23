const MICROS_PER_UNIT = 1_000_000n;
const SQLITE_MAX_INTEGER = 9_223_372_036_854_775_807n;
const RATE_PATTERN = /^(\d+)(?:\.(\d{1,6}))?$/;

export function parseHourlyRate(value: string): bigint {
  const match = RATE_PATTERN.exec(value);

  if (!match || match[1] === undefined) {
    throw new Error(
      "Hourly rate must be a positive decimal with up to 6 decimal places.",
    );
  }

  const units = BigInt(match[1]);
  const fractionalDigits = match[2] ?? "";
  const micros = BigInt(fractionalDigits.padEnd(6, "0"));
  const rate = units * MICROS_PER_UNIT + micros;

  if (rate === 0n) {
    throw new Error("Hourly rate must be greater than zero.");
  }

  if (rate > SQLITE_MAX_INTEGER) {
    throw new Error("Hourly rate is too large.");
  }

  return rate;
}
