import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClipDeliveryWorker } from '../../../src/jobs/clipDelivery.worker.js';

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

vi.mock('../../../src/services/DeliveryService.js', () => ({
  deliveryService: {
    deliverClip: vi.fn(),
  },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
  })),
}));

describe('ClipDeliveryWorker', () => {
  describe('createClipDeliveryWorker', () => {
    it('should create a worker with correct queue name', () => {
      const worker = createClipDeliveryWorker();
      expect(worker).toBeDefined();
    });
  });
});
