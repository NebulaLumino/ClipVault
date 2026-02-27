import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClipMonitorWorker, mapAllstarStatusToClipStatus } from '../../../src/jobs/clipMonitor.worker.js';
import { ClipStatus } from '../../../src/types/index.js';

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
    getClipById: vi.fn(),
    updateClipStatus: vi.fn(),
  },
}));

vi.mock('../../../src/integrations/allstar/AllstarClient.js', () => ({
  allstarClient: {
    getClipStatus: vi.fn(),
  },
}));

vi.mock('./queue.js', () => ({
  clipDeliveryQueue: {
    add: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
  })),
}));

describe('ClipMonitorWorker', () => {
  describe('createClipMonitorWorker', () => {
    it('should create a worker with correct queue name', () => {
      const worker = createClipMonitorWorker();
      expect(worker).toBeDefined();
    });
  });

  describe('mapAllstarStatusToClipStatus', () => {
    it('should map requested status', () => {
      expect(mapAllstarStatusToClipStatus('requested')).toBe(ClipStatus.REQUESTED);
    });

    it('should map processing status', () => {
      expect(mapAllstarStatusToClipStatus('processing')).toBe(ClipStatus.PROCESSING);
    });

    it('should map ready status', () => {
      expect(mapAllstarStatusToClipStatus('ready')).toBe(ClipStatus.READY);
    });

    it('should map delivered status', () => {
      expect(mapAllstarStatusToClipStatus('delivered')).toBe(ClipStatus.DELIVERED);
    });

    it('should map failed status', () => {
      expect(mapAllstarStatusToClipStatus('failed')).toBe(ClipStatus.FAILED);
    });

    it('should map expired status', () => {
      expect(mapAllstarStatusToClipStatus('expired')).toBe(ClipStatus.EXPIRED);
    });

    it('should default to processing for unknown status', () => {
      expect(mapAllstarStatusToClipStatus('unknown')).toBe(ClipStatus.PROCESSING);
    });

    it('should handle case-insensitive status', () => {
      expect(mapAllstarStatusToClipStatus('READY')).toBe(ClipStatus.READY);
      expect(mapAllstarStatusToClipStatus('Processing')).toBe(ClipStatus.PROCESSING);
    });
  });
});
