import {
  Prisma,
  ClipStatus as PrismaClipStatus,
  ClipType as PrismaClipType,
} from "@prisma/client";
import prisma from "../prisma.js";
import { ClipStatus } from "../../types/index.js";
import type { ClipRecord, ClipType } from "../../types/index.js";

export interface CreateClipData {
  matchId: string;
  userId: string;
  allstarClipId: string;
  type: ClipType;
  title?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  status: ClipStatus;
  metadata?: Prisma.InputJsonValue;
}

export interface UpdateClipData {
  status?: ClipStatus;
  title?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  metadata?: Prisma.InputJsonValue;
}

export class ClipRepository {
  async create(data: CreateClipData): Promise<ClipRecord> {
    const clip = await prisma.clipRecord.create({
      data: {
        matchId: data.matchId,
        userId: data.userId,
        allstarClipId: data.allstarClipId,
        type: data.type as PrismaClipType,
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        videoUrl: data.videoUrl,
        duration: data.duration,
        status: data.status as PrismaClipStatus,
        requestedAt:
          data.status === ClipStatus.REQUESTED ? new Date() : undefined,
        metadata: data.metadata,
      },
    });
    return clip as unknown as ClipRecord;
  }

  async findById(id: string): Promise<ClipRecord | null> {
    const clip = await prisma.clipRecord.findUnique({
      where: { id },
      include: { match: true, deliveries: true },
    });
    return clip as unknown as ClipRecord | null;
  }

  async findByAllstarClipId(allstarClipId: string): Promise<ClipRecord | null> {
    const clip = await prisma.clipRecord.findUnique({
      where: { allstarClipId },
    });
    return clip as unknown as ClipRecord | null;
  }

  async findByMatchId(matchId: string): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: { matchId },
    });
    return clips as unknown as ClipRecord[];
  }

  async findByUserId(userId: string, limit = 10): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return clips as unknown as ClipRecord[];
  }

  async findByUserIdAndStatus(
    userId: string,
    status: ClipStatus,
    limit = 10,
  ): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: {
        userId,
        status: status as PrismaClipStatus,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return clips as unknown as ClipRecord[];
  }

  async findByStatus(status: ClipStatus, limit = 100): Promise<ClipRecord[]> {
    const clips = await prisma.clipRecord.findMany({
      where: {
        status: status as PrismaClipStatus,
      },
      orderBy: { readyAt: "asc" },
      take: limit,
    });
    return clips as unknown as ClipRecord[];
  }

  async update(id: string, data: UpdateClipData): Promise<ClipRecord> {
    const updateData: Prisma.ClipRecordUpdateInput = {};

    if (data.status) {
      updateData.status = data.status as PrismaClipStatus;
      if (data.status === ClipStatus.READY) {
        (updateData as Record<string, unknown>).readyAt = new Date();
      } else if (data.status === ClipStatus.DELIVERED) {
        (updateData as Record<string, unknown>).deliveredAt = new Date();
      }
    }
    if (data.title !== undefined) updateData.title = data.title;
    if (data.thumbnailUrl !== undefined)
      updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const clip = await prisma.clipRecord.update({
      where: { id },
      data: updateData,
    });
    return clip as unknown as ClipRecord;
  }

  async delete(id: string): Promise<void> {
    await prisma.clipRecord.delete({
      where: { id },
    });
  }

  async countByMatchId(matchId: string): Promise<number> {
    return prisma.clipRecord.count({
      where: { matchId },
    });
  }
}

export const clipRepository = new ClipRepository();
