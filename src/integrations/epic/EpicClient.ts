import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export interface FortniteProfile {
  id: string;
  displayName: string;
  externalAuths?: Array<{
    type: string;
    id: string;
  }>;
}

export interface FortniteStats {
  br: {
    wins: number;
    kills: number;
    matchesPlayed: number;
    winRate: number;
    kd: number;
  };
}

export class EpicError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'EpicError';
  }
}

export class EpicClient {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = config.EPIC_CLIENT_ID || '';
    this.clientSecret = config.EPIC_CLIENT_SECRET || '';
    
    if (!this.clientId) {
      logger.warn('Epic Games client credentials not configured');
    }
  }

  async getFortniteProfile(epicId: string): Promise<FortniteProfile | null> {
    const url = `https://fortnite-api.com/v1/players/epic/${epicId}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new EpicError('Failed to fetch profile', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as { data?: FortniteProfile };
      return data.data || null;
    } catch (error) {
      if (error instanceof EpicError) throw error;
      logger.error('Epic Games API error', { error: String(error) });
      throw new EpicError(String(error), 'REQUEST_FAILED');
    }
  }

  async getFortniteStats(epicId: string): Promise<FortniteStats | null> {
    const url = `https://fortnite-api.com/v1/stats/br/v2?EpicId=${epicId}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new EpicError('Failed to fetch stats', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as { data?: { stats?: FortniteStats } };
      return data.data?.stats || null;
    } catch (error) {
      if (error instanceof EpicError) throw error;
      logger.error('Epic Games API error', { error: String(error) });
      throw new EpicError(String(error), 'REQUEST_FAILED');
    }
  }
}

export const epicClient = new EpicClient();
