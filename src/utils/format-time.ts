const TIME_UNITS = [
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
] as const;

export function formatTime(totalSeconds: number): string {
  let remainingSeconds = totalSeconds;
  const parts: string[] = [];

  for (const { unit, seconds } of TIME_UNITS) {
    if (remainingSeconds >= seconds) {
      const count = Math.floor(remainingSeconds / seconds);
      parts.push(`${count} ${unit}${count !== 1 ? "s" : ""}`);
      remainingSeconds %= seconds;
    }
  }

  if (parts.length === 0) {
    return "less than a second";
  }

  return parts.join(", ");
}
