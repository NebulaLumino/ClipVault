import { matchRepository } from "../../db/repositories/MatchRepository.js";
import { clipRepository } from "../../db/repositories/ClipRepository.js";
import { linkedAccountRepository } from "../../db/repositories/LinkedAccountRepository.js";
import { clipRequestService } from "./ClipRequestService.js";
import { clipFetchService } from "./ClipFetchService.js";
import { clipFilterService } from "./ClipFilterService.js";
import { deliveryService } from "../delivery/DeliveryEngine.js";
import { logger } from "../../utils/logger.js";
import {
  MatchStatus,
  ClipStatus,
  PlatformType,
  type MatchRecord,
  type ClipRecord,
} from "../../types/index.js";

export interface ProcessMatchOptions {
  matchId: string;
  forceRequest?: boolean;
}

export class ClipOrchestrator {
  async processCompletedMatch(
    options: ProcessMatchOptions,
  ): Promise<ClipRecord[]> {
    const { matchId, forceRequest = false } = options;

    logger.info("Processing completed match for clips", { matchId });

    const match = await matchRepository.findById(matchId);
    if (!match) {
      logger.warn("Match not found", { matchId });
      return [];
    }

    if (match.status !== MatchStatus.COMPLETED) {
      logger.warn("Match not completed yet", { matchId, status: match.status });
      return [];
    }

    const filterResult =
      await clipFilterService.shouldRequestClipsForMatch(match);
    if (!filterResult.shouldRequest && !forceRequest) {
      logger.info("Match filtered out for clip request", {
        matchId,
        reason: filterResult.reason,
      });
      return [];
    }

    const linkedAccount = await linkedAccountRepository.findById(match.userId);
    if (!linkedAccount) {
      logger.warn("Linked account not found for match", {
        matchId,
        userId: match.userId,
      });
      return [];
    }

    const clip = await clipRequestService.requestClip({
      matchId: match.id,
      userId: match.userId,
      platformMatchId: match.platformMatchId,
      platform: match.platform,
      gameTitle: match.gameTitle,
      metadata: filterResult.metadata,
    });

    return [clip];
  }

  async monitorAndDeliverClips(): Promise<number> {
    logger.info("Starting clip monitoring and delivery");

    const readyClips = await clipFetchService.pollReadyClips();
    logger.info("Found ready clips", { count: readyClips.length });

    let deliveredCount = 0;
    for (const clip of readyClips) {
      try {
        const delivered = await deliveryService.deliverClip(
          clip.id,
          clip.userId,
        );
        if (delivered) {
          deliveredCount++;
        }
      } catch (error) {
        logger.error("Failed to deliver clip", {
          clipId: clip.id,
          error: String(error),
        });
      }
    }

    logger.info("Clip monitoring complete", {
      readyClips: readyClips.length,
      deliveredCount,
    });

    return deliveredCount;
  }

  async retryFailedClips(): Promise<number> {
    const failedClips = await clipRepository.findByStatus(
      ClipStatus.FAILED,
      20,
    );
    let retriedCount = 0;

    for (const clip of failedClips) {
      try {
        const match = await matchRepository.findById(clip.matchId);
        if (match) {
          await clipRepository.update(clip.id, {
            status: ClipStatus.REQUESTED,
          });

          await clipRequestService.requestClip({
            matchId: match.id,
            userId: clip.userId,
            platformMatchId: match.platformMatchId,
            platform: match.platform,
            gameTitle: match.gameTitle,
          });

          retriedCount++;
        }
      } catch (error) {
        logger.error("Failed to retry clip", {
          clipId: clip.id,
          error: String(error),
        });
      }
    }

    logger.info("Retried failed clips", { retriedCount });
    return retriedCount;
  }

  async getClipStats(userId?: string): Promise<{
    total: number;
    requested: number;
    processing: number;
    ready: number;
    delivered: number;
    failed: number;
  }> {
    let clips: ClipRecord[];

    if (userId) {
      clips = await clipRepository.findByUserId(userId, 1000);
    } else {
      clips = [];
    }

    return {
      total: clips.length,
      requested: clips.filter((c) => c.status === ClipStatus.REQUESTED).length,
      processing: clips.filter((c) => c.status === ClipStatus.PROCESSING)
        .length,
      ready: clips.filter((c) => c.status === ClipStatus.READY).length,
      delivered: clips.filter((c) => c.status === ClipStatus.DELIVERED).length,
      failed: clips.filter((c) => c.status === ClipStatus.FAILED).length,
    };
  }
}

export const clipOrchestrator = new ClipOrchestrator();
