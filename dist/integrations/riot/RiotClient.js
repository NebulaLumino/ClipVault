import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
export class RiotError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'RiotError';
    }
}
export class RiotClient {
    apiKey;
    tokenExpiry = null;
    constructor() {
        this.apiKey = config.RIOT_API_KEY || '';
        if (!this.apiKey) {
            logger.warn('Riot API key not configured');
        }
    }
    getHeaders() {
        return {
            'X-Riot-Token': this.apiKey,
        };
    }
    // Routing based on region
    getRegionalRoute(puuid) {
        return 'americas';
    }
    async getAccountByRiotId(gameName, tagLine) {
        if (!this.apiKey) {
            throw new RiotError('Riot API key not configured', 'NOT_CONFIGURED');
        }
        const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
        try {
            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) {
                if (response.status === 404)
                    return null;
                throw new RiotError('Failed to fetch account', 'REQUEST_FAILED', response.status);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof RiotError)
                throw error;
            logger.error('Riot API error', { error: String(error) });
            throw new RiotError(String(error), 'REQUEST_FAILED');
        }
    }
    async getMatchList(puuid, count = 5) {
        if (!this.apiKey) {
            throw new RiotError('Riot API key not configured', 'NOT_CONFIGURED');
        }
        const route = this.getRegionalRoute(puuid);
        const url = `https://${route}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
        try {
            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) {
                throw new RiotError('Failed to fetch match list', 'REQUEST_FAILED', response.status);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof RiotError)
                throw error;
            logger.error('Riot API error', { error: String(error) });
            throw new RiotError(String(error), 'REQUEST_FAILED');
        }
    }
    async getMatch(matchId) {
        if (!this.apiKey) {
            throw new RiotError('Riot API key not configured', 'NOT_CONFIGURED');
        }
        // Extract region from match ID
        const region = matchId.startsWith('AMER') ? 'americas'
            : matchId.startsWith('EURO') ? 'europe'
                : matchId.startsWith('ASIA') ? 'asia'
                    : 'americas';
        const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        try {
            const response = await fetch(url, { headers: this.getHeaders() });
            if (!response.ok) {
                if (response.status === 404)
                    return null;
                throw new RiotError('Failed to fetch match', 'REQUEST_FAILED', response.status);
            }
            const data = await response.json();
            return {
                matchId: data.metadata?.matchId || matchId,
                gameCreation: data.info?.gameCreation || 0,
                gameDuration: data.info?.gameDuration || 0,
                participants: data.info?.participants || [],
            };
        }
        catch (error) {
            if (error instanceof RiotError)
                throw error;
            logger.error('Riot API error', { error: String(error) });
            throw new RiotError(String(error), 'REQUEST_FAILED');
        }
    }
}
export const riotClient = new RiotClient();
//# sourceMappingURL=RiotClient.js.map