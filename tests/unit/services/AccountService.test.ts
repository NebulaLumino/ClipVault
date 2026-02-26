import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountService, AccountService } from '../../../src/services/AccountService.js';

vi.mock('../../../src/db/prisma.js', () => ({
  default: {
    linkedAccount: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    pollState: {
      create: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../../../src/integrations/steam/SteamClient.js', () => ({
  steamClient: { getCS2MatchHistory: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../../src/integrations/riot/RiotClient.js', () => ({
  riotClient: { getMatchList: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../../src/integrations/epic/EpicClient.js', () => ({
  epicClient: {},
}));

import prisma from '../../../src/db/prisma.js';

describe('AccountService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('linkAccount', () => {
    it('should create new linked account', async () => {
      const mockAccount = { id: 'account-1', userId: 'user-1', platform: 'steam', platformAccountId: '123456', status: 'linked' };
      prisma.linkedAccount.findUnique.mockResolvedValue(null);
      prisma.linkedAccount.create.mockResolvedValue(mockAccount);
      prisma.pollState.create.mockResolvedValue({});
      const result = await accountService.linkAccount('user-1', 'steam', '123456', 'TestUser');
      expect(result.platform).toBe('steam');
      expect(prisma.linkedAccount.create).toHaveBeenCalled();
    });

    it('should update existing account if found', async () => {
      const existingAccount = { id: 'account-1', userId: 'user-1', platform: 'steam', platformAccountId: 'old-id', status: 'linked' };
      const updatedAccount = { ...existingAccount, platformAccountId: 'new-id' };
      prisma.linkedAccount.findUnique.mockResolvedValue(existingAccount);
      prisma.linkedAccount.update.mockResolvedValue(updatedAccount);
      const result = await accountService.linkAccount('user-1', 'steam', 'new-id', 'UpdatedUser');
      expect(prisma.linkedAccount.update).toHaveBeenCalled();
      expect(result.platformAccountId).toBe('new-id');
    });
  });

  describe('unlinkAccount', () => {
    it('should unlink existing account', async () => {
      const existingAccount = { id: 'account-1', userId: 'user-1', platform: 'steam' };
      prisma.linkedAccount.findUnique.mockResolvedValue(existingAccount);
      prisma.linkedAccount.delete.mockResolvedValue(existingAccount);
      prisma.pollState.delete.mockResolvedValue({});
      const result = await accountService.unlinkAccount('user-1', 'steam');
      expect(result).toBe(true);
    });

    it('should return false if account not found', async () => {
      prisma.linkedAccount.findUnique.mockResolvedValue(null);
      const result = await accountService.unlinkAccount('user-1', 'steam');
      expect(result).toBe(false);
    });
  });

  describe('getLinkedAccounts', () => {
    it('should return all linked accounts for user', async () => {
      const mockAccounts = [{ id: 'account-1', platform: 'steam' }, { id: 'account-2', platform: 'riot' }];
      prisma.linkedAccount.findMany.mockResolvedValue(mockAccounts);
      const result = await accountService.getLinkedAccounts('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('getLinkedAccount', () => {
    it('should return specific linked account', async () => {
      const mockAccount = { id: 'account-1', platform: 'steam' };
      prisma.linkedAccount.findUnique.mockResolvedValue(mockAccount);
      const result = await accountService.getLinkedAccount('user-1', 'steam');
      expect(result).toEqual(mockAccount);
    });

    it('should return null if not found', async () => {
      prisma.linkedAccount.findUnique.mockResolvedValue(null);
      const result = await accountService.getLinkedAccount('user-1', 'steam');
      expect(result).toBeNull();
    });
  });

  describe('getLinkedAccountById', () => {
    it('should return account by ID', async () => {
      const mockAccount = { id: 'account-1' };
      prisma.linkedAccount.findUnique.mockResolvedValue(mockAccount);
      const result = await accountService.getLinkedAccountById('account-1');
      expect(result).toEqual(mockAccount);
    });
  });

  describe('updatePollState', () => {
    it('should upsert poll state', async () => {
      prisma.pollState.upsert.mockResolvedValue({});
      await accountService.updatePollState('account-1', { lastMatchId: 'match-123' });
      expect(prisma.pollState.upsert).toHaveBeenCalled();
    });
  });

  describe('getAccountsToPoll', () => {
    it('should return accounts with polling enabled', async () => {
      const mockAccounts = [{ id: 'account-1', platform: 'steam' }];
      prisma.linkedAccount.findMany.mockResolvedValue(mockAccounts);
      const result = await accountService.getAccountsToPoll();
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('getAccountsByPlatform', () => {
    it('should return accounts filtered by platform', async () => {
      const mockAccounts = [{ id: 'account-1', platform: 'steam' }];
      prisma.linkedAccount.findMany.mockResolvedValue(mockAccounts);
      const result = await accountService.getAccountsByPlatform('steam');
      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('steam');
    });
  });

  describe('getRecentMatches', () => {
    it('should return empty array for unsupported platform', async () => {
      const result = await accountService.getRecentMatches('epic', 'test-id');
      expect(result).toEqual([]);
    });
  });
});
