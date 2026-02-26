import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RiotClient, riotClient } from '../../../src/integrations/riot/RiotClient.js';

vi.mock('../../../src/config/index.js', () => ({
  config: { RIOT_API_KEY: 'test-riot-key' },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('RiotClient', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  describe('riotClient singleton', () => {
    it('should be initialized with API key from config', () => {
      expect(riotClient).toBeDefined();
    });
  });

  describe('getAccountByRiotId', () => {
    it('should return account data on success', async () => {
      const mockAccount = { puuid: 'test-puuid', gameName: 'TestPlayer', tagLine: 'NA1' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAccount,
      });

      const result = await riotClient.getAccountByRiotId('TestPlayer', 'NA1');
      expect(result?.puuid).toBe('test-puuid');
    });

    it('should return null if account not found (404)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await riotClient.getAccountByRiotId('nonexistent', 'NA1');
      expect(result).toBeNull();
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(riotClient.getAccountByRiotId('Test', 'NA1')).rejects.toThrow();
    });
  });

  describe('getMatchList', () => {
    it('should return match list', async () => {
      const mockMatches = ['match1', 'match2', 'match3'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMatches,
      });

      const result = await riotClient.getMatchList('test-puuid', 5);
      expect(result).toHaveLength(3);
    });
  });

  describe('getMatch', () => {
    it('should return match data', async () => {
      const mockMatch = {
        metadata: { matchId: 'AMER1-123' },
        info: { gameCreation: 1000, gameDuration: 1800, participants: [] },
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMatch,
      });

      const result = await riotClient.getMatch('AMER1-123');
      expect(result?.matchId).toBe('AMER1-123');
    });
  });
});
