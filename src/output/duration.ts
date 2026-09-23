export function formatDuration(durationMilliseconds: number): string {
  if (
    !Number.isSafeInteger(durationMilliseconds) ||
    durationMilliseconds < 0
  ) {
    throw new Error("Duration must be a non-negative integer of milliseconds.");
  }

  const totalSeconds = Math.floor(durationMilliseconds / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}
