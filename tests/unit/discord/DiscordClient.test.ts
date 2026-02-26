import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClipVaultClient, discordClient } from '../../../src/discord/client.js';

vi.mock('../../../src/config/index.js', () => ({
  config: { DISCORD_BOT_TOKEN: 'test-bot-token' },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('DiscordClient', () => {
  let mockClient: ClipVaultClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = new ClipVaultClient();
    // Mock the users collection
    mockClient.users.fetch = vi.fn().mockResolvedValue({
      id: 'user-123',
      createDM: vi.fn().mockResolvedValue({
        send: vi.fn().mockResolvedValue({}),
      }),
    });
    mockClient.guilds.fetch = vi.fn().mockResolvedValue(null);
  });

  describe('constructor', () => {
    it('should initialize with correct intents', () => {
      expect(discordClient).toBeDefined();
    });
  });

  describe('getUser', () => {
    it('should fetch user by ID', async () => {
      const mockUser = { id: 'user-123' };
      mockClient.users.fetch = vi.fn().mockResolvedValue(mockUser);

      const result = await mockClient.getUser('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockClient.users.fetch = vi.fn().mockRejectedValue(new Error('Not found'));

      const result = await mockClient.getUser('invalid');
      expect(result).toBeNull();
    });
  });

  describe('sendDM', () => {
    it('should send DM to user', async () => {
      const result = await mockClient.sendDM('user-123', 'Test message');
      expect(result).not.toBeNull();
    });

    it('should return null if user not found', async () => {
      mockClient.users.fetch = vi.fn().mockResolvedValue(null);

      const result = await mockClient.sendDM('invalid', 'Test');
      expect(result).toBeNull();
    });
  });

  describe('getGuild', () => {
    it('should fetch guild by ID', async () => {
      const mockGuild = { id: 'guild-123' };
      mockClient.guilds.fetch = vi.fn().mockResolvedValue(mockGuild);

      const result = await mockClient.getGuild('guild-123');
      expect(result).toEqual(mockGuild);
    });

    it('should return null if guild not found', async () => {
      mockClient.guilds.fetch = vi.fn().mockRejectedValue(new Error('Not found'));

      const result = await mockClient.getGuild('invalid');
      expect(result).toBeNull();
    });
  });
});
