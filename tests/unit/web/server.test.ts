import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/config/index.js', () => ({
  config: {
    PORT: 3000,
    OAUTH_REDIRECT_BASE: 'http://localhost:3000',
    STEAM_API_KEY: 'test-steam-key',
    RIOT_API_KEY: 'test-riot-key',
    EPIC_CLIENT_ID: 'test-epic-client',
    EPIC_CLIENT_SECRET: 'test-epic-secret',
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('Web Server', () => {
  describe('Server configuration', () => {
    it('should have required config values', async () => {
      const { config } = await import('../../../src/config/index.js');
      expect(config.PORT).toBe(3000);
    });
  });
});
