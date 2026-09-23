const MICROS_PER_UNIT = 1_000_000n;

export function formatMicrounits(value: bigint): string {
  const negative = value < 0n;
  const absoluteValue = negative ? -value : value;
  const units = absoluteValue / MICROS_PER_UNIT;
  const micros = absoluteValue % MICROS_PER_UNIT;
  const fractionalPart = micros
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "")
    .padEnd(2, "0");

  return `${negative ? "-" : ""}${units}.${fractionalPart}`;
}
