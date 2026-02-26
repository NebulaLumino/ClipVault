import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService, UserService } from '../../../src/services/UserService.js';

// Mock prisma
vi.mock('../../../src/db/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import prisma from '../../../src/db/prisma.js';

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateUser', () => {
    it('should return existing user if found', async () => {
      const mockUser = {
        id: 'user-1',
        discordId: 'discord-123',
        username: 'TestUser',
        preferences: null,
      };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const result = await userService.getOrCreateUser('discord-123', 'TestUser');
      
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { discordId: 'discord-123' },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create new user if not found', async () => {
      const mockUser = {
        id: 'user-1',
        discordId: 'discord-123',
        username: 'TestUser',
        preferences: null,
      };
      
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      
      const result = await userService.getOrCreateUser('discord-123', 'TestUser');
      
      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          discordId: 'discord-123',
          username: 'TestUser',
          globalName: undefined,
          avatarUrl: undefined,
        },
      });
    });
  });

  describe('getUserByDiscordId', () => {
    it('should return user by discord ID', async () => {
      const mockUser = { id: 'user-1', discordId: 'discord-123' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const result = await userService.getUserByDiscordId('discord-123');
      
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { discordId: 'discord-123' },
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = { id: 'user-1', discordId: 'discord-123' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const result = await userService.getUserById('user-1');
      
      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });
  });

  describe('updateUser', () => {
    it('should update user with provided data', async () => {
      const mockUser = {
        id: 'user-1',
        discordId: 'discord-123',
        username: 'UpdatedUser',
      };
      prisma.user.update.mockResolvedValue(mockUser);
      
      const result = await userService.updateUser('user-1', { username: 'UpdatedUser' });
      
      expect(result).toEqual(mockUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { username: 'UpdatedUser' },
      });
    });
  });

  describe('getPreferences', () => {
    it('should return default preferences if user has none', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      
      const result = await userService.getPreferences('user-1');
      
      expect(result.deliveryMethod).toBe('dm');
      expect(result.quietHoursEnabled).toBe(false);
      expect(result.notificationsEnabled).toBe(true);
    });

    it('should merge user preferences with defaults', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        preferences: { deliveryMethod: 'channel' },
      });
      
      const result = await userService.getPreferences('user-1');
      
      expect(result.deliveryMethod).toBe('channel');
      expect(result.quietHoursEnabled).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('should update and return merged preferences', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        preferences: { deliveryMethod: 'dm', quietHoursEnabled: false },
      });
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        preferences: { deliveryMethod: 'channel', quietHoursEnabled: false },
      });
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        preferences: { deliveryMethod: 'channel', quietHoursEnabled: false },
      });
      
      const result = await userService.updatePreferences('user-1', { deliveryMethod: 'channel' });
      
      expect(result.deliveryMethod).toBe('channel');
    });
  });
});
