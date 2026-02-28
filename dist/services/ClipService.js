import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { ClipStatus } from '../types/index.js';
export class ClipService {
    async createClip(data) {
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
                metadata: data.metadata,
            },
        });
        logger.info('Created clip record', {
            matchId: data.matchId,
            clipId: clip.id,
            allstarClipId: data.allstarClipId,
            type: data.type
        });
        return clip;
    }
    async getMatchById(matchId) {
        const match = await prisma.matchRecord.findUnique({
            where: { id: matchId },
        });
        return match;
    }
    async getClipsByMatchId(matchId) {
        const clips = await prisma.clipRecord.findMany({
            where: { matchId },
        });
        return clips;
    }
    async getClipByAllstarId(allstarClipId) {
        const clip = await prisma.clipRecord.findUnique({
            where: { allstarClipId },
        });
        return clip;
    }
    async getClipById(id) {
        const clip = await prisma.clipRecord.findUnique({
            where: { id },
            include: { match: true, deliveries: true },
        });
        return clip;
    }
    async getClipsByMatch(matchId) {
        const clips = await prisma.clipRecord.findMany({
            where: { matchId },
        });
        return clips;
    }
    async getUserClips(userId, limit = 10, status) {
        const clips = await prisma.clipRecord.findMany({
            where: {
                userId,
                ...(status && { status }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return clips;
    }
    async getReadyClips() {
        const clips = await prisma.clipRecord.findMany({
            where: {
                status: ClipStatus.READY,
            },
            orderBy: { readyAt: 'asc' },
        });
        return clips;
    }
    async updateClipStatus(id, status, data) {
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
        return clip;
    }
    async markClipReady(id, data) {
        return this.updateClipStatus(id, ClipStatus.READY, data);
    }
    async markClipDelivered(id) {
        return this.updateClipStatus(id, ClipStatus.DELIVERED);
    }
    async markClipFailed(id) {
        return this.updateClipStatus(id, ClipStatus.FAILED);
    }
}
export const clipService = new ClipService();
//# sourceMappingURL=ClipService.js.map