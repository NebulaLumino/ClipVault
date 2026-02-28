import prisma from "../../db/prisma.js";
import { clipRepository } from "../../db/repositories/ClipRepository.js";
import { deliveryRepository } from "../../db/repositories/DeliveryRepository.js";
import { userRepository } from "../../db/repositories/UserRepository.js";
import { messageFormatter } from "./MessageFormatter.js";
import { dmDispatcher } from "./DMDispatcher.js";
import { channelPoster } from "./ChannelPoster.js";
import { logger } from "../../utils/logger.js";
import {
  DeliveryMethod,
  DeliveryStatus,
  ClipStatus,
  type ClipRecord,
  type DeliveryRecord,
} from "../../types/index.js";

export interface DeliverClipOptions {
  clipId: string;
  userId: string;
  method?: DeliveryMethod;
  channelId?: string;
}

export class DeliveryEngine {
  async deliverClip(clipId: string, userId: string): Promise<boolean> {
    const clip = await clipRepository.findById(clipId);

    if (!clip) {
      logger.warn("Clip not found for delivery", { clipId });
      return false;
    }

    if (clip.status !== ClipStatus.READY) {
      logger.warn("Clip not ready for delivery", {
        clipId,
        status: clip.status,
      });
      return false;
    }

    const preferences = await this.getUserDeliveryPreferences(userId);
    const method = preferences.deliveryMethod;
    const channelId = preferences.channelId;

    const message = messageFormatter.formatClipMessage(clip);
    let recipientId = userId;

    if (method === DeliveryMethod.CHANNEL && channelId) {
      recipientId = channelId;
    }

    const delivery = await deliveryRepository.create({
      clipId,
      userId,
      recipientId,
      method,
      status: DeliveryStatus.PENDING,
    });

    try {
      let result: { success: boolean; error?: string; messageId?: string };

      if (method === DeliveryMethod.DM) {
        result = await dmDispatcher.sendDM(recipientId, message.content);
      } else {
        result = await channelPoster.postToChannel(
          recipientId,
          message.content,
        );
      }

      if (result.success) {
        await deliveryRepository.update(delivery.id, {
          status: DeliveryStatus.SENT,
          sentAt: new Date(),
        });

        await clipRepository.update(clipId, {
          status: ClipStatus.DELIVERED,
        });

        logger.info("Clip delivered successfully", {
          clipId,
          deliveryId: delivery.id,
          method,
        });
        return true;
      } else {
        await deliveryRepository.update(delivery.id, {
          status: DeliveryStatus.FAILED,
          error: result.error,
        });

        logger.error("Failed to deliver clip", {
          clipId,
          deliveryId: delivery.id,
          error: result.error,
        });
        return false;
      }
    } catch (error) {
      await deliveryRepository.update(delivery.id, {
        status: DeliveryStatus.FAILED,
        error: String(error),
      });

      logger.error("Exception delivering clip", {
        clipId,
        deliveryId: delivery.id,
        error: String(error),
      });
      return false;
    }
  }

  async deliverClipToChannel(
    clipId: string,
    channelId: string,
  ): Promise<boolean> {
    const clip = await clipRepository.findById(clipId);

    if (!clip) {
      logger.warn("Clip not found for channel delivery", { clipId });
      return false;
    }

    const message = messageFormatter.formatClipMessage(clip);
    const result = await channelPoster.postToChannel(
      channelId,
      message.content,
    );

    if (result.success) {
      await deliveryRepository.create({
        clipId,
        userId: clip.userId,
        recipientId: channelId,
        method: DeliveryMethod.CHANNEL,
        status: DeliveryStatus.SENT,
        sentAt: new Date(),
      });
    }

    return result.success;
  }

  async retryFailedDeliveries(limit = 20): Promise<number> {
    const failedDeliveries = await deliveryRepository.findByStatus(
      DeliveryStatus.FAILED,
      limit,
    );
    let retriedCount = 0;

    for (const delivery of failedDeliveries) {
      const clip = await clipRepository.findById(delivery.clipId);
      if (clip && clip.status === ClipStatus.READY) {
        const success = await this.deliverClip(clip.id, delivery.userId);
        if (success) {
          retriedCount++;
        }
      }
    }

    logger.info("Retried failed deliveries", { retriedCount });
    return retriedCount;
  }

  private async getUserDeliveryPreferences(userId: string): Promise<{
    deliveryMethod: DeliveryMethod;
    channelId?: string;
  }> {
    const user = await userRepository.findById(userId);

    if (!user) {
      return { deliveryMethod: DeliveryMethod.DM };
    }

    const preferences = user.preferences as {
      deliveryMethod?: string;
      channelId?: string;
    } | null;

    return {
      deliveryMethod:
        (preferences?.deliveryMethod as DeliveryMethod) || DeliveryMethod.DM,
      channelId: preferences?.channelId,
    };
  }
}

export const deliveryService = new DeliveryEngine();
