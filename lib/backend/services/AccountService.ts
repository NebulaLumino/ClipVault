import { PlatformType } from "../types/index.js";

const DATABASE_URL = process.env.DATABASE_URL;

type PrismaPlatform = "steam" | "riot" | "epic";

function toPrismaPlatform(platform: PlatformType): PrismaPlatform {
  return platform.toLowerCase() as PrismaPlatform;
}

class AccountService {
  async linkAccount(
    userId: string,
    platform: PlatformType,
    platformAccountId: string,
    platformUsername?: string,
    accessToken?: string,
    _code?: string
  ): Promise<unknown> {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });

    try {
      const prismaPlatform = toPrismaPlatform(platform);
      const existingAccount = await prisma.linkedAccount.findFirst({
        where: {
          userId,
          platform: prismaPlatform,
        },
      });

      if (existingAccount) {
        return prisma.linkedAccount.update({
          where: { id: existingAccount.id },
          data: {
            platformAccountId,
            platformUsername,
            accessToken,
            updatedAt: new Date(),
          },
        });
      }

      return prisma.linkedAccount.create({
        data: {
          userId,
          platform: prismaPlatform,
          platformAccountId,
          platformUsername,
          accessToken,
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  async unlinkAccount(userId: string, platform: PlatformType): Promise<void> {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });

    try {
      const prismaPlatform = toPrismaPlatform(platform);
      await prisma.linkedAccount.deleteMany({
        where: {
          userId,
          platform: prismaPlatform,
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  async getLinkedAccounts(userId: string): Promise<unknown[]> {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });

    try {
      return prisma.linkedAccount.findMany({
        where: { userId },
      });
    } finally {
      await prisma.$disconnect();
    }
  }
}

export const accountService = new AccountService();
