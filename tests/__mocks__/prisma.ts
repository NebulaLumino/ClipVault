// Mock Prisma client
const mockLinkedAccount = {
  id: 'test-account-id',
  userId: 'test-user-id',
  platform: 'steam',
  platformAccountId: '123456789',
  platformUsername: 'TestUser',
  status: 'linked',
  accessToken: 'test-token',
  refreshToken: 'refresh-token',
  tokenExpiry: new Date(Date.now() + 3600000),
  createdAt: new Date(),
  updatedAt: new Date(),
  pollState: {
    id: 'poll-state-id',
    linkedAccountId: 'test-account-id',
    lastMatchId: 'match-123',
    lastCheckedAt: new Date(),
    pollingEnabled: true,
  },
};

const mockUser = {
  id: 'test-user-id',
  discordId: 'discord-123',
  username: 'TestUser',
  globalName: 'Test User',
  avatarUrl: null,
  preferences: {
    deliveryMethod: 'dm',
    notificationsEnabled: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  linkedAccounts: [mockLinkedAccount],
};

const mockMatchRecord = {
  id: 'match-id',
  userId: 'test-user-id',
  platform: 'steam',
  gameTitle: 'cs2',
  matchId: 'match-123',
  platformMatchId: 'platform-match-123',
  status: 'detected',
  startedAt: new Date(),
  endedAt: new Date(),
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockClipRecord = {
  id: 'clip-id',
  matchId: 'match-id',
  userId: 'test-user-id',
  allstarClipId: 'allstar-123',
  type: 'highlight',
  title: 'Test Clip',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  videoUrl: 'https://example.com/clip.mp4',
  duration: 30,
  status: 'ready',
  requestedAt: new Date(),
  readyAt: new Date(),
  deliveredAt: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const prisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue(mockUser),
    findFirst: vi.fn().mockResolvedValue(mockUser),
    create: vi.fn().mockResolvedValue(mockUser),
    update: vi.fn().mockResolvedValue(mockUser),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  linkedAccount: {
    findUnique: vi.fn().mockResolvedValue(mockLinkedAccount),
    findMany: vi.fn().mockResolvedValue([mockLinkedAccount]),
    create: vi.fn().mockResolvedValue(mockLinkedAccount),
    update: vi.fn().mockResolvedValue(mockLinkedAccount),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  pollState: {
    findUnique: vi.fn().mockResolvedValue(mockLinkedAccount.pollState),
    upsert: vi.fn().mockResolvedValue(mockLinkedAccount.pollState),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  matchRecord: {
    findUnique: vi.fn().mockResolvedValue(mockMatchRecord),
    findMany: vi.fn().mockResolvedValue([mockMatchRecord]),
    create: vi.fn().mockResolvedValue(mockMatchRecord),
    update: vi.fn().mockResolvedValue(mockMatchRecord),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  clipRecord: {
    findUnique: vi.fn().mockResolvedValue(mockClipRecord),
    findMany: vi.fn().mockResolvedValue([mockClipRecord]),
    create: vi.fn().mockResolvedValue(mockClipRecord),
    update: vi.fn().mockResolvedValue(mockClipRecord),
    delete: vi.fn().mockResolvedValue(undefined),
  },
  deliveryRecord: {
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'delivery-id' }),
    update: vi.fn().mockResolvedValue({ id: 'delivery-id' }),
  },
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
};

export default prisma;
