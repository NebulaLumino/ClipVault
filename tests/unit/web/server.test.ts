import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';

// Mock the config before importing the server
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
    warn: vi.fn(), 
    debug: vi.fn() 
  },
}));

vi.mock('../../../src/services/UserService.js', () => ({
  userService: {},
}));

vi.mock('../../../src/services/AccountService.js', () => ({
  accountService: {
    linkAccount: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../jobs/queue.js', () => ({
  clipDeliveryQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));

// Import after mocks are set up
import { fastify } from '../../../src/web/server.js';

describe('Web Server', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
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
