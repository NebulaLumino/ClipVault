import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SteamClient, steamClient } from '../../../src/integrations/steam/SteamClient.js';

// Mock config before importing
vi.mock('../../../src/config/index.js', () => ({
  config: { STEAM_API_KEY: 'test-api-key' },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('SteamClient', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  describe('steamClient singleton', () => {
    it('should be initialized with API key from config', () => {
      expect(steamClient).toBeDefined();
    });
  });

  describe('getPlayerSummary', () => {
    it('should return player data on success', async () => {
      const mockPlayer = { steamid: '123456', personaname: 'TestPlayer' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { players: [mockPlayer] } }),
      });

      const result = await steamClient.getPlayerSummary('123456');
      expect(result?.personaname).toBe('TestPlayer');
    });

    it('should return null if player not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { players: [] } }),
      });

      const result = await steamClient.getPlayerSummary('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(steamClient.getPlayerSummary('123')).rejects.toThrow();
    });
  });

  describe('getCS2MatchHistory', () => {
    it('should return match history', async () => {
      const mockMatches = [
        { match_id: 123, start_time: 1000, radiant_win: true, player_slot: 0, radiant_score: 16, dire_score: 12 },
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMatches,
      });

      const result = await steamClient.getCS2MatchHistory('123456', 5);
      expect(result).toHaveLength(1);
      expect(result[0].matchid).toBe('123');
    });
  });

  describe('resolveVanityUrl', () => {
    it('should resolve vanity URL to Steam ID', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { success: 1, steamid: '12345678901234567' } }),
      });

      const result = await steamClient.resolveVanityUrl('testuser');
      expect(result).toBe('12345678901234567');
    });

    it('should return null if vanity URL not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ response: { success: 42 } }),
      });

      const result = await steamClient.resolveVanityUrl('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('isValidSteam64Id', () => {
    it('should validate correct Steam64 ID', () => {
      expect(steamClient.isValidSteam64Id('12345678901234567')).toBe(true);
    });

    it('should reject invalid Steam64 ID', () => {
      expect(steamClient.isValidSteam64Id('invalid')).toBe(false);
      expect(steamClient.isValidSteam64Id('123')).toBe(false);
    });
  });
});
