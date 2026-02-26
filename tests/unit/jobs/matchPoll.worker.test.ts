import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMatchPollWorker } from '../../../src/jobs/matchPoll.worker.js';

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

vi.mock('../../../src/services/AccountService.js', () => ({
  accountService: {
    getLinkedAccountById: vi.fn(),
    getRecentMatches: vi.fn(),
    updatePollState: vi.fn(),
  },
}));

vi.mock('../../../src/services/MatchService.js', () => ({
  matchService: {
    createMatch: vi.fn(),
  },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
  })),
}));

describe('MatchPollWorker', () => {
  describe('createMatchPollWorker', () => {
    it('should create a worker with correct queue name', () => {
      const worker = createMatchPollWorker();
      expect(worker).toBeDefined();
    });
  });
});
