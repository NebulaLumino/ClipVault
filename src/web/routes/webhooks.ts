import { FastifyInstance } from "fastify";
import { logger } from "../../utils/logger.js";
import { clipOrchestrator } from "../../services/clip/ClipOrchestrator.js";
import { clipRepository } from "../../db/repositories/ClipRepository.js";
import { ClipStatus } from "../../types/index.js";

export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/webhooks/allstar", async (request, reply) => {
    const body = request.body as Record<string, unknown>;

    logger.debug("Allstar webhook received", body);

    const eventType = body.event as string;
    const clipId = body.clipId as string;
    const status = body.status as string;

    try {
      switch (eventType) {
        case "clip.ready": {
          if (!clipId) {
            return reply.status(400).send({ error: "Missing clipId" });
          }

          logger.info("Clip ready from Allstar", { clipId, status });

          const clip = await clipRepository.findByAllstarClipId(clipId);
          if (clip) {
            await clipRepository.update(clip.id, {
              status: ClipStatus.READY,
              thumbnailUrl: body.thumbnailUrl as string | undefined,
              videoUrl: body.videoUrl as string | undefined,
              duration: body.duration as number | undefined,
            });
          }

          break;
        }

        case "clip.processing": {
          if (!clipId) {
            return reply.status(400).send({ error: "Missing clipId" });
          }

          logger.info("Clip processing from Allstar", { clipId });

          const clip = await clipRepository.findByAllstarClipId(clipId);
          if (clip) {
            await clipRepository.update(clip.id, {
              status: ClipStatus.PROCESSING,
            });
          }

          break;
        }

        case "clip.failed": {
          if (!clipId) {
            return reply.status(400).send({ error: "Missing clipId" });
          }

          logger.warn("Clip failed from Allstar", { clipId, status });

          const clip = await clipRepository.findByAllstarClipId(clipId);
          if (clip) {
            await clipRepository.update(clip.id, {
              status: ClipStatus.FAILED,
            });
          }

          break;
        }

        default:
          logger.debug("Unknown Allstar webhook event", { eventType });
      }

      return { received: true };
    } catch (error) {
      logger.error("Webhook processing error", {
        eventType,
        clipId,
        error: String(error),
      });
      return reply.status(500).send({ error: "Internal server error" });
    }
  });

  fastify.post("/webhooks/match", async (request, reply) => {
    const body = request.body as Record<string, unknown>;

    logger.debug("Match webhook received", body);

    const platform = body.platform as string;
    const matchId = body.matchId as string;
    const userId = body.userId as string;

    if (!platform || !matchId || !userId) {
      return reply.status(400).send({ error: "Missing required fields" });
    }

    try {
      await clipOrchestrator.processCompletedMatch({ matchId });

      return { received: true, processed: true };
    } catch (error) {
      logger.error("Match webhook error", { matchId, error: String(error) });
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
