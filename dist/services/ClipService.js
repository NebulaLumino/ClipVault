import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
export class ClipService {
    async createClip(matchId, userId, allstarClipId, type, metadata) {
        const clip = await prisma.clipRecord.create({
            data: {
                matchId,
                userId,
                allstarClipId,
                type,
                status: "requested" /* ClipStatus.REQUESTED */,
                requestedAt: new Date(),
                metadata: metadata,
            },
        });
        logger.info('Created clip record', {
            matchId,
            clipId: clip.id,
            allstarClipId,
            type
        });
        return clip;
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
                status: "ready" /* ClipStatus.READY */,
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
                ...(status === "ready" /* ClipStatus.READY */ && { readyAt: new Date() }),
                ...(status === "delivered" /* ClipStatus.DELIVERED */ && { deliveredAt: new Date() }),
                ...(data && {
                    thumbnailUrl: data.thumbnailUrl,
                    videoUrl: data.videoUrl,
                    duration: data.duration,
                    title: data.title,
                }),
            },
        });
        logger.info('Updated clip status', { clipId: id, status });
        return clip;
    }
    async markClipReady(id, data) {
        return this.updateClipStatus(id, "ready" /* ClipStatus.READY */, data);
    }
    async markClipDelivered(id) {
        return this.updateClipStatus(id, "delivered" /* ClipStatus.DELIVERED */);
    }
    async markClipFailed(id) {
        return this.updateClipStatus(id, "failed" /* ClipStatus.FAILED */);
    }
}
export const clipService = new ClipService();
//# sourceMappingURL=ClipService.js.map