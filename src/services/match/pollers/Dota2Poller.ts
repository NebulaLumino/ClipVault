import { BasePoller, type DetectedMatch } from "./BasePoller.js";
import type { LinkedAccount, PollState } from "@prisma/client";
import { steamClient } from "../../../integrations/steam/SteamClient.js";
import { logger } from "../../../utils/logger.js";

export class Dota2Poller extends BasePoller {
  readonly game = "dota2" as const;

  async poll(
    linkedAccount: LinkedAccount,
    pollState: PollState | null,
  ): Promise<DetectedMatch[]> {
    if (!this.shouldPoll(pollState)) {
      return [];
    }

    try {
      const matches = await steamClient.getDota2MatchHistory(
        linkedAccount.platformAccountId,
        10,
      );

      const detectedMatches: DetectedMatch[] = matches.map((m) => ({
        externalMatchId: m.matchid,
        game: this.game,
        matchData: {
          result: m.result,
          hero: m.hero ? String(m.hero) : undefined,
        },
        timestamp: m.matchtime ? new Date(m.matchtime * 1000) : new Date(),
      }));

      const newMatches = this.filterNewMatches(
        detectedMatches,
        pollState?.lastMatchId,
      );
      const recentMatches = this.filterOldMatches(newMatches);

      logger.debug("Dota2 poller results", {
        accountId: linkedAccount.id,
        totalMatches: matches.length,
        newMatches: recentMatches.length,
      });

      return recentMatches;
    } catch (error) {
      logger.error("Dota2 poller error", {
        accountId: linkedAccount.id,
        error: String(error),
      });
      return [];
    }
  }
}

export const dota2Poller = new Dota2Poller();
