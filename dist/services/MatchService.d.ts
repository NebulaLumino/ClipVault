import { PlatformType, GamePlatform, MatchStatus } from '../types/index.js';
import type { MatchRecord } from '../types/index.js';
export declare class MatchService {
    createMatch(userId: string, platform: PlatformType, gameTitle: GamePlatform, matchId: string, platformMatchId: string, metadata?: Record<string, unknown>): Promise<MatchRecord>;
    getMatchByPlatformMatchId(platform: PlatformType, platformMatchId: string): Promise<MatchRecord | null>;
    getMatchById(id: string): Promise<MatchRecord | null>;
    updateMatchStatus(id: string, status: MatchStatus, endedAt?: Date): Promise<MatchRecord>;
    getUserMatches(userId: string, limit?: number, status?: MatchStatus): Promise<MatchRecord[]>;
    getPendingMatches(): Promise<MatchRecord[]>;
    markMatchProcessing(id: string): Promise<MatchRecord>;
    markMatchCompleted(id: string): Promise<MatchRecord>;
    markMatchFailed(id: string): Promise<MatchRecord>;
}
export declare const matchService: MatchService;
//# sourceMappingURL=MatchService.d.ts.map