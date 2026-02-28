import { GamePlatform, GameTitle, PlatformType } from "../types/index.js";
import { CLIP_PROCESSING_TIMES } from "./constants.js";

export interface GameDefinition {
  id: string;
  name: string;
  allstarGameId: string;
  platforms: string[];
  clipProcessingTimeMs: number;
  supportedModes: string[];
  requiredAccountFields: string[];
  enabled: boolean;
  regions?: string[];
}

export const GAMES: Record<string, GameDefinition> = {
  cs2: {
    id: "cs2",
    name: GameTitle.CS2,
    allstarGameId: "cs2",
    platforms: [PlatformType.STEAM, PlatformType.FACEIT],
    clipProcessingTimeMs: CLIP_PROCESSING_TIMES.cs2,
    supportedModes: ["competitive", "wingman"],
    requiredAccountFields: ["steam64Id", "shareCodes"],
    enabled: true,
  },
  lol: {
    id: "lol",
    name: GameTitle.LOL,
    allstarGameId: "lol",
    platforms: [PlatformType.RIOT],
    clipProcessingTimeMs: CLIP_PROCESSING_TIMES.lol,
    supportedModes: ["ranked_solo", "ranked_flex", "normal_draft"],
    requiredAccountFields: ["puuid", "region"],
    enabled: true,
    regions: [
      "na1",
      "euw1",
      "eun1",
      "kr",
      "jp1",
      "br1",
      "la1",
      "la2",
      "oc1",
      "tr1",
      "ru",
    ],
  },
  dota2: {
    id: "dota2",
    name: GameTitle.DOTA2,
    allstarGameId: "dota2",
    platforms: [PlatformType.STEAM],
    clipProcessingTimeMs: CLIP_PROCESSING_TIMES.dota2,
    supportedModes: ["all_pick", "ranked"],
    requiredAccountFields: ["steam64Id"],
    enabled: true,
  },
  fortnite: {
    id: "fortnite",
    name: GameTitle.FORTNITE,
    allstarGameId: "fortnite",
    platforms: [PlatformType.EPIC],
    clipProcessingTimeMs: CLIP_PROCESSING_TIMES.fortnite,
    supportedModes: ["battle_royale", "ranked"],
    requiredAccountFields: ["epicId"],
    enabled: false,
  },
};

export const PLATFORM_TO_GAME_MAP: Record<string, string[]> = {
  steam: [GamePlatform.CS2, GamePlatform.DOTA2],
  riot: [GamePlatform.LEAGUE_OF_LEGENDS],
  epic: [GamePlatform.FORTNITE],
  discord: [],
  faceit: [GamePlatform.CS2],
};

export function getGameByPlatform(platform: string): string | null {
  const games = PLATFORM_TO_GAME_MAP[platform];
  return games?.[0] || null;
}

export function getGamesByPlatform(platform: string): string[] {
  return PLATFORM_TO_GAME_MAP[platform] || [];
}

export function getGameDefinition(game: string): GameDefinition | undefined {
  return GAMES[game];
}

export function isGameEnabled(game: string): boolean {
  return GAMES[game]?.enabled ?? false;
}

export function getEnabledGames(): GameDefinition[] {
  return Object.values(GAMES).filter((game) => game.enabled);
}

export const GAME_PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  cs2: "Counter-Strike 2",
  lol: "League of Legends",
  dota2: "Dota 2",
  fortnite: "Fortnite",
};

export const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  steam: "Steam",
  riot: "Riot Games",
  epic: "Epic Games",
  discord: "Discord",
  faceit: "FACEIT",
};
