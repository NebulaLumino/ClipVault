import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
export class EpicError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "EpicError";
    }
}
export class EpicClient {
    clientId;
    clientSecret;
    constructor() {
        this.clientId = config.EPIC_CLIENT_ID || "";
        this.clientSecret = config.EPIC_CLIENT_SECRET || "";
        if (!this.clientId) {
            logger.warn("Epic Games client credentials not configured");
        }
    }
    async getFortniteProfile(epicId) {
        const url = `https://fortnite-api.com/v1/players/epic/${epicId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404)
                    return null;
                throw new EpicError("Failed to fetch profile", "REQUEST_FAILED", response.status);
            }
            const data = (await response.json());
            return data.data || null;
        }
        catch (error) {
            if (error instanceof EpicError)
                throw error;
            logger.error("Epic Games API error", { error: String(error) });
            throw new EpicError(String(error), "REQUEST_FAILED");
        }
    }
    async getFortniteStats(epicId) {
        const url = `https://fortnite-api.com/v1/stats/br/v2?EpicId=${epicId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404)
                    return null;
                throw new EpicError("Failed to fetch stats", "REQUEST_FAILED", response.status);
            }
            const data = (await response.json());
            return data.data?.stats || null;
        }
        catch (error) {
            if (error instanceof EpicError)
                throw error;
            logger.error("Epic Games API error", { error: String(error) });
            throw new EpicError(String(error), "REQUEST_FAILED");
        }
    }
    async getPlayerStats(epicId) {
        const stats = await this.getFortniteStats(epicId);
        if (!stats)
            return null;
        return {
            matchesPlayed: stats.br.matchesPlayed,
            wins: stats.br.wins,
            kills: stats.br.kills,
        };
    }
    isValidEpicId(epicId) {
        return /^[0-9a-f]{32}$/i.test(epicId);
    }
}
export const epicClient = new EpicClient();
//# sourceMappingURL=EpicClient.js.map