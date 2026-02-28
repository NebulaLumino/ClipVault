export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidDiscordId(id: string): boolean {
  return /^\d{17,19}$/.test(id);
}

export function isValidSnowflake(snowflake: string): boolean {
  return /^\d{17,19}$/.test(snowflake);
}

export function sanitizeString(input: string, maxLength = 1000): string {
  return input.trim().slice(0, maxLength);
}

export function sanitizeDiscordUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function validateRange(
  value: number,
  min: number,
  max: number,
): boolean {
  return value >= min && value <= max;
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${fieldName} is required`);
  }
}

export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string,
): void {
  if (value.length < min || value.length > max) {
    throw new Error(
      `${fieldName} must be between ${min} and ${max} characters`,
    );
  }
}

export function validateEnum<T>(
  value: T,
  allowedValues: T[],
  fieldName: string,
): void {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
  }
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export function validate<T>(value: T, rules: ValidationRule<T>[]): void {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      throw new Error(rule.message);
    }
  }
}

export function isValidPlatform(platform: string): boolean {
  const validPlatforms = ["steam", "riot", "epic", "discord", "faceit"];
  return validPlatforms.includes(platform.toLowerCase());
}

export function isValidGame(game: string): boolean {
  const validGames = ["cs2", "lol", "dota2", "fortnite"];
  return validGames.includes(game.toLowerCase());
}
