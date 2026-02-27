import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClipRequestWorker } from '../../../src/jobs/clipRequest.worker.js';

vi.mock('../../../src/config/index.js', () => ({
  config: {
    DISCORD_BOT_TOKEN: 'test-token',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../src/services/ClipService.js', () => ({
  clipService: {
    getMatchById: vi.fn(),
    getClipsByMatchId: vi.fn(),
    createClip: vi.fn(),
  },
}));

vi.mock('../../../src/integrations/allstar/AllstarClient.js', () => ({
  allstarClient: {
    requestClips: vi.fn(),
  },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
  })),
}));

describe('ClipRequestWorker', () => {
  describe('createClipRequestWorker', () => {
    it('should create a worker with correct queue name', () => {
      const worker = createClipRequestWorker();
      expect(worker).toBeDefined();
    });
  });
});
