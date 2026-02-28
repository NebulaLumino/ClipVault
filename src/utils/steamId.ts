export function steam64ToSteam32(steam64: string): string {
  const num = BigInt(steam64) - 76561197960265728n;
  return num.toString();
}

export function steam32ToSteam64(steam32: string): string {
  const num = BigInt(steam32) + 76561197960265728n;
  return num.toString();
}

export function isValidSteam64(steamId: string): boolean {
  return /^\d{17}$/.test(steamId);
}

export function isValidSteam32(steamId: string): boolean {
  const num = parseInt(steamId, 10);
  return !isNaN(num) && num >= 0 && num <= 4294967295;
}

export function parseSteamId(
  steamId: string,
): { is64: boolean; id: string } | null {
  if (isValidSteam64(steamId)) {
    return { is64: true, id: steamId };
  }
  if (isValidSteam32(steamId)) {
    return { is64: false, id: steamId };
  }
  return null;
}

export function getSteamId64(steamId: string): string | null {
  const parsed = parseSteamId(steamId);
  if (!parsed) return null;

  if (parsed.is64) {
    return parsed.id;
  }
  return steam32ToSteam64(parsed.id);
}

export function getSteamId3(steam64: string): string {
  const num = BigInt(steam64) - 76561197960265728n;
  return `U:1:${num}`;
}

export function getSteamCommunityUrl(steam64: string): string {
  return `https://steamcommunity.com/profiles/${steam64}`;
}

export function getSteamIdFromUrl(url: string): string | null {
  const profileMatch = url.match(/steamcommunity\.com\/profiles\/(\d+)/);
  if (profileMatch) {
    return profileMatch[1];
  }

  const idMatch = url.match(/steamcommunity\.com\/id\/([^/]+)/);
  if (idMatch) {
    return idMatch[1];
  }

  return null;
}
