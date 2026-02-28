import { BasePoller, type DetectedMatch } from "./BasePoller.js";
import type { LinkedAccount, PollState } from "@prisma/client";
import { riotClient } from "../../../integrations/riot/RiotClient.js";
import { logger } from "../../../utils/logger.js";

export class LoLPoller extends BasePoller {
  readonly game = "lol" as const;

  async poll(
    linkedAccount: LinkedAccount,
    pollState: PollState | null,
  ): Promise<DetectedMatch[]> {
    if (!this.shouldPoll(pollState)) {
      return [];
    }

    try {
      const matchIds = await riotClient.getMatchList(
        linkedAccount.platformAccountId,
      );

      const detectedMatches: DetectedMatch[] = matchIds.map((matchId) => ({
        externalMatchId: matchId,
        game: this.game,
        matchData: {},
        timestamp: new Date(),
      }));

      const newMatches = this.filterNewMatches(
        detectedMatches,
        pollState?.lastMatchId,
      );

      logger.debug("LoL poller results", {
        accountId: linkedAccount.id,
        totalMatches: matchIds.length,
        newMatches: newMatches.length,
      });

      return newMatches;
    } catch (error) {
      logger.error("LoL poller error", {
        accountId: linkedAccount.id,
        error: String(error),
      });
      return [];
    }
  }
}

export const lolPoller = new LoLPoller();
