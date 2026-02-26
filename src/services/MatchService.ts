import { Prisma } from '@prisma/client';
import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { PlatformType, GamePlatform, MatchStatus } from '../types/index.js';
import type { MatchRecord } from '../types/index.js';

export class MatchService {
  async createMatch(
    userId: string,
    platform: PlatformType,
    gameTitle: GamePlatform,
    matchId: string,
    platformMatchId: string,
    metadata?: Record<string, unknown>
  ): Promise<MatchRecord> {
    const match = await prisma.matchRecord.create({
      data: {
        userId,
        platform,
        gameTitle,
        matchId,
        platformMatchId,
        status: MatchStatus.DETECTED,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });

    logger.info('Created match record', { 
      userId, 
      matchId: match.id, 
      platformMatchId,
      gameTitle 
    });

    return match as unknown as MatchRecord;
  }

  async getMatchByPlatformMatchId(platform: PlatformType, platformMatchId: string): Promise<MatchRecord | null> {
    const match = await prisma.matchRecord.findUnique({
      where: {
        platform_platformMatchId: {
          platform,
          platformMatchId,
        },
      },
    });
    return match as unknown as MatchRecord | null;
  }

  async getMatchById(id: string): Promise<MatchRecord | null> {
    const match = await prisma.matchRecord.findUnique({
      where: { id },
      include: { clips: true },
    });
    return match as unknown as MatchRecord | null;
  }

  async updateMatchStatus(
    id: string,
    status: MatchStatus,
    endedAt?: Date
  ): Promise<MatchRecord> {
    const match = await prisma.matchRecord.update({
      where: { id },
      data: {
        status,
        endedAt: endedAt || (status === MatchStatus.COMPLETED ? new Date() : undefined),
      },
    });

    logger.info('Updated match status', { matchId: id, status });

    return match as unknown as MatchRecord;
  }

  async getUserMatches(
    userId: string,
    limit = 10,
    status?: MatchStatus
  ): Promise<MatchRecord[]> {
    const matches = await prisma.matchRecord.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { clips: true },
    });
    return matches as unknown as MatchRecord[];
  }

  async getPendingMatches(): Promise<MatchRecord[]> {
    const matches = await prisma.matchRecord.findMany({
      where: {
        status: MatchStatus.DETECTED,
      },
      orderBy: { createdAt: 'asc' },
    });
    return matches as unknown as MatchRecord[];
  }

  async markMatchProcessing(id: string): Promise<MatchRecord> {
    return this.updateMatchStatus(id, MatchStatus.PROCESSING);
  }

  async markMatchCompleted(id: string): Promise<MatchRecord> {
    return this.updateMatchStatus(id, MatchStatus.COMPLETED, new Date());
  }

  async markMatchFailed(id: string): Promise<MatchRecord> {
    return this.updateMatchStatus(id, MatchStatus.FAILED);
  }
}

export const matchService = new MatchService();
