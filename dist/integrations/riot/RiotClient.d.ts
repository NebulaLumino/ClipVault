export interface RiotAccount {
    puuid: string;
    gameName?: string;
    tagLine?: string;
}
export interface LoLMatch {
    matchId: string;
    gameCreation: number;
    gameDuration: number;
    participants: LoLParticipant[];
}
export interface LoLParticipant {
    puuid: string;
    summonerName: string;
    championName: string;
    win: boolean;
    kills: number;
    deaths: number;
    assists: number;
}
export declare class RiotError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined);
}
export declare class RiotClient {
    private readonly apiKey;
    private tokenExpiry;
    constructor();
    private getHeaders;
    private getRegionalRoute;
    getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount | null>;
    getMatchList(puuid: string, count?: number): Promise<string[]>;
    getMatch(matchId: string): Promise<LoLMatch | null>;
}
export declare const riotClient: RiotClient;
//# sourceMappingURL=RiotClient.d.ts.map