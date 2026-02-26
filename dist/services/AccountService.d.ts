import { PlatformType } from '../types/index.js';
import type { LinkedAccount } from '../types/index.js';
interface MatchInfo {
    matchId: string;
    matchtime?: number;
    result?: string;
}
export declare class AccountService {
    linkAccount(userId: string, platform: PlatformType, platformAccountId: string, platformUsername?: string, accessToken?: string, refreshToken?: string, tokenExpiry?: Date): Promise<LinkedAccount>;
    unlinkAccount(userId: string, platform: PlatformType): Promise<boolean>;
    getLinkedAccounts(userId: string): Promise<LinkedAccount[]>;
    getLinkedAccount(userId: string, platform: PlatformType): Promise<LinkedAccount | null>;
    getLinkedAccountById(id: string): Promise<LinkedAccount | null>;
    updatePollState(linkedAccountId: string, data: {
        lastMatchId: string;
        lastCheckedAt?: Date;
    }): Promise<void>;
    getAccountsToPoll(): Promise<LinkedAccount[]>;
    getAccountsByPlatform(platform: PlatformType): Promise<LinkedAccount[]>;
    getRecentMatches(platform: PlatformType, platformAccountId: string, count?: number): Promise<MatchInfo[]>;
}
export declare const accountService: AccountService;
export {};
//# sourceMappingURL=AccountService.d.ts.map