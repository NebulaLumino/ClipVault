import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export interface RiotAccount {
  puuid: string;
  gameName?: string;
  tagLine?: string;
}

export interface LoLMatch {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  participants: LoLParticipant[];
}

export interface LoLParticipant {
  puuid: string;
  summonerName: string;
  championName: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
}

export class RiotError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'RiotError';
  }
}

export class RiotClient {
  private readonly apiKey: string;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.apiKey = config.RIOT_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('Riot API key not configured');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'X-Riot-Token': this.apiKey,
    };
  }

  // Routing based on region
  private getRegionalRoute(puuid: string): string {
    return 'americas';
  }

  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount | null> {
    if (!this.apiKey) {
      throw new RiotError('Riot API key not configured', 'NOT_CONFIGURED');
    }

    const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;

    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new RiotError('Failed to fetch account', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as RiotAccount;
      return data;
    } catch (error) {
      if (error instanceof RiotError) throw error;
      logger.error('Riot API error', { error: String(error) });
      throw new RiotError(String(error), 'REQUEST_FAILED');
    }
  }

  async getMatchList(puuid: string, count = 5): Promise<string[]> {
    if (!this.apiKey) {
      throw new RiotError('Riot API key not configured', 'NOT_CONFIGURED');
    }

    const route = this.getRegionalRoute(puuid);
    const url = `https://${route}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;

    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      
      if (!response.ok) {
        throw new RiotError('Failed to fetch match list', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as string[];
      return data;
    } catch (error) {
      if (error instanceof RiotError) throw error;
      logger.error('Riot API error', { error: String(error) });
      throw new RiotError(String(error), 'REQUEST_FAILED');
    }
  }

  async getMatch(matchId: string): Promise<LoLMatch | null> {
    if (!this.apiKey) {
      throw new RiotError('Riot API key not configured', 'NOT_CONFIGURED');
    }

    // Extract region from match ID
    const region = matchId.startsWith('AMER') ? 'americas' 
      : matchId.startsWith('EURO') ? 'europe'
      : matchId.startsWith('ASIA') ? 'asia'
      : 'americas';

    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;

    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new RiotError('Failed to fetch match', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as {
        metadata?: { matchId: string };
        info?: {
          gameCreation?: number;
          gameDuration?: number;
          participants?: LoLParticipant[];
        };
      };
      
      return {
        matchId: data.metadata?.matchId || matchId,
        gameCreation: data.info?.gameCreation || 0,
        gameDuration: data.info?.gameDuration || 0,
        participants: data.info?.participants || [],
      };
    } catch (error) {
      if (error instanceof RiotError) throw error;
      logger.error('Riot API error', { error: String(error) });
      throw new RiotError(String(error), 'REQUEST_FAILED');
    }
  }
}

export const riotClient = new RiotClient();
