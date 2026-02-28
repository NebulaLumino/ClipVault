import { FastifyInstance } from "fastify";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { accountService } from "../../services/AccountService.js";
import { PlatformType } from "../../types/index.js";

export async function oauthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/oauth/steam/callback", async (request, reply) => {
    const { code, state, steamId } = request.query as Record<string, string>;

    if (!code || !state) {
      return reply.status(400).send({ error: "Missing code or state" });
    }

    try {
      const userId = state;
      await accountService.linkAccount(
        userId,
        PlatformType.STEAM,
        steamId,
        undefined,
        code,
      );

      return reply.redirect(
        `${config.OAUTH_REDIRECT_BASE}/linked?platform=steam`,
      );
    } catch (error) {
      logger.error("Steam OAuth callback error", { error: String(error) });
      return reply.status(500).send({ error: "Failed to link account" });
    }
  });

  fastify.get("/oauth/riot/callback", async (request, reply) => {
    const { code, state } = request.query as Record<string, string>;

    if (!code || !state) {
      return reply.status(400).send({ error: "Missing code or state" });
    }

    try {
      const userId = state;
      await accountService.linkAccount(
        userId,
        PlatformType.RIOT,
        code,
        undefined,
        code,
      );

      return reply.redirect(
        `${config.OAUTH_REDIRECT_BASE}/linked?platform=riot`,
      );
    } catch (error) {
      logger.error("Riot OAuth callback error", { error: String(error) });
      return reply.status(500).send({ error: "Failed to link account" });
    }
  });

  fastify.get("/oauth/epic/callback", async (request, reply) => {
    const { code, state, epicId } = request.query as Record<string, string>;

    if (!code || !state) {
      return reply.status(400).send({ error: "Missing code or state" });
    }

    try {
      const userId = state;
      await accountService.linkAccount(
        userId,
        PlatformType.EPIC,
        epicId,
        undefined,
        code,
      );

      return reply.redirect(
        `${config.OAUTH_REDIRECT_BASE}/linked?platform=epic`,
      );
    } catch (error) {
      logger.error("Epic OAuth callback error", { error: String(error) });
      return reply.status(500).send({ error: "Failed to link account" });
    }
  });
}
