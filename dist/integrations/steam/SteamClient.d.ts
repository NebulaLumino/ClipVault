export interface SteamPlayer {
    steamid: string;
    personaname: string;
    avatarfull?: string;
    loccountrycode?: string;
    profilestate?: number;
}
export interface CS2Match {
    matchid: string;
    matchtime: number;
    result: "win" | "loss" | "draw";
    score?: {
        team1: number;
        team2: number;
    };
}
export interface Dota2Match {
    matchid: string;
    matchtime: number;
    result: "win" | "loss" | "draw";
    hero?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
    duration?: number;
}
export declare class SteamError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined);
}
export declare class SteamClient {
    private readonly baseUrl;
    private readonly apiKey;
    constructor();
    getPlayerSummary(steamId: string): Promise<SteamPlayer | null>;
    getCS2MatchHistory(steamId: string, limit?: number): Promise<CS2Match[]>;
    resolveVanityUrl(vanityUrl: string): Promise<string | null>;
    isValidSteam64Id(steamId: string): boolean;
    getDota2MatchHistory(steamId: string, limit?: number): Promise<Dota2Match[]>;
    convertSteam64ToSteam32(steam64: string): string;
}
export declare const steamClient: SteamClient;
//# sourceMappingURL=SteamClient.d.ts.map