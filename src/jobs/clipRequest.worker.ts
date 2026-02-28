import { Worker, Job } from "bullmq";
import { logger } from "../utils/logger.js";
import { clipService, CreateClipData } from "../services/ClipService.js";
import { allstarClient } from "../integrations/allstar/AllstarClient.js";
import type { ClipRequestJobData } from "../types/index.js";
import { ClipType, MatchStatus } from "../types/index.js";

export function createClipRequestWorker() {
  const worker = new Worker<ClipRequestJobData>(
    "clip-request",
    async (job: Job<ClipRequestJobData>) => {
      const {
        matchId,
        userId,
        platform,
        platformAccountId,
        platformMatchId,
        gameTitle,
      } = job.data;

      logger.info("Processing clip request job", {
        jobId: job.id,
        matchId,
        userId,
        platform,
        gameTitle,
      });

      try {
        // Get match details
        const match = await clipService.getMatchById(matchId);
        if (!match) {
          logger.warn("Match not found", { matchId });
          return { status: "skipped", reason: "match_not_found" };
        }

        // Check if clips already requested
        const existingClips = await clipService.getClipsByMatchId(matchId);
        if (existingClips.length > 0) {
          logger.info("Clips already requested for match", {
            matchId,
            count: existingClips.length,
          });
          return { status: "skipped", reason: "clips_already_requested" };
        }

        // Request clips from Allstar
        const clipRequest = await allstarClient.requestClips({
          platformMatchId: platformMatchId,
          platform,
          gameTitle,
          matchId,
        });

        // Create clip records in database
        for (const clip of clipRequest.clips) {
          const clipData: CreateClipData = {
            matchId,
            userId,
            allstarClipId: clip.id,
            type: clip.type as ClipType,
            title: clip.title,
            thumbnailUrl: clip.thumbnailUrl,
            videoUrl: clip.videoUrl,
            duration: clip.duration,
          };
          await clipService.createClip(clipData);
        }

        logger.info("Clips requested successfully", {
          matchId,
          clipCount: clipRequest.clips.length,
        });

        return {
          status: "completed",
          clipsRequested: clipRequest.clips.length,
        };
      } catch (error) {
        logger.error("Clip request job failed", {
          jobId: job.id,
          matchId,
          error: String(error),
        });

        throw error;
      }
    },
    {
      concurrency: 3,
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    },
  );

  worker.on("completed", (job) => {
    logger.info("Clip request job completed", {
      jobId: job.id,
      result: job.returnvalue,
    });
  });

  worker.on("failed", (job, error) => {
    logger.error("Clip request job failed", {
      jobId: job?.id,
      error: error.message,
    });
  });

  return worker;
}
