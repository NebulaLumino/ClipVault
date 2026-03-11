import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { discordClient } from "./discord/client.js";
import { startWebServer } from "./web/server.js";
import { createMatchPollWorker } from "./jobs/matchPoll.worker.js";
import { createClipRequestWorker } from "./jobs/clipRequest.worker.js";
import { createClipMonitorWorker } from "./jobs/clipMonitor.worker.js";
import { createClipDeliveryWorker } from "./jobs/clipDelivery.worker.js";
import { startScheduler, stopScheduler } from "./jobs/scheduler.js";
import prisma from "./db/prisma.js";
import { redis } from "./db/redis.js";

async function main() {
  logger.info("Starting ClipVault...", { environment: config.NODE_ENV });

  // Connect to database
  try {
    await prisma.$connect();
    logger.info("Database connected");
  } catch (error) {
    logger.error("Failed to connect to database", { error: String(error) });
    process.exit(1);
  }

  // Connect to Redis
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Redis connection timeout"));
      }, 10000);

      redis.once("ready", () => {
        clearTimeout(timeout);
        logger.info("Redis connected via ready event");
        resolve();
      });

      redis.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (error) {
    logger.warn("Failed to connect to Redis - continuing anyway", {
      error: String(error),
    });
  }

  // Start Discord bot (optional)
  try {
    await discordClient.login();
    logger.info("Discord bot logged in");
  } catch (error) {
    logger.warn("Discord bot not logged in - skipping (token not configured)");
  }

  // Start web server
  try {
    await startWebServer();
    logger.info("Web server started");
  } catch (error) {
    logger.error("Failed to start web server", { error: String(error) });
    process.exit(1);
  }

  // Start workers
  try {
    createMatchPollWorker();
    createClipRequestWorker();
    createClipMonitorWorker();
    createClipDeliveryWorker();
    logger.info("Workers started");

    // Start the match poll scheduler
    startScheduler();
  } catch (error) {
    logger.error("Failed to start workers", { error: String(error) });
    process.exit(1);
  }

  logger.info("ClipVault fully started");
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down...");
  stopScheduler();
  await prisma.$disconnect();
  await redis.quit();
  await discordClient.destroy();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down...");
  stopScheduler();
  await prisma.$disconnect();
  await redis.quit();
  await discordClient.destroy();
  process.exit(0);
});

main().catch((error) => {
  logger.error("Fatal error", { error: String(error) });
  process.exit(1);
});
