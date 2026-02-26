import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
export class MatchService {
    async createMatch(userId, platform, gameTitle, matchId, platformMatchId, metadata) {
        const match = await prisma.matchRecord.create({
            data: {
                userId,
                platform,
                gameTitle,
                matchId,
                platformMatchId,
                status: "detected" /* MatchStatus.DETECTED */,
                metadata: metadata,
            },
        });
        logger.info('Created match record', {
            userId,
            matchId: match.id,
            platformMatchId,
            gameTitle
        });
        return match;
    }
    async getMatchByPlatformMatchId(platform, platformMatchId) {
        const match = await prisma.matchRecord.findUnique({
            where: {
                platform_platformMatchId: {
                    platform,
                    platformMatchId,
                },
            },
        });
        return match;
    }
    async getMatchById(id) {
        const match = await prisma.matchRecord.findUnique({
            where: { id },
            include: { clips: true },
        });
        return match;
    }
    async updateMatchStatus(id, status, endedAt) {
        const match = await prisma.matchRecord.update({
            where: { id },
            data: {
                status,
                endedAt: endedAt || (status === "completed" /* MatchStatus.COMPLETED */ ? new Date() : undefined),
            },
        });
        logger.info('Updated match status', { matchId: id, status });
        return match;
    }
    async getUserMatches(userId, limit = 10, status) {
        const matches = await prisma.matchRecord.findMany({
            where: {
                userId,
                ...(status && { status }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { clips: true },
        });
        return matches;
    }
    async getPendingMatches() {
        const matches = await prisma.matchRecord.findMany({
            where: {
                status: "detected" /* MatchStatus.DETECTED */,
            },
            orderBy: { createdAt: 'asc' },
        });
        return matches;
    }
    async markMatchProcessing(id) {
        return this.updateMatchStatus(id, "processing" /* MatchStatus.PROCESSING */);
    }
    async markMatchCompleted(id) {
        return this.updateMatchStatus(id, "completed" /* MatchStatus.COMPLETED */, new Date());
    }
    async markMatchFailed(id) {
        return this.updateMatchStatus(id, "failed" /* MatchStatus.FAILED */);
    }
}
export const matchService = new MatchService();
//# sourceMappingURL=MatchService.js.map