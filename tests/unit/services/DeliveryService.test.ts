import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deliveryService, DeliveryService } from '../../../src/services/DeliveryService.js';

vi.mock('../../../src/db/prisma.js', () => ({
  default: {
    deliveryRecord: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    clipRecord: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../../src/discord/client.js', () => ({
  discordClient: {
    sendDM: vi.fn().mockResolvedValue(true),
    channels: {
      fetch: vi.fn().mockResolvedValue({ send: vi.fn().mockResolvedValue({}) }),
    },
  },
}));

import prisma from '../../../src/db/prisma.js';

describe('DeliveryService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('createDelivery', () => {
    it('should create a new delivery record', async () => {
      const mockDelivery = { id: 'delivery-1', clipId: 'clip-1', userId: 'user-1', recipientId: 'user-1', method: 'dm', status: 'pending' };
      prisma.deliveryRecord.create.mockResolvedValue(mockDelivery);
      const result = await deliveryService.createDelivery('clip-1', 'user-1', 'user-1', 'dm');
      expect(result.clipId).toBe('clip-1');
    });
  });

  describe('deliverClip', () => {
    it('should deliver clip via DM', async () => {
      const mockClip = { id: 'clip-1', status: 'ready', title: 'Test Clip', type: 'highlight', videoUrl: 'https://example.com/clip.mp4', duration: 30, thumbnailUrl: 'https://example.com/thumb.jpg' };
      const mockUser = { id: 'user-1', preferences: { deliveryMethod: 'dm' } };
      const mockDelivery = { id: 'delivery-1', status: 'pending' };

      prisma.clipRecord.findUnique.mockResolvedValue(mockClip as any);
      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.deliveryRecord.create.mockResolvedValue(mockDelivery as any);
      prisma.deliveryRecord.update.mockResolvedValue({ ...mockDelivery, status: 'sent' });
      prisma.clipRecord.update.mockResolvedValue({ ...mockClip, status: 'delivered' });

      const result = await deliveryService.deliverClip('clip-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false if clip not ready', async () => {
      const mockClip = { id: 'clip-1', status: 'requested' };
      prisma.clipRecord.findUnique.mockResolvedValue(mockClip as any);

      const result = await deliveryService.deliverClip('clip-1', 'user-1');
      expect(result).toBe(false);
    });
  });

  describe('getDeliveryHistory', () => {
    it('should return delivery history for user', async () => {
      const mockDeliveries = [{ id: 'delivery-1', userId: 'user-1' }];
      prisma.deliveryRecord.findMany.mockResolvedValue(mockDeliveries as any);
      const result = await deliveryService.getDeliveryHistory('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getDeliveryById', () => {
    it('should return delivery by ID', async () => {
      const mockDelivery = { id: 'delivery-1' };
      prisma.deliveryRecord.findUnique.mockResolvedValue(mockDelivery as any);
      const result = await deliveryService.getDeliveryById('delivery-1');
      expect(result?.id).toBe('delivery-1');
    });
  });
});
