import {
  allstarClient,
  type AllstarClip,
} from "../../integrations/allstar/AllstarClient.js";
import { clipRepository } from "../../db/repositories/ClipRepository.js";
import { logger } from "../../utils/logger.js";
import { ClipStatus, type ClipRecord } from "../../types/index.js";

export interface ClipStatusResult {
  status: ClipStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  title?: string;
}

export class ClipFetchService {
  async fetchClipStatus(allstarClipId: string): Promise<ClipStatusResult> {
    try {
      const allstarClip = await allstarClient.getClip(allstarClipId);

      if (!allstarClip) {
        return { status: ClipStatus.FAILED };
      }

      const status = this.mapAllstarStatusToClipStatus(allstarClip.status);

      return {
        status,
        videoUrl: allstarClip.videoUrl,
        thumbnailUrl: allstarClip.thumbnailUrl,
        duration: allstarClip.duration,
        title: allstarClip.title,
      };
    } catch (error) {
      logger.error("Failed to fetch clip status from Allstar", {
        allstarClipId,
        error: String(error),
      });
      throw error;
    }
  }

  async updateClipFromAllstar(clipId: string): Promise<ClipRecord | null> {
    const clip = await clipRepository.findById(clipId);
    if (!clip) {
      logger.warn("Clip not found", { clipId });
      return null;
    }

    const statusResult = await this.fetchClipStatus(clip.allstarClipId);

    const updatedClip = await clipRepository.update(clipId, {
      status: statusResult.status,
      title: statusResult.title,
      thumbnailUrl: statusResult.thumbnailUrl,
      videoUrl: statusResult.videoUrl,
      duration: statusResult.duration,
    });

    logger.info("Updated clip from Allstar", {
      clipId,
      allstarClipId: clip.allstarClipId,
      status: statusResult.status,
    });

    return updatedClip;
  }

  async pollReadyClips(): Promise<ClipRecord[]> {
    const requestedClips = await clipRepository.findByStatus(
      ClipStatus.REQUESTED,
      50,
    );
    const readyClips: ClipRecord[] = [];

    for (const clip of requestedClips) {
      try {
        const updatedClip = await this.updateClipFromAllstar(clip.id);
        if (updatedClip && updatedClip.status === ClipStatus.READY) {
          readyClips.push(updatedClip);
        }
      } catch (error) {
        logger.error("Failed to poll clip", {
          clipId: clip.id,
          error: String(error),
        });
      }
    }

    return readyClips;
  }

  private mapAllstarStatusToClipStatus(allstarStatus: string): ClipStatus {
    switch (allstarStatus.toLowerCase()) {
      case "ready":
      case "completed":
        return ClipStatus.READY;
      case "processing":
      case "pending":
        return ClipStatus.PROCESSING;
      case "failed":
        return ClipStatus.FAILED;
      case "expired":
        return ClipStatus.EXPIRED;
      default:
        return ClipStatus.REQUESTED;
    }
  }
}

export const clipFetchService = new ClipFetchService();
