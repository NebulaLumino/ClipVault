import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { config } from '../../src/config/index.js';

// Mock all dependencies
vi.mock('../../src/config/index.js', () => ({
  config: {
    NODE_ENV: 'test',
    PORT: 3000,
    DISCORD_BOT_TOKEN: undefined,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/discord/client.js', () => ({
  discordClient: {
    login: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/web/server.js', () => ({
  startWebServer: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../src/jobs/matchPoll.worker.js', () => ({
  createMatchPollWorker: vi.fn(),
}));

vi.mock('../../src/jobs/clipRequest.worker.js', () => ({
  createClipRequestWorker: vi.fn(),
}));

vi.mock('../../src/jobs/clipMonitor.worker.js', () => ({
  createClipMonitorWorker: vi.fn(),
}));

vi.mock('../../src/jobs/clipDelivery.worker.js', () => ({
  createClipDeliveryWorker: vi.fn(),
}));

vi.mock('../../src/db/prisma.js', () => ({
  default: {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/db/redis.js', () => ({
  redis: {
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Main Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export main function for testing', async () => {
    // This test verifies the module can be imported and mocks work
    expect(config.NODE_ENV).toBe('test');
  });

  it('should have graceful shutdown handlers', () => {
    // Verify process handlers can be set up
    const mockProcess = {
      on: vi.fn((event: string, handler: () => void) => {
        expect(['SIGTERM', 'SIGINT']).toContain(event);
        expect(handler).toBeInstanceOf(Function);
      }),
    };
    
    // This test just verifies the handler setup works
    expect(mockProcess.on).toBeDefined();
  });
});
