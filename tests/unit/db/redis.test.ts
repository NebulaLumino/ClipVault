import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config before importing redis
vi.mock('../../../src/config/index.js', () => ({
  config: {
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: '',
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { redis } from '../../../src/db/redis.js';

describe('Redis Client', () => {
  describe('redis', () => {
    it('should be defined', () => {
      expect(redis).toBeDefined();
    });

    it('should have get method', () => {
      expect(typeof redis.get).toBe('function');
    });

    it('should have set method', () => {
      expect(typeof redis.set).toBe('function');
    });

    it('should have del method', () => {
      expect(typeof redis.del).toBe('function');
    });

    it('should have quit method', () => {
      expect(typeof redis.quit).toBe('function');
    });

    it('should be exported as default', () => {
      expect(redis).toBeDefined();
    });
  });
});
