import { config } from "../../config/index.js";
import { API_ENDPOINTS } from "../../config/constants.js";
import { logger } from "../../utils/logger.js";

export interface FaceitPlayer {
  player_id: string;
  nickname: string;
  steam_id_64: string;
  faceit_url: string;
  games: Record<string, { game_player_id: string; skill_level: number; faceit_elo: number }>;
}

export interface FaceitMatchPlayer {
  player_id: string;
  nickname: string;
  game_player_id: string;
}

export interface FaceitMatch {
  match_id: string;
  started_at: number;
  finished_at: number;
  game_id: string;
  competition_type: string;
  teams: Record<string, { team_id: string; nickname: string; players: FaceitMatchPlayer[] }>;
  results: { winner: string; score: { team1: number; team2: number } };
}

export interface FaceitMatchDetail extends FaceitMatch {
  demo_url?: string[];
}

export interface FaceitMatchStats {
  rounds: Array<{
    teams: Array<{
      players: Array<{
        player_id: string;
        nickname: string;
        player_stats: Record<string, string>;
      }>;
    }>;
  }>;
}

export class FaceitError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "FaceitError";
  }
}

export class FaceitClient {
  private readonly baseUrl = API_ENDPOINTS.FACEIT_BASE;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.FACEIT_API_KEY || "";

    if (!this.apiKey) {
      logger.warn("FACEIT API key not configured");
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async getPlayerBySteamId(steam64Id: string): Promise<FaceitPlayer | null> {
    if (!this.apiKey) {
      throw new FaceitError("FACEIT API key not configured", "NOT_CONFIGURED");
    }

    const url = `${this.baseUrl}/players?game=cs2&game_player_id=${steam64Id}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new FaceitError(
          "Failed to fetch player by Steam ID",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = await response.json() as FaceitPlayer;
      logger.debug("FACEIT player lookup response", { data });

      return data;
    } catch (error) {
      if (error instanceof FaceitError) throw error;
      logger.error("FACEIT API error", { error: String(error) });
      throw new FaceitError(String(error), "REQUEST_FAILED");
    }
  }

  async getPlayerByNickname(nickname: string): Promise<FaceitPlayer | null> {
    if (!this.apiKey) {
      throw new FaceitError("FACEIT API key not configured", "NOT_CONFIGURED");
    }

    const url = `${this.baseUrl}/players?nickname=${encodeURIComponent(nickname)}&game=cs2`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new FaceitError(
          "Failed to fetch player by nickname",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = await response.json() as FaceitPlayer;
      logger.debug("FACEIT player nickname lookup response", { data });

      return data;
    } catch (error) {
      if (error instanceof FaceitError) throw error;
      logger.error("FACEIT API error", { error: String(error) });
      throw new FaceitError(String(error), "REQUEST_FAILED");
    }
  }

  async getMatchHistory(
    playerId: string,
    game: string = "cs2",
    limit = 10,
  ): Promise<FaceitMatch[]> {
    if (!this.apiKey) {
      throw new FaceitError("FACEIT API key not configured", "NOT_CONFIGURED");
    }

    const url = `${this.baseUrl}/players/${playerId}/history?game=${game}&limit=${limit}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new FaceitError(
          "Failed to fetch match history",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = await response.json() as { items?: FaceitMatch[] };
      logger.debug("FACEIT match history response", { data });

      return data.items || [];
    } catch (error) {
      if (error instanceof FaceitError) throw error;
      logger.error("FACEIT API error", { error: String(error) });
      throw new FaceitError(String(error), "REQUEST_FAILED");
    }
  }

  async getMatchDetails(matchId: string): Promise<FaceitMatchDetail | null> {
    if (!this.apiKey) {
      throw new FaceitError("FACEIT API key not configured", "NOT_CONFIGURED");
    }

    const url = `${this.baseUrl}/matches/${matchId}`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new FaceitError(
          "Failed to fetch match details",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = await response.json() as FaceitMatchDetail;
      logger.debug("FACEIT match details response", { data });

      return data;
    } catch (error) {
      if (error instanceof FaceitError) throw error;
      logger.error("FACEIT API error", { error: String(error) });
      throw new FaceitError(String(error), "REQUEST_FAILED");
    }
  }

  async getMatchStats(matchId: string): Promise<FaceitMatchStats | null> {
    if (!this.apiKey) {
      throw new FaceitError("FACEIT API key not configured", "NOT_CONFIGURED");
    }

    const url = `${this.baseUrl}/matches/${matchId}/stats`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new FaceitError(
          "Failed to fetch match stats",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = await response.json() as FaceitMatchStats;
      logger.debug("FACEIT match stats response", { data });

      return data;
    } catch (error) {
      if (error instanceof FaceitError) throw error;
      logger.error("FACEIT API error", { error: String(error) });
      throw new FaceitError(String(error), "REQUEST_FAILED");
    }
  }
}

export const faceitClient = new FaceitClient();