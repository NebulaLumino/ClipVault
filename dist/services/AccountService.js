import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { PlatformType, AccountLinkStatus } from '../types/index.js';
import { steamClient } from '../integrations/steam/SteamClient.js';
import { riotClient } from '../integrations/riot/RiotClient.js';
export class AccountService {
    async linkAccount(userId, platform, platformAccountId, platformUsername, accessToken, refreshToken, tokenExpiry) {
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
            return updated;
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
        return account;
    }
    async unlinkAccount(userId, platform) {
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
        }).catch(() => { });
        // Delete the account
        await prisma.linkedAccount.delete({
            where: { id: account.id },
        });
        logger.info('Unlinked account', { userId, platform });
        return true;
    }
    async getLinkedAccounts(userId) {
        const accounts = await prisma.linkedAccount.findMany({
            where: { userId },
            include: { pollState: true },
        });
        return accounts;
    }
    async getLinkedAccount(userId, platform) {
        const account = await prisma.linkedAccount.findUnique({
            where: {
                userId_platform: {
                    userId,
                    platform,
                },
            },
            include: { pollState: true },
        });
        return account;
    }
    async getLinkedAccountById(id) {
        const account = await prisma.linkedAccount.findUnique({
            where: { id },
            include: { pollState: true },
        });
        return account;
    }
    async updatePollState(linkedAccountId, data) {
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
    async getAccountsToPoll() {
        const accounts = await prisma.linkedAccount.findMany({
            where: {
                status: AccountLinkStatus.LINKED,
                pollState: {
                    pollingEnabled: true,
                },
            },
            include: { pollState: true },
        });
        return accounts;
    }
    async getAccountsByPlatform(platform) {
        const accounts = await prisma.linkedAccount.findMany({
            where: {
                platform,
                status: AccountLinkStatus.LINKED,
            },
            include: { pollState: true },
        });
        return accounts;
    }
    async getRecentMatches(platform, platformAccountId, count = 5) {
        try {
            switch (platform) {
                case PlatformType.STEAM: {
                    const matches = await steamClient.getCS2MatchHistory(platformAccountId, count);
                    return matches.map((m) => ({
                        matchId: m.matchid,
                        matchtime: m.matchtime,
                        result: m.result,
                    }));
                }
                case PlatformType.RIOT: {
                    const matchIds = await riotClient.getMatchList(platformAccountId, count);
                    return matchIds.map((id) => ({ matchId: id }));
                }
                case PlatformType.EPIC: {
                    // Epic Games doesn't have a public match API
                    logger.warn('Epic Games match fetching not implemented');
                    return [];
                }
                default:
                    return [];
            }
        }
        catch (error) {
            logger.error('Failed to get recent matches', { platform, platformAccountId, error: String(error) });
            return [];
        }
    }
}
export const accountService = new AccountService();
//# sourceMappingURL=AccountService.js.map