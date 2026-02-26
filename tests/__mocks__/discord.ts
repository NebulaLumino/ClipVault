// Mock Discord.js
export const mockClient = {
  user: {
    id: 'bot-user-id',
    username: 'ClipVaultBot',
  },
  guilds: {
    cache: new Map(),
  },
  channels: {
    cache: new Map(),
  },
  once: vi.fn(),
  on: vi.fn(),
  login: vi.fn().mockResolvedValue('mock-token'),
  destroy: vi.fn(),
};

export const mockGuild = {
  id: 'guild-id',
  name: 'Test Guild',
  memberCount: 100,
  channels: {
    cache: new Map(),
  },
};

export const mockChannel = {
  id: 'channel-id',
  send: vi.fn().mockResolvedValue({ id: 'message-id' }),
  sendTyping: vi.fn().mockResolvedValue(undefined),
};

export const mockUser = {
  id: 'user-id',
  username: 'TestUser',
  send: vi.fn().mockResolvedValue({ id: 'dm-message-id' }),
};

export const mockMessage = {
  id: 'message-id',
  content: 'Test message',
  author: mockUser,
  channel: mockChannel,
  reply: vi.fn().mockResolvedValue({ id: 'reply-message-id' }),
};

export const mockInteraction = {
  user: mockUser,
  reply: vi.fn().mockResolvedValue(undefined),
  deferReply: vi.fn().mockResolvedValue(undefined),
  editReply: vi.fn().mockResolvedValue(undefined),
  isRepliable: vi.fn().mockReturnValue(true),
  options: {
    getString: vi.fn(),
    getSubcommand: vi.fn().mockReturnValue('view'),
    getBoolean: vi.fn(),
    getInteger: vi.fn(),
  },
};

// Collection class mock
export class Collection extends Map {
  constructor() {
    super();
  }
  
  get(key: string) {
    return super.get(key);
  }
  
  set(key: string, value: unknown) {
    return super.set(key, value);
  }
}
