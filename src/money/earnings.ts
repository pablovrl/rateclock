const MILLISECONDS_PER_HOUR = 3_600_000n;

export function calculateEarnings(
  ratePerHour: bigint,
  durationMilliseconds: number,
): bigint {
  if (
    !Number.isSafeInteger(durationMilliseconds) ||
    durationMilliseconds < 0
  ) {
    throw new Error("Duration must be a non-negative integer of milliseconds.");
  }

  const numerator = ratePerHour * BigInt(durationMilliseconds);

  return (
    numerator + MILLISECONDS_PER_HOUR / 2n
  ) / MILLISECONDS_PER_HOUR;
}
