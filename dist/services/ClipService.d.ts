import { ClipStatus, ClipType } from '../types/index.js';
import type { ClipRecord } from '../types/index.js';
export declare class ClipService {
    createClip(matchId: string, userId: string, allstarClipId: string, type: ClipType, metadata?: Record<string, unknown>): Promise<ClipRecord>;
    getClipByAllstarId(allstarClipId: string): Promise<ClipRecord | null>;
    getClipById(id: string): Promise<ClipRecord | null>;
    getClipsByMatch(matchId: string): Promise<ClipRecord[]>;
    getUserClips(userId: string, limit?: number, status?: ClipStatus): Promise<ClipRecord[]>;
    getReadyClips(): Promise<ClipRecord[]>;
    updateClipStatus(id: string, status: ClipStatus, data?: {
        thumbnailUrl?: string;
        videoUrl?: string;
        duration?: number;
        title?: string;
    }): Promise<ClipRecord>;
    markClipReady(id: string, data: {
        thumbnailUrl?: string;
        videoUrl?: string;
        duration?: number;
        title?: string;
    }): Promise<ClipRecord>;
    markClipDelivered(id: string): Promise<ClipRecord>;
    markClipFailed(id: string): Promise<ClipRecord>;
}
export declare const clipService: ClipService;
//# sourceMappingURL=ClipService.d.ts.map