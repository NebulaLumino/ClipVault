import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QUEUES, closeQueues, checkQueueHealth } from '../../../src/jobs/queue.js';

vi.mock('../../../src/db/redis.js', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    close: vi.fn().mockResolvedValue(undefined),
    getJobCounts: vi.fn().mockResolvedValue({ active: 0, waiting: 0, completed: 0, failed: 0 }),
  })),
  Worker: vi.fn(),
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('Job Queue', () => {
  describe('QUEUES constant', () => {
    it('should define all required queue names', () => {
      expect(QUEUES.MATCH_POLL).toBe('match-poll');
      expect(QUEUES.CLIP_REQUEST).toBe('clip-request');
      expect(QUEUES.CLIP_MONITOR).toBe('clip-monitor');
      expect(QUEUES.CLIP_DELIVERY).toBe('clip-delivery');
    });
  });

  describe('closeQueues', () => {
    it('should close all queues without error', async () => {
      await expect(closeQueues()).resolves.not.toThrow();
    });
  });

  describe('checkQueueHealth', () => {
    it('should return health status for all queues', async () => {
      const health = await checkQueueHealth();
      expect(health).toHaveProperty('matchPoll');
      expect(health).toHaveProperty('clipRequest');
      expect(health).toHaveProperty('clipMonitor');
      expect(health).toHaveProperty('clipDelivery');
    });
  });
});
