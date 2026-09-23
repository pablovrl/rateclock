function pad(value: number, length = 2): string {
  return value.toString().padStart(length, "0");
}

export function formatLocalDateTime(timestamp: number): string {
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new Error(
      "Timestamp must be a non-negative integer of milliseconds.",
    );
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Timestamp is outside the supported date range.");
  }

  return (
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
