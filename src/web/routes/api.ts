import { FastifyInstance } from "fastify";
import { userService } from "../../services/UserService.js";
import { accountService } from "../../services/AccountService.js";
import { clipRepository } from "../../db/repositories/ClipRepository.js";
import { deliveryRepository } from "../../db/repositories/DeliveryRepository.js";
import { preferenceService } from "../../services/PreferenceService.js";

export async function apiRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });

  fastify.get("/api/users/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const user = await userService.getUserById(userId);
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return user;
  });

  fastify.get("/api/users/:userId/accounts", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const accounts = await accountService.getLinkedAccounts(userId);
    return accounts;
  });

  fastify.get("/api/users/:userId/preferences", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const preferences = await preferenceService.getUserPreferences(userId);
    return preferences;
  });

  fastify.put("/api/users/:userId/preferences", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const body = request.body as Record<string, unknown>;

    const preferences = await preferenceService.updateUserPreferences(
      userId,
      body as any,
    );
    return preferences;
  });

  fastify.get("/api/users/:userId/clips", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = "10", status } = request.query as {
      limit?: string;
      status?: string;
    };

    const clips = await clipRepository.findByUserId(
      userId,
      parseInt(limit || "10"),
    );
    if (status) {
      return clips.filter((c) => c.status === status);
    }
    return clips;
  });

  fastify.get("/api/users/:userId/deliveries", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { limit = "20" } = request.query as { limit?: string };

    const deliveries = await deliveryRepository.findByUserId(
      userId,
      parseInt(limit || "20"),
    );
    return deliveries;
  });

  fastify.get("/api/clips/:clipId", async (request, reply) => {
    const { clipId } = request.params as { clipId: string };

    const clip = await clipRepository.findById(clipId);
    if (!clip) {
      return reply.status(404).send({ error: "Clip not found" });
    }

    return clip;
  });

  fastify.get("/api/clips/:clipId/deliveries", async (request, reply) => {
    const { clipId } = request.params as { clipId: string };

    const deliveries = await deliveryRepository.findByClipId(clipId);
    return deliveries;
  });
}
