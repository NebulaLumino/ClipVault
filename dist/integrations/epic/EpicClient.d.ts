export interface FortniteProfile {
    id: string;
    displayName: string;
    externalAuths?: Array<{
        type: string;
        id: string;
    }>;
}
export interface FortniteStats {
    br: {
        wins: number;
        kills: number;
        matchesPlayed: number;
        winRate: number;
        kd: number;
    };
}
export declare class EpicError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined);
}
export declare class EpicClient {
    private readonly clientId;
    private readonly clientSecret;
    constructor();
    getFortniteProfile(epicId: string): Promise<FortniteProfile | null>;
    getFortniteStats(epicId: string): Promise<FortniteStats | null>;
    getPlayerStats(epicId: string): Promise<{
        matchesPlayed: number;
        wins: number;
        kills: number;
    } | null>;
    isValidEpicId(epicId: string): boolean;
}
export declare const epicClient: EpicClient;
//# sourceMappingURL=EpicClient.d.ts.map