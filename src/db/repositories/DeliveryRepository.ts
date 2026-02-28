import {
  Prisma,
  DeliveryMethod as PrismaDeliveryMethod,
  DeliveryStatus as PrismaDeliveryStatus,
} from "@prisma/client";
import prisma from "../prisma.js";
import type { DeliveryRecord } from "@prisma/client";
import type { DeliveryMethod, DeliveryStatus } from "../../types/index.js";

export interface CreateDeliveryData {
  clipId: string;
  userId: string;
  recipientId: string;
  method: DeliveryMethod;
  status?: DeliveryStatus;
  sentAt?: Date;
  error?: string;
}

export interface UpdateDeliveryData {
  status?: DeliveryStatus;
  sentAt?: Date;
  error?: string;
}

export class DeliveryRepository {
  async create(data: CreateDeliveryData): Promise<DeliveryRecord> {
    const delivery = await prisma.deliveryRecord.create({
      data: {
        clipId: data.clipId,
        userId: data.userId,
        recipientId: data.recipientId,
        method: data.method as PrismaDeliveryMethod,
        status:
          (data.status as PrismaDeliveryStatus) ||
          ("pending" as PrismaDeliveryStatus),
        sentAt: data.sentAt,
        error: data.error,
      },
    });
    return delivery as unknown as DeliveryRecord;
  }

  async findById(id: string): Promise<DeliveryRecord | null> {
    return prisma.deliveryRecord.findUnique({
      where: { id },
    });
  }

  async findByClipId(clipId: string): Promise<DeliveryRecord[]> {
    return prisma.deliveryRecord.findMany({
      where: { clipId },
    });
  }

  async findByUserId(userId: string, limit = 20): Promise<DeliveryRecord[]> {
    return prisma.deliveryRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findByRecipientId(
    recipientId: string,
    limit = 20,
  ): Promise<DeliveryRecord[]> {
    return prisma.deliveryRecord.findMany({
      where: { recipientId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async findByStatus(
    status: DeliveryStatus,
    limit = 100,
  ): Promise<DeliveryRecord[]> {
    return prisma.deliveryRecord.findMany({
      where: {
        status: status as PrismaDeliveryStatus,
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async update(id: string, data: UpdateDeliveryData): Promise<DeliveryRecord> {
    return prisma.deliveryRecord.update({
      where: { id },
      data: {
        status: data.status as PrismaDeliveryStatus | undefined,
        sentAt: data.sentAt,
        error: data.error,
      },
    });
  }

  async markAsSent(id: string): Promise<DeliveryRecord> {
    return prisma.deliveryRecord.update({
      where: { id },
      data: {
        status: "sent" as PrismaDeliveryStatus,
        sentAt: new Date(),
      },
    });
  }

  async markAsFailed(id: string, error: string): Promise<DeliveryRecord> {
    return prisma.deliveryRecord.update({
      where: { id },
      data: {
        status: "failed" as PrismaDeliveryStatus,
        error,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.deliveryRecord.delete({
      where: { id },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.deliveryRecord.count({
      where: { userId },
    });
  }
}

export const deliveryRepository = new DeliveryRepository();
