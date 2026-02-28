import { ClipStatus, ClipType } from '../types/index.js';
import type { ClipRecord, MatchRecord } from '../types/index.js';
export interface CreateClipData {
    matchId: string;
    userId: string;
    allstarClipId: string;
    type: ClipType;
    title?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    duration?: number;
    metadata?: Record<string, unknown>;
}
export declare class ClipService {
    createClip(data: CreateClipData): Promise<ClipRecord>;
    getMatchById(matchId: string): Promise<MatchRecord | null>;
    getClipsByMatchId(matchId: string): Promise<ClipRecord[]>;
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