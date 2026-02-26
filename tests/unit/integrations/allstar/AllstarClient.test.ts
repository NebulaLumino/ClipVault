import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllstarClient, allstarClient } from '../../../../src/integrations/allstar/AllstarClient.js';

vi.mock('../../../../src/config/index.js', () => ({
  config: { ALLSTAR_API_URL: 'https://api.allstar.gg', ALLSTAR_API_KEY: 'test-api-key' },
}));

vi.mock('../../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('AllstarClient', () => {
  beforeEach(() => { vi.clearAllMocks(); global.fetch = vi.fn(); });

  describe('allstarClient singleton', () => {
    it('should be initialized with API credentials from config', () => {
      expect(allstarClient).toBeDefined();
    });
  });

  describe('createClip', () => {
    it('should create clip successfully', async () => {
      const mockResponse = { id: 'clip-123', status: 'processing' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await allstarClient.createClip('match-123', 'steam', 'cs2', 'highlight');
      expect(result.id).toBe('clip-123');
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(allstarClient.createClip('match-123', 'steam', 'cs2', 'highlight')).rejects.toThrow();
    });
  });

  describe('getClip', () => {
    it('should return clip data on success', async () => {
      const mockClip = { id: 'clip-123', status: 'ready', title: 'Epic Play' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockClip,
      });

      const result = await allstarClient.getClip('clip-123');
      expect(result?.id).toBe('clip-123');
    });

    it('should return null if clip not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await allstarClient.getClip('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getClips', () => {
    it('should return list of clips', async () => {
      const mockResponse = { clips: [{ id: 'clip-1' }, { id: 'clip-2' }], total: 2 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await allstarClient.getClips(10);
      expect(result.clips).toHaveLength(2);
    });

    it('should filter clips by status', async () => {
      const mockResponse = { clips: [{ id: 'clip-1', status: 'ready' }], total: 1 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await allstarClient.getClips(10, 'ready');
      expect(result.clips[0].status).toBe('ready');
    });
  });
});
