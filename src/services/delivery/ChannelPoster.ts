import { discordClient } from "../../discord/client.js";
import { logger } from "../../utils/logger.js";

export interface ChannelPostResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class ChannelPoster {
  async postToChannel(
    channelId: string,
    content: string,
  ): Promise<ChannelPostResult> {
    try {
      const channel = await discordClient.channels.fetch(channelId);

      if (!channel) {
        logger.warn("Channel not found", { channelId });
        return { success: false, error: "Channel not found" };
      }

      if (!("send" in channel) || typeof channel.send !== "function") {
        logger.warn("Channel is not text-based", { channelId });
        return { success: false, error: "Channel is not text-based" };
      }

      const message = await channel.send(content);

      logger.info("Posted to channel", { channelId, messageId: message.id });
      return { success: true, messageId: message.id };
    } catch (error) {
      logger.error("Failed to post to channel", {
        channelId,
        error: String(error),
      });
      return { success: false, error: String(error) };
    }
  }

  async postToChannels(
    channelIds: string[],
    content: string,
  ): Promise<Map<string, ChannelPostResult>> {
    const results = new Map<string, ChannelPostResult>();

    for (const channelId of channelIds) {
      const result = await this.postToChannel(channelId, content);
      results.set(channelId, result);
    }

    return results;
  }
}

export const channelPoster = new ChannelPoster();
