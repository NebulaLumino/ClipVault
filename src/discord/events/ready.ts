import { logger } from "../../utils/logger.js";
import { discordClient } from "../client.js";
import { config } from "../../config/index.js";
import { Routes } from "discord.js";
import { allCommands } from "../commands.js";

export async function handleReady(): Promise<void> {
  logger.info(`Discord bot ready: ${discordClient.user?.tag}`);

  await registerCommands();
}

async function registerCommands(): Promise<void> {
  if (!config.DISCORD_CLIENT_ID) {
    logger.warn(
      "Discord client ID not configured, skipping command registration",
    );
    return;
  }

  try {
    await discordClient.rest.put(
      Routes.applicationCommands(config.DISCORD_CLIENT_ID),
      { body: allCommands.map((cmd) => cmd.toJSON()) },
    );
    logger.info("Slash commands registered");
  } catch (error) {
    logger.error("Failed to register commands", { error: String(error) });
  }
}

export function setupEventHandlers(): void {
  discordClient.on("ready", handleReady);

  discordClient.on("error", (error) => {
    logger.error("Discord client error", { error: String(error) });
  });

  discordClient.on("warn", (warning) => {
    logger.warn("Discord client warning", { warning });
  });

  discordClient.on("shardDisconnect", (event, id) => {
    logger.warn("Discord shard disconnected", {
      shardId: id,
      code: event.code,
    });
  });

  discordClient.on("shardReconnecting", (id) => {
    logger.info("Discord shard reconnecting", { shardId: id });
  });

  discordClient.on("shardResume", (id) => {
    logger.info("Discord shard resumed", { shardId: id });
  });
}
