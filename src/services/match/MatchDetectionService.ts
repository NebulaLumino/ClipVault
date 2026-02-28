import { linkedAccountRepository } from "../../db/repositories/LinkedAccountRepository.js";
import { matchRepository } from "../../db/repositories/MatchRepository.js";
import { cs2Poller } from "./pollers/CS2Poller.js";
import { lolPoller } from "./pollers/LoLPoller.js";
import { dota2Poller } from "./pollers/Dota2Poller.js";
import { fortnitePoller } from "./pollers/FortnitePoller.js";
import type { BasePoller } from "./pollers/BasePoller.js";
import { logger } from "../../utils/logger.js";

const POLLER_MAP: Record<string, BasePoller> = {
  steam: cs2Poller,
  riot: lolPoller,
  epic: fortnitePoller,
  discord: cs2Poller,
  faceit: cs2Poller,
};

const GAME_PLATFORM_MAP: Record<string, string> = {
  steam: "cs2",
  riot: "lol",
  epic: "fortnite",
  discord: "cs2",
  faceit: "cs2",
};

export class MatchDetectionService {
  async detectMatchesForAllAccounts(): Promise<{
    accountsChecked: number;
    matchesFound: number;
  }> {
    const accounts =
      await linkedAccountRepository.findAllLinkedWithPollStateEnabled();

    let accountsChecked = 0;
    let matchesFound = 0;

    for (const account of accounts) {
      const result = await this.detectMatchesForAccount(account.id);
      accountsChecked++;
      matchesFound += result;
    }

    return { accountsChecked, matchesFound };
  }

  async detectMatchesForAccount(linkedAccountId: string): Promise<number> {
    const account =
      await linkedAccountRepository.findByIdWithPollState(linkedAccountId);

    if (!account) {
      logger.warn("Account not found", { linkedAccountId });
      return 0;
    }

    const platformKey = account.platform;
    const poller = POLLER_MAP[platformKey];
    if (!poller) {
      logger.warn("No poller found for platform", {
        platform: account.platform,
      });
      return 0;
    }

    try {
      const detectedMatches = await poller.poll(account, account.pollState);

      if (detectedMatches.length === 0) {
        return 0;
      }

      let createdCount = 0;

      for (const match of detectedMatches) {
        const existingMatch = await matchRepository.findByPlatformMatchId(
          account.platform,
          match.externalMatchId,
        );

        if (existingMatch) {
          continue;
        }

        await matchRepository.create({
          userId: account.userId,
          platform: account.platform,
          gameTitle: match.game as "cs2" | "lol" | "dota2" | "fortnite",
          matchId: match.externalMatchId,
          platformMatchId: match.externalMatchId,
          metadata: match.matchData,
        });

        createdCount++;
      }

      if (detectedMatches.length > 0) {
        const latestMatchId = detectedMatches[0].externalMatchId;
        await linkedAccountRepository.upsertPollState(
          linkedAccountId,
          latestMatchId,
        );
      }

      logger.info("Detected matches", {
        accountId: linkedAccountId,
        platform: account.platform,
        detected: detectedMatches.length,
        created: createdCount,
      });

      return createdCount;
    } catch (error) {
      logger.error("Match detection error", {
        accountId: linkedAccountId,
        platform: account.platform,
        error: String(error),
      });
      return 0;
    }
  }

  getPollerForPlatform(platform: string): BasePoller | undefined {
    return POLLER_MAP[platform];
  }

  getGameForPlatform(platform: string): string {
    return GAME_PLATFORM_MAP[platform] || "cs2";
  }
}

export const matchDetectionService = new MatchDetectionService();
