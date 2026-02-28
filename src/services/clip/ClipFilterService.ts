import { linkedAccountRepository } from "../../db/repositories/LinkedAccountRepository.js";
import { matchRepository } from "../../db/repositories/MatchRepository.js";
import { clipRepository } from "../../db/repositories/ClipRepository.js";
import { logger } from "../../utils/logger.js";
import {
  PlatformType,
  GamePlatform,
  type MatchRecord,
  type ClipRecord,
} from "../../types/index.js";

export interface FilterCriteria {
  minMatchDuration?: number;
  maxClipsPerMatch?: number;
  clipTypes?: string[];
  excludeGameModes?: string[];
}

export interface ShouldRequestClipsResult {
  shouldRequest: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class ClipFilterService {
  private defaultCriteria: FilterCriteria = {
    minMatchDuration: 0,
    maxClipsPerMatch: 5,
    excludeGameModes: ["deathmatch", "practice"],
  };

  async shouldRequestClipsForMatch(
    match: MatchRecord,
    criteria: FilterCriteria = {},
  ): Promise<ShouldRequestClipsResult> {
    const mergedCriteria = { ...this.defaultCriteria, ...criteria };

    const existingClips = await clipRepository.findByMatchId(match.id);
    if (existingClips.length >= (mergedCriteria.maxClipsPerMatch ?? 5)) {
      return {
        shouldRequest: false,
        reason: "Maximum clips per match reached",
      };
    }

    const matchDuration = this.calculateMatchDuration(match);
    if (matchDuration < (mergedCriteria.minMatchDuration ?? 0)) {
      return {
        shouldRequest: false,
        reason: "Match duration too short",
        metadata: { matchDuration },
      };
    }

    const gameMode = this.extractGameMode(match);
    if (mergedCriteria.excludeGameModes?.includes(gameMode)) {
      return {
        shouldRequest: false,
        reason: `Game mode excluded: ${gameMode}`,
      };
    }

    return {
      shouldRequest: true,
      metadata: {
        gameMode,
        matchDuration,
        existingClips: existingClips.length,
      },
    };
  }

  async filterMatchesForClips(
    matches: MatchRecord[],
    criteria: FilterCriteria = {},
  ): Promise<MatchRecord[]> {
    const filteredMatches: MatchRecord[] = [];

    for (const match of matches) {
      const result = await this.shouldRequestClipsForMatch(match, criteria);
      if (result.shouldRequest) {
        filteredMatches.push(match);
      } else {
        logger.debug("Match filtered out", {
          matchId: match.id,
          reason: result.reason,
        });
      }
    }

    logger.info("Filtered matches for clips", {
      totalMatches: matches.length,
      filteredMatches: filteredMatches.length,
    });

    return filteredMatches;
  }

  async getUserClipPreferences(userId: string): Promise<{
    preferredClipTypes: string[];
    deliveryMethod: string;
  }> {
    const linkedAccounts = await linkedAccountRepository.findByUserId(userId);

    const preferences = {
      preferredClipTypes: ["highlight", "play_of_the_game", "clutch", "ace"],
      deliveryMethod: "dm",
    };

    return preferences;
  }

  private calculateMatchDuration(match: MatchRecord): number {
    if (!match.startedAt || !match.endedAt) {
      return 0;
    }
    return Math.floor(
      (match.endedAt.getTime() - match.startedAt.getTime()) / 1000,
    );
  }

  private extractGameMode(match: MatchRecord): string {
    const metadata = match.metadata as Record<string, unknown> | undefined;
    return (metadata?.gameMode as string) || "unknown";
  }
}

export const clipFilterService = new ClipFilterService();
