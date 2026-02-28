import { Prisma } from "@prisma/client";
import { allstarClient } from "../../integrations/allstar/AllstarClient.js";
import { clipRepository } from "../../db/repositories/ClipRepository.js";
import { logger } from "../../utils/logger.js";
import {
  ClipStatus,
  ClipType,
  GameTitle,
  type ClipRecord,
} from "../../types/index.js";

export interface RequestClipOptions {
  matchId: string;
  userId: string;
  platformMatchId: string;
  platform: string;
  gameTitle: string;
  clipType?: ClipType;
  metadata?: Record<string, unknown>;
}

export class ClipRequestService {
  async requestClip(options: RequestClipOptions): Promise<ClipRecord> {
    const {
      matchId,
      userId,
      platformMatchId,
      platform,
      gameTitle,
      clipType = ClipType.HIGHLIGHT,
      metadata,
    } = options;

    logger.info("Requesting clip from Allstar", {
      matchId,
      userId,
      platformMatchId,
      platform,
      gameTitle,
      clipType,
    });

    try {
      const response = await allstarClient.requestClips({
        platformMatchId,
        platform,
        gameTitle,
        matchId,
      });

      if (!response.clips || response.clips.length === 0) {
        logger.warn("No clips returned from Allstar", {
          matchId,
          requestId: response.requestId,
        });
      }

      const clipData = response.clips[0];

      const clip = await clipRepository.create({
        matchId,
        userId,
        allstarClipId: clipData.id,
        type: clipType,
        status: ClipStatus.REQUESTED,
        title: clipData.title ?? undefined,
        thumbnailUrl: clipData.thumbnailUrl ?? undefined,
        videoUrl: clipData.videoUrl ?? undefined,
        duration: clipData.duration ?? undefined,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      });

      logger.info("Clip requested successfully", {
        clipId: clip.id,
        allstarClipId: clip.allstarClipId,
        requestId: response.requestId,
      });

      return clip;
    } catch (error) {
      logger.error("Failed to request clip", {
        matchId,
        userId,
        error: String(error),
      });
      throw error;
    }
  }

  async bulkRequestClips(
    requests: RequestClipOptions[],
  ): Promise<ClipRecord[]> {
    const results: ClipRecord[] = [];

    for (const request of requests) {
      try {
        const clip = await this.requestClip(request);
        results.push(clip);
      } catch (error) {
        logger.error("Failed to request clip in bulk", {
          matchId: request.matchId,
          error: String(error),
        });
      }
    }

    return results;
  }
}

export const clipRequestService = new ClipRequestService();
