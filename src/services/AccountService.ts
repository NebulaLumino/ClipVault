import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { PlatformType, AccountLinkStatus } from '../types/index.js';
import { steamClient } from '../integrations/steam/SteamClient.js';
import { riotClient } from '../integrations/riot/RiotClient.js';
import { epicClient } from '../integrations/epic/EpicClient.js';
import type { LinkedAccount } from '../types/index.js';

interface MatchInfo {
  matchId: string;
  matchtime?: number;
  result?: string;
}

export class AccountService {
  async linkAccount(
    userId: string,
    platform: PlatformType,
    platformAccountId: string,
    platformUsername?: string,
    accessToken?: string,
    refreshToken?: string,
    tokenExpiry?: Date
  ): Promise<LinkedAccount> {
    // Check if account already exists
    const existing = await prisma.linkedAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });

    if (existing) {
      // Update existing account
      const updated = await prisma.linkedAccount.update({
        where: { id: existing.id },
        data: {
          platformAccountId,
          platformUsername,
          status: AccountLinkStatus.LINKED,
          accessToken,
          refreshToken,
          tokenExpiry,
          updatedAt: new Date(),
        },
      });
      logger.info('Updated linked account', { userId, platform, accountId: updated.id });
      return updated as unknown as LinkedAccount;
    }

    // Create new account
    const account = await prisma.linkedAccount.create({
      data: {
        userId,
        platform,
        platformAccountId,
        platformUsername,
        status: AccountLinkStatus.LINKED,
        accessToken,
        refreshToken,
        tokenExpiry,
      },
    });

    // Create poll state for the account
    await prisma.pollState.create({
      data: {
        linkedAccountId: account.id,
      },
    });

    logger.info('Created new linked account', { userId, platform, accountId: account.id });
    return account as unknown as LinkedAccount;
  }

  async unlinkAccount(userId: string, platform: PlatformType): Promise<boolean> {
    const account = await prisma.linkedAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
    });

    if (!account) {
      return false;
    }

    // Delete poll state first
    await prisma.pollState.delete({
      where: { linkedAccountId: account.id },
    }).catch(() => {});

    // Delete the account
    await prisma.linkedAccount.delete({
      where: { id: account.id },
    });

    logger.info('Unlinked account', { userId, platform });
    return true;
  }

  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    const accounts = await prisma.linkedAccount.findMany({
      where: { userId },
      include: { pollState: true },
    });
    return accounts as unknown as LinkedAccount[];
  }

  async getLinkedAccount(userId: string, platform: PlatformType): Promise<LinkedAccount | null> {
    const account = await prisma.linkedAccount.findUnique({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
      include: { pollState: true },
    });
    return account as LinkedAccount | null;
  }

  async getLinkedAccountById(id: string): Promise<LinkedAccount | null> {
    const account = await prisma.linkedAccount.findUnique({
      where: { id },
      include: { pollState: true },
    });
    return account as LinkedAccount | null;
  }

  async updatePollState(
    linkedAccountId: string,
    data: {
      lastMatchId: string;
      lastCheckedAt?: Date;
    }
  ): Promise<void> {
    await prisma.pollState.upsert({
      where: { linkedAccountId },
      update: {
        lastMatchId: data.lastMatchId,
        lastCheckedAt: data.lastCheckedAt || new Date(),
      },
      create: {
        linkedAccountId,
        lastMatchId: data.lastMatchId,
      },
    });
  }

  async getAccountsToPoll(): Promise<LinkedAccount[]> {
    const accounts = await prisma.linkedAccount.findMany({
      where: {
        status: AccountLinkStatus.LINKED,
        pollState: {
          pollingEnabled: true,
        },
      },
      include: { pollState: true },
    });
    return accounts as LinkedAccount[];
  }

  async getAccountsByPlatform(platform: PlatformType): Promise<LinkedAccount[]> {
    const accounts = await prisma.linkedAccount.findMany({
      where: {
        platform,
        status: AccountLinkStatus.LINKED,
      },
      include: { pollState: true },
    });
    return accounts as LinkedAccount[];
  }

  async getRecentMatches(platform: PlatformType, platformAccountId: string, count = 5): Promise<MatchInfo[]> {
    try {
      switch (platform) {
        case PlatformType.STEAM: {
          const matches = await steamClient.getCS2MatchHistory(platformAccountId, count);
          return matches.map((m: { matchid: string; matchtime?: number; result?: string }) => ({
            matchId: m.matchid,
            matchtime: m.matchtime,
            result: m.result,
          }));
        }
        case PlatformType.RIOT: {
          const matchIds = await riotClient.getMatchList(platformAccountId, count);
          return matchIds.map((id: string) => ({ matchId: id }));
        }
        case PlatformType.EPIC: {
          // Epic Games doesn't have a public match API
          logger.warn('Epic Games match fetching not implemented');
          return [];
        }
        default:
          return [];
      }
    } catch (error) {
      logger.error('Failed to get recent matches', { platform, platformAccountId, error: String(error) });
      return [];
    }
  }
}

export const accountService = new AccountService();
