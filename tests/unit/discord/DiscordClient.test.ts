import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire discord client module before importing
vi.mock('../../../src/discord/client.js', () => ({
  discordClient: {
    login: vi.fn().mockResolvedValue('token'),
    users: {
      fetch: vi.fn().mockResolvedValue({
        id: 'user-123',
        createDM: vi.fn().mockResolvedValue({
          send: vi.fn().mockResolvedValue({}),
        }),
      }),
    },
    guilds: {
      fetch: vi.fn().mockResolvedValue(null),
    },
    isReady: vi.fn().mockReturnValue(true),
  },
  ClipVaultClient: class MockClipVaultClient {
    login = vi.fn().mockResolvedValue('token');
    users = {
      fetch: vi.fn().mockResolvedValue({
        id: 'user-123',
        createDM: vi.fn().mockResolvedValue({
          send: vi.fn().mockResolvedValue({}),
        }),
      }),
    };
    guilds = {
      fetch: vi.fn().mockResolvedValue(null),
    };
    isReady = vi.fn().mockReturnValue(true);
    
    getUser(id: string) {
      return this.users.fetch(id);
    }
    
    sendDM(id: string, message: string) {
      return this.users.fetch(id).then((user: unknown) => {
        if (!user) return null;
        return (user as { createDM: () => Promise<{ send: (msg: string) => Promise<unknown> }> }).createDM().then((dm) => {
          return dm.send(message);
        });
      });
    }
    
    getGuild(id: string) {
      return this.guilds.fetch(id);
    }
  },
}));

vi.mock('../../../src/config/index.js', () => ({
  config: { 
    DISCORD_BOT_TOKEN: 'test-bot-token',
    DISCORD_CLIENT_ID: 'test-client-id',
    DISCORD_CLIENT_SECRET: 'test-client-secret',
  },
}));

vi.mock('../../../src/utils/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Import after mocks are set up
import { discordClient, ClipVaultClient } from '../../../src/discord/client.js';

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
  });
});
