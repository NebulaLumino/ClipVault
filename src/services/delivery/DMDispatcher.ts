import { discordClient } from "../../discord/client.js";
import { logger } from "../../utils/logger.js";

export interface DMResult {
  success: boolean;
  error?: string;
}

export class DMDispatcher {
  async sendDM(recipientId: string, content: string): Promise<DMResult> {
    try {
      const result = await discordClient.sendDM(recipientId, content);

      if (result) {
        logger.info("DM sent successfully", { recipientId });
        return { success: true };
      } else {
        logger.warn("DM send returned false", { recipientId });
        return { success: false, error: "Failed to send DM" };
      }
    } catch (error) {
      logger.error("Failed to send DM", {
        recipientId,
        error: String(error),
      });
      return { success: false, error: String(error) };
    }
  }

  async sendDMs(
    recipientIds: string[],
    content: string,
  ): Promise<Map<string, DMResult>> {
    const results = new Map<string, DMResult>();

    for (const recipientId of recipientIds) {
      const result = await this.sendDM(recipientId, content);
      results.set(recipientId, result);
    }

    return results;
  }
}

export const dmDispatcher = new DMDispatcher();
