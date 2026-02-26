import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EpicClient, epicClient, EpicError } from '../../../src/integrations/epic/EpicClient.js';

vi.mock('../../../src/config/index.js', () => ({
  config: { EPIC_CLIENT_ID: 'test-client-id', EPIC_CLIENT_SECRET: 'test-client-secret' },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('EpicClient', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  describe('constructor', () => {
    it('should initialize with credentials from config', () => {
      expect(epicClient).toBeDefined();
    });
  });

  describe('getFortniteProfile', () => {
    it('should return profile data on success', async () => {
      const mockProfile = { id: 'epic-123', displayName: 'TestPlayer' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProfile }),
      });

      const result = await epicClient.getFortniteProfile('epic-123');
      expect(result?.displayName).toBe('TestPlayer');
    });

    it('should return null if profile not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await epicClient.getFortniteProfile('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getFortniteStats', () => {
    it('should return stats data on success', async () => {
      const mockStats = { br: { wins: 100, kills: 500, matchesPlayed: 1000, winRate: 10, kd: 0.5 } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { stats: mockStats } }),
      });

      const result = await epicClient.getFortniteStats('epic-123');
      expect(result?.br.wins).toBe(100);
    });

    it('should return null if stats not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await epicClient.getFortniteStats('nonexistent');
      expect(result).toBeNull();
    });
  });
});
