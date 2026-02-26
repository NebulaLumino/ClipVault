import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchService, MatchService } from '../../../src/services/MatchService.js';

vi.mock('../../../src/db/prisma.js', () => ({
  default: {
    matchRecord: {
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

describe('MatchService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('createMatch', () => {
    it('should create a new match record', async () => {
      const mockMatch = { id: 'match-1', userId: 'user-1', platform: 'steam', gameTitle: 'cs2', matchId: 'platform-match-1', status: 'detected' };
      prisma.matchRecord.create.mockResolvedValue(mockMatch);
      const result = await matchService.createMatch('user-1', 'steam', 'cs2', 'match-1', 'platform-match-1');
      expect(result.platform).toBe('steam');
      expect(prisma.matchRecord.create).toHaveBeenCalled();
    });
  });

  describe('getMatchByPlatformMatchId', () => {
    it('should return match by platform match ID', async () => {
      const mockMatch = { id: 'match-1', platform: 'steam', platformMatchId: 'platform-match-1' };
      prisma.matchRecord.findUnique.mockResolvedValue(mockMatch);
      const result = await matchService.getMatchByPlatformMatchId('steam', 'platform-match-1');
      expect(result?.platformMatchId).toBe('platform-match-1');
    });

    it('should return null if not found', async () => {
      prisma.matchRecord.findUnique.mockResolvedValue(null);
      const result = await matchService.getMatchByPlatformMatchId('steam', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getMatchById', () => {
    it('should return match by ID', async () => {
      const mockMatch = { id: 'match-1' };
      prisma.matchRecord.findUnique.mockResolvedValue(mockMatch);
      const result = await matchService.getMatchById('match-1');
      expect(result?.id).toBe('match-1');
    });
  });

  describe('updateMatchStatus', () => {
    it('should update match status', async () => {
      const mockMatch = { id: 'match-1', status: 'completed' };
      prisma.matchRecord.update.mockResolvedValue(mockMatch);
      const result = await matchService.updateMatchStatus('match-1', 'completed');
      expect(result.status).toBe('completed');
    });
  });

  describe('getUserMatches', () => {
    it('should return user matches with limit', async () => {
      const mockMatches = [{ id: 'match-1', userId: 'user-1' }];
      prisma.matchRecord.findMany.mockResolvedValue(mockMatches);
      const result = await matchService.getUserMatches('user-1', 10);
      expect(result).toHaveLength(1);
    });
  });

  describe('getPendingMatches', () => {
    it('should return pending matches', async () => {
      const mockMatches = [{ id: 'match-1', status: 'detected' }];
      prisma.matchRecord.findMany.mockResolvedValue(mockMatches);
      const result = await matchService.getPendingMatches();
      expect(result).toHaveLength(1);
    });
  });

  describe('markMatchProcessing', () => {
    it('should mark match as processing', async () => {
      const mockMatch = { id: 'match-1', status: 'processing' };
      prisma.matchRecord.update.mockResolvedValue(mockMatch);
      const result = await matchService.markMatchProcessing('match-1');
      expect(result.status).toBe('processing');
    });
  });

  describe('markMatchCompleted', () => {
    it('should mark match as completed', async () => {
      const mockMatch = { id: 'match-1', status: 'completed' };
      prisma.matchRecord.update.mockResolvedValue(mockMatch);
      const result = await matchService.markMatchCompleted('match-1');
      expect(result.status).toBe('completed');
    });
  });

  describe('markMatchFailed', () => {
    it('should mark match as failed', async () => {
      const mockMatch = { id: 'match-1', status: 'failed' };
      prisma.matchRecord.update.mockResolvedValue(mockMatch);
      const result = await matchService.markMatchFailed('match-1');
      expect(result.status).toBe('failed');
    });
  });
});
