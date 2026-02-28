import {
  Prisma,
  PlatformType as PrismaPlatformType,
  GamePlatform as PrismaGamePlatform,
  MatchStatus as PrismaMatchStatus,
} from "@prisma/client";
import prisma from "../prisma.js";
import type { MatchRecord, ClipRecord } from "@prisma/client";
import type {
  PlatformType,
  GamePlatform,
  MatchStatus,
} from "../../types/index.js";

export interface CreateMatchData {
  userId: string;
  platform: PlatformType;
  gameTitle: GamePlatform;
  matchId: string;
  platformMatchId: string;
  status?: MatchStatus;
  metadata?: Record<string, unknown>;
  startedAt?: Date;
}

export interface UpdateMatchData {
  status?: MatchStatus;
  endedAt?: Date;
  metadata?: Record<string, unknown>;
}

export class MatchRepository {
  async create(data: CreateMatchData): Promise<MatchRecord> {
    return prisma.matchRecord.create({
      data: {
        userId: data.userId,
        platform: data.platform as PrismaPlatformType,
        gameTitle: data.gameTitle as PrismaGamePlatform,
        matchId: data.matchId,
        platformMatchId: data.platformMatchId,
        status: (data.status || "detected") as PrismaMatchStatus,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        startedAt: data.startedAt,
      },
    });
  }

  async findById(id: string): Promise<MatchRecord | null> {
    return prisma.matchRecord.findUnique({
      where: { id },
      include: { clips: true },
    });
  }

  async findByPlatformMatchId(
    platform: PlatformType,
    platformMatchId: string,
  ): Promise<MatchRecord | null> {
    return prisma.matchRecord.findUnique({
      where: {
        platform_platformMatchId: {
          platform: platform as PrismaPlatformType,
          platformMatchId,
        },
      },
    });
  }

  async findByUserId(userId: string, limit = 10): Promise<MatchRecord[]> {
    return prisma.matchRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { clips: true },
    });
  }

  async findByUserIdAndStatus(
    userId: string,
    status: MatchStatus,
    limit = 10,
  ): Promise<MatchRecord[]> {
    return prisma.matchRecord.findMany({
      where: {
        userId,
        status: status as PrismaMatchStatus,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { clips: true },
    });
  }

  async findByStatus(status: MatchStatus, limit = 100): Promise<MatchRecord[]> {
    return prisma.matchRecord.findMany({
      where: {
        status: status as PrismaMatchStatus,
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: { clips: true },
    });
  }

  async update(id: string, data: UpdateMatchData): Promise<MatchRecord> {
    return prisma.matchRecord.update({
      where: { id },
      data: {
        status: data.status as PrismaMatchStatus | undefined,
        endedAt: data.endedAt,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.matchRecord.delete({
      where: { id },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.matchRecord.count({
      where: { userId },
    });
  }

  async findRecentByUserId(userId: string, limit = 10): Promise<MatchRecord[]> {
    return prisma.matchRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { clips: true },
    });
  }
}

export const matchRepository = new MatchRepository();
