import { config } from "../../config/index.js";
import { API_ENDPOINTS } from "../../config/constants.js";
import { logger } from "../../utils/logger.js";

export interface LeetifyMatch {
  matchId: string;
  finishedAt: string;
  mapName: string;
  gameMode: string;
  dataSource: string;
  dataSourceMatchId?: string;
  scores: { team1: number; team2: number };
  playerStats: LeetifyPlayerStats;
}

export interface LeetifyPlayerStats {
  steam64Id: string;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  adr: number;
  rating: number;
  [key: string]: unknown;
}

export interface LeetifyMatchDetail {
  matchId: string;
  finishedAt: string;
  mapName: string;
  players: LeetifyPlayerStats[];
}

export class LeetifyError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "LeetifyError";
  }
}

export class LeetifyClient {
  private readonly baseUrl = API_ENDPOINTS.LEETIFY_BASE;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.LEETIFY_API_KEY || "";

    if (!this.apiKey) {
      logger.warn("Leetify API key not configured");
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async getMatchHistory(steam64Id: string, limit = 10): Promise<LeetifyMatch[]> {
    if (!this.apiKey) {
      throw new LeetifyError("Leetify API key not configured", "NOT_CONFIGURED");
    }

    const url = `${this.baseUrl}/v3/profile/matches?steam64_id=${steam64Id}&limit=${limit}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new LeetifyError(
          "Failed to fetch match history",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = await response.json() as { matches?: Array<Record<string, unknown>> };

      // Log full response in debug mode for initial development
      logger.debug("Leetify API response", { data });

      const matches = data.matches || [];
      return matches.map((m) => ({
        matchId: String(m.matchId || m.id),
        finishedAt: String(m.finishedAt || m.finished_at),
        mapName: String(m.mapName || m.map || ""),
        gameMode: String(m.gameMode || m.game_mode || ""),
        dataSource: String(m.dataSource || m.data_source || "matchmaking"),
        dataSourceMatchId: m.dataSourceMatchId ? String(m.dataSourceMatchId) : undefined,
        scores: {
          team1: Number((m.scores as any)?.team1 || m.team1Score || 0),
          team2: Number((m.scores as any)?.team2 || m.team2Score || 0),
        },
        playerStats: {
          steam64Id: steam64Id,
          kills: Number(m.kills || 0),
          deaths: Number(m.deaths || 0),
          assists: Number(m.assists || 0),
          headshots: Number(m.headshots || 0),
          adr: Number(m.adr || 0),
          rating: Number(m.rating || 0),
        },
      }));
    } catch (error) {
      if (error instanceof LeetifyError) throw error;
      logger.error("Leetify API error", { error: String(error) });
      throw new LeetifyError(String(error), "REQUEST_FAILED");
    }
  }

  async getMatchDetails(
    dataSource: string,
    dataSourceId: string,
  ): Promise<LeetifyMatchDetail | null> {
    if (!this.apiKey) {
      throw new LeetifyError("Leetify API key not configured", "NOT_CONFIGURED");
    }

    const url = `${this.baseUrl}/v2/matches/${dataSource}/${dataSourceId}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new LeetifyError(
          "Failed to fetch match details",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = await response.json() as Record<string, unknown>;

      logger.debug("Leetify match details response", { data });

      return {
        matchId: String(data.matchId || data.id),
        finishedAt: String(data.finishedAt || data.finished_at),
        mapName: String(data.mapName || data.map || ""),
        players: (data.players as Array<Record<string, unknown>> || []).map((p) => ({
          steam64Id: String(p.steam64Id || p.steamId),
          kills: Number(p.kills || 0),
          deaths: Number(p.deaths || 0),
          assists: Number(p.assists || 0),
          headshots: Number(p.headshots || 0),
          adr: Number(p.adr || 0),
          rating: Number(p.rating || 0),
        })),
      };
    } catch (error) {
      if (error instanceof LeetifyError) throw error;
      logger.error("Leetify API error", { error: String(error) });
      throw new LeetifyError(String(error), "REQUEST_FAILED");
    }
  }
}

export const leetifyClient = new LeetifyClient();