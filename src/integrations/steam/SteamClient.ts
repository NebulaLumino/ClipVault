import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatarfull?: string;
  loccountrycode?: string;
  profilestate?: number;
}

export interface CS2Match {
  matchid: string;
  matchtime: number;
  result: 'win' | 'loss' | 'draw';
  score?: { team1: number; team2: number };
}

export class SteamError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SteamError';
  }
}

export class SteamClient {
  private readonly baseUrl = 'https://api.steampowered.com';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.STEAM_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('Steam API key not configured');
    }
  }

  async getPlayerSummary(steamId: string): Promise<SteamPlayer | null> {
    if (!this.apiKey) {
      throw new SteamError('Steam API key not configured', 'NOT_CONFIGURED');
    }

    const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new SteamError('Failed to fetch player', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as { response?: { players?: SteamPlayer[] } };
      return data.response?.players?.[0] || null;
    } catch (error) {
      if (error instanceof SteamError) throw error;
      logger.error('Steam API error', { error: String(error) });
      throw new SteamError(String(error), 'REQUEST_FAILED');
    }
  }

  async getCS2MatchHistory(steamId: string, limit = 5): Promise<CS2Match[]> {
    if (!this.apiKey) {
      throw new SteamError('Steam API key not configured', 'NOT_CONFIGURED');
    }

    // Using OpenDota API for CS2 match history as Valve doesn't provide direct API
    const url = `https://api.opendota.com/api/players/${steamId}/matches?limit=${limit}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new SteamError('Failed to fetch match history', 'REQUEST_FAILED', response.status);
      }

      const matches = await response.json() as Array<Record<string, unknown>>;
      return matches.map((m) => ({
        matchid: String(m.match_id),
        matchtime: m.start_time as number,
        result: m.radiant_win === (m.player_slot as number < 128) ? 'win' : 'loss',
        score: { team1: m.radiant_score as number, team2: m.dire_score as number },
      }));
    } catch (error) {
      if (error instanceof SteamError) throw error;
      logger.error('Steam API error', { error: String(error) });
      throw new SteamError(String(error), 'REQUEST_FAILED');
    }
  }

  async resolveVanityUrl(vanityUrl: string): Promise<string | null> {
    if (!this.apiKey) {
      throw new SteamError('Steam API key not configured', 'NOT_CONFIGURED');
    }

    const url = `${this.baseUrl}/ISteamUser/ResolveVanityURL/v0001/?key=${this.apiKey}&vanityurl=${vanityUrl}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new SteamError('Failed to resolve vanity URL', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as { response?: { success: number; steamid?: string } };
      if (data.response?.success === 1) {
        return data.response.steamid || null;
      }
      return null;
    } catch (error) {
      if (error instanceof SteamError) throw error;
      logger.error('Steam API error', { error: String(error) });
      throw new SteamError(String(error), 'REQUEST_FAILED');
    }
  }

  isValidSteam64Id(steamId: string): boolean {
    // Steam64 IDs are 17 digits
    return /^\d{17}$/.test(steamId);
  }
}

export const steamClient = new SteamClient();
