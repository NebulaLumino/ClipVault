import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  linkAccountMock: vi.fn().mockResolvedValue({}),
  loggerWarnMock: vi.fn(),
}));

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
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: mocks.loggerWarnMock,
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/services/UserService.js', () => ({
  userService: {},
}));

vi.mock('../../../src/services/AccountService.js', () => ({
  accountService: {
    linkAccount: mocks.linkAccountMock,
  },
}));

vi.mock('../../../src/jobs/queue.js', () => ({
  clipDeliveryQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../src/db/prisma.js', () => ({
  default: {
    clipRecord: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    linkedAccount: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

import { fastify } from '../../../src/web/server.js';

describe('Web Server', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('OAUTH_STATE_SECRET', 'test-oauth-state-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Server configuration', () => {
    it('should have required config values', async () => {
      const { config } = await import('../../../src/config/index.js');
      expect(config.PORT).toBe(3000);
    });
  });

  describe('Health check', () => {
    it('should return ok status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/health',
      });
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('OAuth callbacks', () => {
    it('should reject Steam OAuth without code', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/oauth/steam/callback?state=user123',
      });
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject Riot OAuth without code', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/oauth/riot/callback?state=user123',
      });
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject Epic OAuth without code', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/oauth/epic/callback?state=user123',
      });
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject Steam OAuth with tampered state before linking', async () => {
      const { createOAuthState } = await import('../../../src/utils/oauthState.js');
      const validState = createOAuthState({
        userId: 'user-123',
        platform: 'steam',
        nowMs: Date.now(),
      });
      const tamperedState = `${validState.slice(0, -1)}x`;

      const response = await fastify.inject({
        method: 'GET',
        url: `/oauth/steam/callback?code=test-code&steamId=steam-123&state=${encodeURIComponent(tamperedState)}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ error: 'Invalid or expired Steam link session' });
      expect(mocks.linkAccountMock).not.toHaveBeenCalled();
      expect(mocks.loggerWarnMock).toHaveBeenCalled();
    });

    it('should reject Riot OAuth with platform-mismatched state before linking', async () => {
      const { createOAuthState } = await import('../../../src/utils/oauthState.js');
      const mismatchedState = createOAuthState({
        userId: 'user-123',
        platform: 'steam',
        nowMs: Date.now(),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: `/oauth/riot/callback?code=test-code&state=${encodeURIComponent(mismatchedState)}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ error: 'Invalid or expired Riot link session' });
      expect(mocks.linkAccountMock).not.toHaveBeenCalled();
    });

    it('should accept Epic OAuth with a valid signed state', async () => {
      const { createOAuthState } = await import('../../../src/utils/oauthState.js');
      const validState = createOAuthState({
        userId: 'user-123',
        platform: 'epic',
        nowMs: Date.now(),
      });

      const response = await fastify.inject({
        method: 'GET',
        url: `/oauth/epic/callback?code=test-code&epicId=epic-123&state=${encodeURIComponent(validState)}`,
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe('http://localhost:3000/linked?platform=epic');
      expect(mocks.linkAccountMock).toHaveBeenCalledWith(
        'user-123',
        expect.anything(),
        'epic-123',
        undefined,
        'test-code',
      );
    });
  });

  describe('Webhooks', () => {
    it('should handle Allstar webhook', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/allstar',
        payload: {
          event: 'clip.ready',
          clipId: 'clip123',
          status: 'ready',
        },
      });
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.received).toBe(true);
    });

    it('should ignore non-clip.ready events', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/allstar',
        payload: {
          event: 'other.event',
          clipId: 'clip123',
        },
      });
      
      expect(response.statusCode).toBe(200);
    });
  });
});
