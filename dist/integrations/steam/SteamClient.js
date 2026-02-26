import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
export class SteamError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'SteamError';
    }
}
export class SteamClient {
    baseUrl = 'https://api.steampowered.com';
    apiKey;
    constructor() {
        this.apiKey = config.STEAM_API_KEY || '';
        if (!this.apiKey) {
            logger.warn('Steam API key not configured');
        }
    }
    async getPlayerSummary(steamId) {
        if (!this.apiKey) {
            throw new SteamError('Steam API key not configured', 'NOT_CONFIGURED');
        }
        const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new SteamError('Failed to fetch player', 'REQUEST_FAILED', response.status);
            }
            const data = await response.json();
            return data.response?.players?.[0] || null;
        }
        catch (error) {
            if (error instanceof SteamError)
                throw error;
            logger.error('Steam API error', { error: String(error) });
            throw new SteamError(String(error), 'REQUEST_FAILED');
        }
    }
    async getCS2MatchHistory(steamId, limit = 5) {
        if (!this.apiKey) {
            throw new SteamError('Steam API key not configured', 'NOT_CONFIGURED');
        }
        // Using OpenDota API for CS2 match history as Valve doesn't provide direct API
        const url = `https://api.opendota.com/api/players/${steamId}/matches?limit=${limit}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new SteamError('Failed to fetch match history', 'REQUEST_FAILED', response.status);
            }
            const matches = await response.json();
            return matches.map((m) => ({
                matchid: String(m.match_id),
                matchtime: m.start_time,
                result: m.radiant_win === (m.player_slot < 128) ? 'win' : 'loss',
                score: { team1: m.radiant_score, team2: m.dire_score },
            }));
        }
        catch (error) {
            if (error instanceof SteamError)
                throw error;
            logger.error('Steam API error', { error: String(error) });
            throw new SteamError(String(error), 'REQUEST_FAILED');
        }
    }
    async resolveVanityUrl(vanityUrl) {
        if (!this.apiKey) {
            throw new SteamError('Steam API key not configured', 'NOT_CONFIGURED');
        }
        const url = `${this.baseUrl}/ISteamUser/ResolveVanityURL/v0001/?key=${this.apiKey}&vanityurl=${vanityUrl}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new SteamError('Failed to resolve vanity URL', 'REQUEST_FAILED', response.status);
            }
            const data = await response.json();
            if (data.response?.success === 1) {
                return data.response.steamid || null;
            }
            return null;
        }
        catch (error) {
            if (error instanceof SteamError)
                throw error;
            logger.error('Steam API error', { error: String(error) });
            throw new SteamError(String(error), 'REQUEST_FAILED');
        }
    }
    isValidSteam64Id(steamId) {
        // Steam64 IDs are 17 digits
        return /^\d{17}$/.test(steamId);
    }
}
export const steamClient = new SteamClient();
//# sourceMappingURL=SteamClient.js.map