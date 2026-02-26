import { Prisma } from '@prisma/client';
import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { ClipStatus, ClipType } from '../types/index.js';
import type { ClipRecord } from '../types/index.js';

export class ClipService {
  async createClip(
    matchId: string,
    userId: string,
    allstarClipId: string,
    type: ClipType,
    metadata?: Record<string, unknown>
  ): Promise<ClipRecord> {
    const clip = await prisma.clipRecord.create({
      data: {
        matchId,
        userId,
        allstarClipId,
        type,
        status: ClipStatus.REQUESTED,
        requestedAt: new Date(),
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });

    logger.info('Created clip record', { 
      matchId, 
      clipId: clip.id, 
      allstarClipId,
      type 
    });

    return clip as unknown as ClipRecord;
  }

  async getClipByAllstarId(allstarClipId: string): Promise<ClipRecord | null> {
    const clip = await prisma.clipRecord.findUnique({
      where: { allstarClipId },
    });
    return clip as unknown as ClipRecord | null;
  }

  async getClipById(id: string): Promise<ClipRecord | null> {
    const clip = await prisma.clipRecord.findUnique({
      where: { id },
      include: { match: true, deliveries: true },
    });
    return clip as unknown as ClipRecord | null;
  }

  async getClipsByMatch(matchId: string): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: { matchId },
    });
    return clips as unknown as ClipRecord[];
  }

  async getUserClips(
    userId: string,
    limit = 10,
    status?: ClipStatus
  ): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return clips as unknown as ClipRecord[];
  }

  async getReadyClips(): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: {
        status: ClipStatus.READY,
      },
      orderBy: { readyAt: 'asc' },
    });
    return clips as unknown as ClipRecord[];
  }

  async updateClipStatus(
    id: string,
    status: ClipStatus,
    data?: {
      thumbnailUrl?: string;
      videoUrl?: string;
      duration?: number;
      title?: string;
    }
  ): Promise<ClipRecord> {
    const clip = await prisma.clipRecord.update({
      where: { id },
      data: {
        status,
        ...(status === ClipStatus.READY && { readyAt: new Date() }),
        ...(status === ClipStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(data && {
          thumbnailUrl: data.thumbnailUrl,
          videoUrl: data.videoUrl,
          duration: data.duration,
          title: data.title,
        }),
      },
    });

    logger.info('Updated clip status', { clipId: id, status });

    return clip as unknown as ClipRecord;
  }

  async markClipReady(
    id: string,
    data: {
      thumbnailUrl?: string;
      videoUrl?: string;
      duration?: number;
      title?: string;
    }
  ): Promise<ClipRecord> {
    return this.updateClipStatus(id, ClipStatus.READY, data);
  }

  async markClipDelivered(id: string): Promise<ClipRecord> {
    return this.updateClipStatus(id, ClipStatus.DELIVERED);
  }

  async markClipFailed(id: string): Promise<ClipRecord> {
    return this.updateClipStatus(id, ClipStatus.FAILED);
  }
}

export const clipService = new ClipService();
