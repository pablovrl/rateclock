const MILLISECONDS_PER_HOUR = 3_600_000n;

export interface EarningsPeriod {
  ratePerHour: bigint;
  durationMilliseconds: number;
}

export function calculateEarnings(
  ratePerHour: bigint,
  durationMilliseconds: number,
): bigint {
  return calculateTotalEarnings([{ ratePerHour, durationMilliseconds }]);
}

export function calculateTotalEarnings(periods: EarningsPeriod[]): bigint {
  let numerator = 0n;

  for (const period of periods) {
    if (
      !Number.isSafeInteger(period.durationMilliseconds) ||
      period.durationMilliseconds < 0
    ) {
      throw new Error(
        "Duration must be a non-negative integer of milliseconds.",
      );
    }

    numerator += period.ratePerHour * BigInt(period.durationMilliseconds);
  }

  return (numerator + MILLISECONDS_PER_HOUR / 2n) / MILLISECONDS_PER_HOUR;
}
