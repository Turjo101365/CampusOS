const dateTimeFormatter = new Intl.DateTimeFormat("en-BD", {
  month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka"
});

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleTimeString("en-BD", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

export function titleCase(value: string): string {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** "2026-09-10T14:00:00.000Z" -> "2026-09-10T14:00" for an <input type="datetime-local"> value. */
export function isoToLocalInput(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : "";
}

/** "2026-09-10T14:00" from an <input type="datetime-local"> -> "2026-09-10T14:00:00.000Z". */
export function localInputToIso(value: string): string {
  return `${value}:00.000Z`;
}
