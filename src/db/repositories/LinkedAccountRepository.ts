import {
  Prisma,
  PlatformType as PrismaPlatformType,
  AccountLinkStatus as PrismaAccountLinkStatus,
} from "@prisma/client";
import prisma from "../prisma.js";
import type { LinkedAccount, PollState } from "@prisma/client";
import type { PlatformType, AccountLinkStatus } from "../../types/index.js";

export interface CreateLinkedAccountData {
  userId: string;
  platform: PlatformType;
  platformAccountId: string;
  platformUsername?: string;
  status?: AccountLinkStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

export interface UpdateLinkedAccountData {
  platformUsername?: string;
  status?: AccountLinkStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

export interface LinkedAccountWithRelations extends LinkedAccount {
  pollState: PollState | null;
}

export class LinkedAccountRepository {
  async create(data: CreateLinkedAccountData): Promise<LinkedAccount> {
    return prisma.linkedAccount.create({
      data: {
        userId: data.userId,
        platform: data.platform as PrismaPlatformType,
        platformAccountId: data.platformAccountId,
        platformUsername: data.platformUsername,
        status: (data.status || "linked") as PrismaAccountLinkStatus,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry: data.tokenExpiry,
      },
    });
  }

  async findById(id: string): Promise<LinkedAccount | null> {
    return prisma.linkedAccount.findUnique({
      where: { id },
    });
  }

  async findByIdWithPollState(
    id: string,
  ): Promise<LinkedAccountWithRelations | null> {
    return prisma.linkedAccount.findUnique({
      where: { id },
      include: { pollState: true },
    });
  }

  async findByUserIdAndPlatform(
    userId: string,
    platform: PlatformType,
  ): Promise<LinkedAccount | null> {
    return prisma.linkedAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: platform as PrismaPlatformType,
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<LinkedAccount[]> {
    return prisma.linkedAccount.findMany({
      where: { userId },
      include: { pollState: true },
    });
  }

  async findByPlatformAndAccountId(
    platform: PlatformType,
    platformAccountId: string,
  ): Promise<LinkedAccount | null> {
    return prisma.linkedAccount.findFirst({
      where: {
        platform: platform as PrismaPlatformType,
        platformAccountId,
      },
    });
  }

  async findAllLinked(): Promise<LinkedAccount[]> {
    return prisma.linkedAccount.findMany({
      where: {
        status: "linked",
      },
      include: { pollState: true },
    });
  }

  async findAllLinkedWithPollStateEnabled(): Promise<
    LinkedAccountWithRelations[]
  > {
    return prisma.linkedAccount.findMany({
      where: {
        status: "linked",
        pollState: {
          pollingEnabled: true,
        },
      },
      include: {
        pollState: true,
        user: {
          select: {
            id: true,
            discordId: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: UpdateLinkedAccountData,
  ): Promise<LinkedAccount> {
    return prisma.linkedAccount.update({
      where: { id },
      data: {
        platformUsername: data.platformUsername,
        status: data.status as PrismaAccountLinkStatus | undefined,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry: data.tokenExpiry,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.linkedAccount.delete({
      where: { id },
    });
  }

  async findByPlatform(platform: PlatformType): Promise<LinkedAccount[]> {
    return prisma.linkedAccount.findMany({
      where: {
        platform: platform as PrismaPlatformType,
        status: "linked",
      },
      include: { pollState: true },
    });
  }

  async upsertPollState(
    linkedAccountId: string,
    lastMatchId: string,
  ): Promise<PollState> {
    return prisma.pollState.upsert({
      where: { linkedAccountId },
      update: {
        lastMatchId,
        lastCheckedAt: new Date(),
      },
      create: {
        linkedAccountId,
        lastMatchId,
      },
    });
  }
}

export const linkedAccountRepository = new LinkedAccountRepository();
