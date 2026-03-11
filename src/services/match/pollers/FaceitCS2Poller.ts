import { BasePoller, type DetectedMatch } from "./BasePoller.js";
import type { LinkedAccount, PollState } from "@prisma/client";
import { faceitClient } from "../../../integrations/faceit/FaceitClient.js";
import { logger } from "../../../utils/logger.js";

function determineResult(playerId: string, match: any): "win" | "loss" | "draw" {
  // Find which team the player was on and check if that team won
  for (const [teamKey, team] of Object.entries(match.teams)) {
    const teamData = team as { players: Array<{ player_id: string }> };
    const playerInTeam = teamData.players.some(p => p.player_id === playerId);

    if (playerInTeam) {
      return match.results.winner === teamKey ? "win" : "loss";
    }
  }

  return "draw"; // fallback
}

export class FaceitCS2Poller extends BasePoller {
  readonly game = "cs2" as const;

  async poll(
    linkedAccount: LinkedAccount,
    pollState: PollState | null,
  ): Promise<DetectedMatch[]> {
    if (!this.shouldPoll(pollState)) {
      return [];
    }

    try {
      const matches = await faceitClient.getMatchHistory(
        linkedAccount.platformAccountId, // FACEIT player ID
        "cs2",
        10,
      );

      const detectedMatches: DetectedMatch[] = matches.map((m) => ({
        externalMatchId: m.match_id,
        game: this.game,
        matchData: {
          score: `${m.results.score.team1}-${m.results.score.team2}`,
          result: determineResult(linkedAccount.platformAccountId, m),
          mode: m.competition_type,
          dataSource: "faceit",
          dataSourceMatchId: m.match_id, // For cross-platform dedup
        },
        timestamp: new Date(m.finished_at * 1000),
      }));

      const newMatches = this.filterNewMatches(
        detectedMatches,
        pollState?.lastMatchId,
      );
      const recentMatches = this.filterOldMatches(newMatches);

      logger.debug("FACEIT CS2 poller results", {
        accountId: linkedAccount.id,
        totalMatches: matches.length,
        newMatches: recentMatches.length,
      });

      return recentMatches;
    } catch (error) {
      logger.error("FACEIT CS2 poller error", {
        accountId: linkedAccount.id,
        error: String(error),
      });
      return [];
    }
  }
}

export const faceitCS2Poller = new FaceitCS2Poller();