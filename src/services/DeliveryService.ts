import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { discordClient } from '../discord/client.js';
import { DeliveryMethod, DeliveryStatus, ClipStatus } from '../types/index.js';
import type { DeliveryRecord, ClipRecord } from '../types/index.js';

export class DeliveryService {
  async createDelivery(
    clipId: string,
    userId: string,
    recipientId: string,
    method: DeliveryMethod
  ): Promise<DeliveryRecord> {
    const delivery = await prisma.deliveryRecord.create({
      data: {
        clipId,
        userId,
        recipientId,
        method,
        status: DeliveryStatus.PENDING,
      },
    });

    logger.info('Created delivery record', { 
      deliveryId: delivery.id,
      clipId,
      userId,
      recipientId,
      method 
    });

    return delivery as unknown as DeliveryRecord;
  }

  async deliverClip(clipId: string, userId: string): Promise<boolean> {
    const clip = await prisma.clipRecord.findUnique({
      where: { id: clipId },
      include: { match: true },
    });

    if (!clip || clip.status !== ClipStatus.READY) {
      logger.warn('Clip not ready for delivery', { clipId, status: clip?.status });
      return false;
    }

    // Get user preferences for delivery method
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const preferences = user?.preferences as { deliveryMethod?: string; channelId?: string } | null;
    const method = (preferences?.deliveryMethod as DeliveryMethod) || DeliveryMethod.DM;
    const channelId = preferences?.channelId;

    let recipientId = userId;
    if (method === DeliveryMethod.CHANNEL && channelId) {
      recipientId = channelId;
    }

    const delivery = await this.createDelivery(clipId, userId, recipientId, method);

    try {
      const message = this.formatClipMessage(clip as ClipRecord);
      
      if (method === DeliveryMethod.DM) {
        const result = await discordClient.sendDM(recipientId, message);
        if (!result) {
          throw new Error('Failed to send DM');
        }
      } else {
        // Channel delivery - send to specified channel
        const channel = await discordClient.channels.fetch(recipientId);
        if (channel && 'send' in channel && typeof channel.send === 'function') {
          await channel.send(message);
        } else {
          throw new Error('Channel not found or not text-based');
        }
      }

      await prisma.deliveryRecord.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.SENT,
          sentAt: new Date(),
        },
      });

      // Update clip status
      await prisma.clipRecord.update({
        where: { id: clipId },
        data: {
          status: ClipStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });

      logger.info('Clip delivered successfully', { clipId, deliveryId: delivery.id });
      return true;
    } catch (error) {
      await prisma.deliveryRecord.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.FAILED,
          error: String(error),
        },
      });

      logger.error('Failed to deliver clip', { clipId, deliveryId: delivery.id, error: String(error) });
      return false;
    }
  }

  private formatClipMessage(clip: ClipRecord): string {
    const lines = [
      '🎬 **Your ClipVault Highlights!**',
      '',
    ];

    if (clip.title) {
      lines.push(`**${clip.title}**`);
    }

    lines.push(`📊 Type: ${clip.type}`);
    
    if (clip.duration) {
      lines.push(`⏱️ Duration: ${clip.duration}s`);
    }

    if (clip.videoUrl) {
      lines.push(`🔗 Watch: ${clip.videoUrl}`);
    }

    if (clip.thumbnailUrl) {
      lines.push(`🖼️ Thumbnail: ${clip.thumbnailUrl}`);
    }

    lines.push('');
    lines.push('_Powered by ClipVault_');

    return lines.join('\n');
  }

  async getDeliveryHistory(
    userId: string,
    limit = 10
  ): Promise<DeliveryRecord[]> {
    const deliveries = await prisma.deliveryRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { clip: true },
    });
    return deliveries as unknown as DeliveryRecord[];
  }

  async getDeliveryById(id: string): Promise<DeliveryRecord | null> {
    const delivery = await prisma.deliveryRecord.findUnique({
      where: { id },
      include: { clip: true },
    });
    return delivery as unknown as DeliveryRecord | null;
  }
}

export const deliveryService = new DeliveryService();
