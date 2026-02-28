import { BasePoller, type DetectedMatch } from "./BasePoller.js";
import type { LinkedAccount, PollState } from "@prisma/client";
import { epicClient } from "../../../integrations/epic/EpicClient.js";
import { logger } from "../../../utils/logger.js";

export class FortnitePoller extends BasePoller {
  readonly game = "fortnite" as const;

  async poll(
    linkedAccount: LinkedAccount,
    pollState: PollState | null,
  ): Promise<DetectedMatch[]> {
    if (!this.shouldPoll(pollState)) {
      return [];
    }

    try {
      const stats = await epicClient.getPlayerStats(
        linkedAccount.platformAccountId,
      );

      if (!stats) {
        return [];
      }

      const lastKnownMatches = parseInt(pollState?.lastMatchId || "0", 10);
      const currentMatches = stats.matchesPlayed || 0;

      if (currentMatches > lastKnownMatches) {
        const newMatches: DetectedMatch[] = [];
        const numNewMatches = currentMatches - lastKnownMatches;

        for (let i = 0; i < numNewMatches; i++) {
          newMatches.push({
            externalMatchId: `fn_${Date.now()}_${i}`,
            game: this.game,
            matchData: {
              result: "win",
            },
            timestamp: new Date(),
          });
        }

        logger.debug("Fortnite poller results", {
          accountId: linkedAccount.id,
          newMatches: newMatches.length,
        });

        return newMatches;
      }

      return [];
    } catch (error) {
      logger.error("Fortnite poller error", {
        accountId: linkedAccount.id,
        error: String(error),
      });
      return [];
    }
  }
}

export const fortnitePoller = new FortnitePoller();
