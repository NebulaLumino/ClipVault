import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export interface AllstarClip {
  id: string;
  status: string;
  title?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  createdAt: string;
}

export interface AllstarCreateClipResponse {
  id: string;
  status: string;
}

export interface AllstarGetClipsResponse {
  clips: AllstarClip[];
  total: number;
}

export class AllstarError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AllstarError';
  }
}

export class AllstarClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.ALLSTAR_API_URL || 'https://api.allstar.gg';
    this.apiKey = config.ALLSTAR_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('Allstar API key not configured');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async createClip(
    platformMatchId: string,
    platform: string,
    gameTitle: string,
    clipType: string
  ): Promise<AllstarCreateClipResponse> {
    if (!this.apiKey) {
      throw new AllstarError('Allstar API key not configured', 'NOT_CONFIGURED');
    }

    const url = `${this.baseUrl}/v2/clips`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          platformMatchId,
          platform,
          gameTitle,
          clipType,
        }),
      });

      if (!response.ok) {
        throw new AllstarError('Failed to create clip', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as AllstarCreateClipResponse;
      return data;
    } catch (error) {
      if (error instanceof AllstarError) throw error;
      logger.error('Allstar API error', { error: String(error) });
      throw new AllstarError(String(error), 'REQUEST_FAILED');
    }
  }

  async getClip(clipId: string): Promise<AllstarClip | null> {
    if (!this.apiKey) {
      throw new AllstarError('Allstar API key not configured', 'NOT_CONFIGURED');
    }

    const url = `${this.baseUrl}/v2/clips/${clipId}`;

    try {
      const response = await fetch(url, { headers: this.getHeaders() });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new AllstarError('Failed to get clip', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as AllstarClip;
      return data;
    } catch (error) {
      if (error instanceof AllstarError) throw error;
      logger.error('Allstar API error', { error: String(error) });
      throw new AllstarError(String(error), 'REQUEST_FAILED');
    }
  }

  async getClips(limit = 10, status?: string): Promise<AllstarGetClipsResponse> {
    if (!this.apiKey) {
      throw new AllstarError('Allstar API key not configured', 'NOT_CONFIGURED');
    }

    let url = `${this.baseUrl}/v2/clips?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    try {
      const response = await fetch(url, { headers: this.getHeaders() });

      if (!response.ok) {
        throw new AllstarError('Failed to get clips', 'REQUEST_FAILED', response.status);
      }

      const data = await response.json() as AllstarGetClipsResponse;
      return data;
    } catch (error) {
      if (error instanceof AllstarError) throw error;
      logger.error('Allstar API error', { error: String(error) });
      throw new AllstarError(String(error), 'REQUEST_FAILED');
    }
  }
}

export const allstarClient = new AllstarClient();
