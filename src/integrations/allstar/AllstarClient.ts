import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

export interface AllstarClip {
  id: string;
  status: string;
  type: string;
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

export interface AllstarRequestClipsRequest {
  platformMatchId: string;
  platform: string;
  gameTitle: string;
  matchId: string;
}

export interface AllstarRequestClipsResponse {
  clips: AllstarClip[];
  requestId: string;
}

export interface AllstarGetClipsResponse {
  clips: AllstarClip[];
  total: number;
}

export class AllstarError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AllstarError";
  }
}

export class AllstarClient {
  private readonly baseUrl: string;
  private readonly defaultApiKey: string;

  constructor() {
    this.baseUrl = config.ALLSTAR_API_URL || "https://api.allstar.gg";
    this.defaultApiKey = config.ALLSTAR_API_KEY || "";

    if (!this.defaultApiKey) {
      logger.warn("Allstar API key not configured");
    }
  }

  private getHeaders(userApiKey?: string): Record<string, string> {
    const apiKey = userApiKey || this.defaultApiKey;
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Resolve the API key to use: user's personal key if set, otherwise the shared key.
   */
  async resolveApiKey(userId: string): Promise<string> {
    try {
      const prisma = (await import("../../db/prisma.js")).default;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { allstarApiKey: true },
      });
      return user?.allstarApiKey || this.defaultApiKey;
    } catch {
      return this.defaultApiKey;
    }
  }

  async createClip(
    platformMatchId: string,
    platform: string,
    gameTitle: string,
    clipType: string,
    userApiKey?: string,
  ): Promise<AllstarCreateClipResponse> {
    const apiKey = userApiKey || this.defaultApiKey;
    if (!apiKey) {
      throw new AllstarError(
        "Allstar API key not configured",
        "NOT_CONFIGURED",
      );
    }

    const url = `${this.baseUrl}/v2/clips`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(apiKey),
        body: JSON.stringify({
          platformMatchId,
          platform,
          gameTitle,
          clipType,
        }),
      });

      if (!response.ok) {
        throw new AllstarError(
          "Failed to create clip",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = (await response.json()) as AllstarCreateClipResponse;
      return data;
    } catch (error) {
      if (error instanceof AllstarError) throw error;
      logger.error("Allstar API error", { error: String(error) });
      throw new AllstarError(String(error), "REQUEST_FAILED");
    }
  }

  async getClip(clipId: string): Promise<AllstarClip | null> {
    if (!this.defaultApiKey) {
      throw new AllstarError(
        "Allstar API key not configured",
        "NOT_CONFIGURED",
      );
    }

    const url = `${this.baseUrl}/v2/clips/${clipId}`;

    try {
      const response = await fetch(url, { headers: this.getHeaders() });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new AllstarError(
          "Failed to get clip",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = (await response.json()) as AllstarClip;
      return data;
    } catch (error) {
      if (error instanceof AllstarError) throw error;
      logger.error("Allstar API error", { error: String(error) });
      throw new AllstarError(String(error), "REQUEST_FAILED");
    }
  }

  async getClips(
    limit = 10,
    status?: string,
  ): Promise<AllstarGetClipsResponse> {
    if (!this.defaultApiKey) {
      throw new AllstarError(
        "Allstar API key not configured",
        "NOT_CONFIGURED",
      );
    }

    let url = `${this.baseUrl}/v2/clips?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    try {
      const response = await fetch(url, { headers: this.getHeaders() });

      if (!response.ok) {
        throw new AllstarError(
          "Failed to get clips",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = (await response.json()) as AllstarGetClipsResponse;
      return data;
    } catch (error) {
      if (error instanceof AllstarError) throw error;
      logger.error("Allstar API error", { error: String(error) });
      throw new AllstarError(String(error), "REQUEST_FAILED");
    }
  }

  async requestClips(
    request: AllstarRequestClipsRequest,
    userApiKey?: string,
  ): Promise<AllstarRequestClipsResponse> {
    const apiKey = userApiKey || this.defaultApiKey;
    if (!apiKey) {
      throw new AllstarError(
        "Allstar API key not configured",
        "NOT_CONFIGURED",
      );
    }

    const url = `${this.baseUrl}/v2/clips/request`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(apiKey),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new AllstarError(
          "Failed to request clips",
          "REQUEST_FAILED",
          response.status,
        );
      }

      const data = (await response.json()) as AllstarRequestClipsResponse;
      return data;
    } catch (error) {
      if (error instanceof AllstarError) throw error;
      logger.error("Allstar API error", { error: String(error) });
      throw new AllstarError(String(error), "REQUEST_FAILED");
    }
  }

  async getClipStatus(
    clipId: string,
  ): Promise<{
    status: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
  }> {
    const clip = await this.getClip(clipId);
    if (!clip) {
      throw new AllstarError("Clip not found", "NOT_FOUND", 404);
    }

    return {
      status: clip.status,
      videoUrl: clip.videoUrl,
      thumbnailUrl: clip.thumbnailUrl,
      duration: clip.duration,
    };
  }
}

export const allstarClient = new AllstarClient();
