import { Prisma } from '@prisma/client';
import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { ClipStatus, ClipType, MatchStatus } from '../types/index.js';
import type { ClipRecord, MatchRecord } from '../types/index.js';

export interface CreateClipData {
  matchId: string;
  userId: string;
  allstarClipId: string;
  type: ClipType;
  title?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export class ClipService {
  async createClip(data: CreateClipData): Promise<ClipRecord> {
    const clip = await prisma.clipRecord.create({
      data: {
        matchId: data.matchId,
        userId: data.userId,
        allstarClipId: data.allstarClipId,
        type: data.type,
        status: ClipStatus.REQUESTED,
        requestedAt: new Date(),
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        videoUrl: data.videoUrl,
        duration: data.duration,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    logger.info('Created clip record', { 
      matchId: data.matchId, 
      clipId: clip.id, 
      allstarClipId: data.allstarClipId,
      type: data.type 
    });

    return clip as unknown as ClipRecord;
  }

  async getMatchById(matchId: string): Promise<MatchRecord | null> {
    const match = await prisma.matchRecord.findUnique({
      where: { id: matchId },
    });
    return match as unknown as MatchRecord | null;
  }

  async getClipsByMatchId(matchId: string): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: { matchId },
    });
    return clips as unknown as ClipRecord[];
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
          ...(data.thumbnailUrl && { thumbnailUrl: data.thumbnailUrl }),
          ...(data.videoUrl && { videoUrl: data.videoUrl }),
          ...(data.duration && { duration: data.duration }),
          ...(data.title && { title: data.title }),
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
