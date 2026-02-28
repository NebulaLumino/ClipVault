import type { LinkedAccount, PollState } from "@prisma/client";
import type { GamePlatform } from "../../../types/index.js";

export interface DetectedMatch {
  externalMatchId: string;
  game: GamePlatform;
  matchData: MatchData;
  timestamp: Date;
}

export interface MatchData {
  map?: string;
  mode?: string;
  result?: "win" | "loss" | "draw";
  score?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  duration?: number;
  champion?: string;
  hero?: string;
  [key: string]: unknown;
}

export abstract class BasePoller {
  abstract readonly game: GamePlatform;

  abstract poll(
    linkedAccount: LinkedAccount,
    pollState: PollState | null,
  ): Promise<DetectedMatch[]>;

  protected shouldPoll(pollState: PollState | null): boolean {
    if (!pollState) {
      return true;
    }

    if (!pollState.pollingEnabled) {
      return false;
    }

    const lastChecked = pollState.lastCheckedAt;
    if (!lastChecked) {
      return true;
    }

    const now = new Date();
    const timeSinceLastCheck = now.getTime() - lastChecked.getTime();
    const minInterval = 60 * 1000;

    return timeSinceLastCheck >= minInterval;
  }

  protected filterNewMatches(
    matches: DetectedMatch[],
    lastKnownMatchId?: string | null,
  ): DetectedMatch[] {
    if (!lastKnownMatchId) {
      return matches;
    }

    const lastKnownIndex = matches.findIndex(
      (m) => m.externalMatchId === lastKnownMatchId,
    );
    if (lastKnownIndex === -1) {
      return matches;
    }

    return matches.slice(0, lastKnownIndex);
  }

  protected filterOldMatches(
    matches: DetectedMatch[],
    maxAgeHours = 24,
  ): DetectedMatch[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - maxAgeHours);

    return matches.filter((m) => m.timestamp >= cutoff);
  }
}
