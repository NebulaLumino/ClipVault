import { BasePoller, type DetectedMatch } from "./BasePoller.js";
import type { LinkedAccount, PollState } from "@prisma/client";
import { leetifyClient } from "../../../integrations/leetify/LeetifyClient.js";
import { logger } from "../../../utils/logger.js";

export class CS2Poller extends BasePoller {
  readonly game = "cs2" as const;

  async poll(
    linkedAccount: LinkedAccount,
    pollState: PollState | null,
  ): Promise<DetectedMatch[]> {
    if (!this.shouldPoll(pollState)) {
      return [];
    }

    try {
      const matches = await leetifyClient.getMatchHistory(
        linkedAccount.platformAccountId,
        10,
      );

      const detectedMatches: DetectedMatch[] = matches.map((m) => ({
        externalMatchId: m.matchId,
        game: this.game,
        matchData: {
          map: m.mapName,
          mode: m.gameMode,
          score: `${m.scores.team1}-${m.scores.team2}`,
          kills: m.playerStats.kills,
          deaths: m.playerStats.deaths,
          assists: m.playerStats.assists,
          adr: m.playerStats.adr,
          rating: m.playerStats.rating,
          dataSource: m.dataSource,
          dataSourceMatchId: m.dataSourceMatchId,
        },
        timestamp: new Date(m.finishedAt),
      }));

      const newMatches = this.filterNewMatches(
        detectedMatches,
        pollState?.lastMatchId,
      );
      const recentMatches = this.filterOldMatches(newMatches);

      logger.debug("CS2 poller results", {
        accountId: linkedAccount.id,
        totalMatches: matches.length,
        newMatches: recentMatches.length,
      });

      return recentMatches;
    } catch (error) {
      logger.error("CS2 poller error", {
        accountId: linkedAccount.id,
        error: String(error),
      });
      return [];
    }
  }
}

export const cs2Poller = new CS2Poller();
