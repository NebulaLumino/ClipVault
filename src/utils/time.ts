export function millisecondsToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

export function secondsToMilliseconds(seconds: number): number {
  return seconds * 1000;
}

export function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}

export function hoursToMilliseconds(hours: number): number {
  return hours * 60 * 60 * 1000;
}

export function daysToMilliseconds(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

export function isExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

export function isWithinHours(date: Date, hours: number): boolean {
  const now = new Date();
  const hoursAgo = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return date >= hoursAgo;
}

export function isWithinMinutes(date: Date, minutes: number): boolean {
  const now = new Date();
  const minutesAgo = new Date(now.getTime() - minutes * 60 * 1000);
  return date >= minutesAgo;
}

export function getUnixTimestamp(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}

export function fromUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
}

export function convertToTimezone(date: Date, timezone: string): Date {
  const offset = getTimezoneOffset(timezone);
  return new Date(date.getTime() + offset * 60 * 1000);
}

export function getNextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  if (result <= now) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
