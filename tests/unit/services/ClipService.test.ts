import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clipService, ClipService } from '../../../src/services/ClipService.js';

vi.mock('../../../src/db/prisma.js', () => ({
  default: {
    clipRecord: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import prisma from '../../../src/db/prisma.js';

describe('ClipService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('createClip', () => {
    it('should create a new clip record', async () => {
      const mockClip = { id: 'clip-1', matchId: 'match-1', userId: 'user-1', allstarClipId: 'allstar-1', type: 'highlight', status: 'requested' };
      prisma.clipRecord.create.mockResolvedValue(mockClip);
      const result = await clipService.createClip('match-1', 'user-1', 'allstar-1', 'highlight');
      expect(result.matchId).toBe('match-1');
      expect(prisma.clipRecord.create).toHaveBeenCalled();
    });
  });

  describe('getClipByAllstarId', () => {
    it('should return clip by allstar ID', async () => {
      const mockClip = { id: 'clip-1', allstarClipId: 'allstar-1' };
      prisma.clipRecord.findUnique.mockResolvedValue(mockClip);
      const result = await clipService.getClipByAllstarId('allstar-1');
      expect(result?.allstarClipId).toBe('allstar-1');
    });

    it('should return null if not found', async () => {
      prisma.clipRecord.findUnique.mockResolvedValue(null);
      const result = await clipService.getClipByAllstarId('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getClipById', () => {
    it('should return clip by ID', async () => {
      const mockClip = { id: 'clip-1' };
      prisma.clipRecord.findUnique.mockResolvedValue(mockClip);
      const result = await clipService.getClipById('clip-1');
      expect(result?.id).toBe('clip-1');
    });
  });

  describe('getClipsByMatch', () => {
    it('should return clips for a match', async () => {
      const mockClips = [{ id: 'clip-1', matchId: 'match-1' }, { id: 'clip-2', matchId: 'match-1' }];
      prisma.clipRecord.findMany.mockResolvedValue(mockClips);
      const result = await clipService.getClipsByMatch('match-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('getUserClips', () => {
    it('should return user clips with limit', async () => {
      const mockClips = [{ id: 'clip-1', userId: 'user-1' }];
      prisma.clipRecord.findMany.mockResolvedValue(mockClips);
      const result = await clipService.getUserClips('user-1', 10);
      expect(result).toHaveLength(1);
    });
  });

  describe('getReadyClips', () => {
    it('should return ready clips', async () => {
      const mockClips = [{ id: 'clip-1', status: 'ready' }];
      prisma.clipRecord.findMany.mockResolvedValue(mockClips);
      const result = await clipService.getReadyClips();
      expect(result).toHaveLength(1);
    });
  });

  describe('updateClipStatus', () => {
    it('should update clip status', async () => {
      const mockClip = { id: 'clip-1', status: 'ready' };
      prisma.clipRecord.update.mockResolvedValue(mockClip);
      const result = await clipService.updateClipStatus('clip-1', 'ready');
      expect(result.status).toBe('ready');
    });
  });

  describe('markClipReady', () => {
    it('should mark clip as ready with data', async () => {
      const mockClip = { id: 'clip-1', status: 'ready', thumbnailUrl: 'thumb.jpg', videoUrl: 'video.mp4' };
      prisma.clipRecord.update.mockResolvedValue(mockClip);
      const result = await clipService.markClipReady('clip-1', { thumbnailUrl: 'thumb.jpg', videoUrl: 'video.mp4' });
      expect(result.status).toBe('ready');
    });
  });

  describe('markClipDelivered', () => {
    it('should mark clip as delivered', async () => {
      const mockClip = { id: 'clip-1', status: 'delivered' };
      prisma.clipRecord.update.mockResolvedValue(mockClip);
      const result = await clipService.markClipDelivered('clip-1');
      expect(result.status).toBe('delivered');
    });
  });

  describe('markClipFailed', () => {
    it('should mark clip as failed', async () => {
      const mockClip = { id: 'clip-1', status: 'failed' };
      prisma.clipRecord.update.mockResolvedValue(mockClip);
      const result = await clipService.markClipFailed('clip-1');
      expect(result.status).toBe('failed');
    });
  });
});
