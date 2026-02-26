// Supported game platforms
export const enum GamePlatform {
  CS2 = 'cs2',
  LEAGUE_OF_LEGENDS = 'lol',
  DOTA2 = 'dota2',
  FORTNITE = 'fortnite',
}

// Supported game titles
export const enum GameTitle {
  CS2 = 'Counter-Strike 2',
  LOL = 'League of Legends',
  DOTA2 = 'Dota 2',
  FORTNITE = 'Fortnite',
}

// Platform account types - as enum for runtime use
export enum PlatformType {
  STEAM = 'steam',
  RIOT = 'riot',
  EPIC = 'epic',
  DISCORD = 'discord',
}

// Account linking status
export const enum AccountLinkStatus {
  PENDING = 'pending',
  LINKED = 'linked',
  EXPIRED = 'expired',
  ERROR = 'error',
}

// Match status
export const enum MatchStatus {
  DETECTED = 'detected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

// Clip status
export const enum ClipStatus {
  REQUESTED = 'requested',
  PROCESSING = 'processing',
  READY = 'ready',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

// Clip types
export const enum ClipType {
  HIGHLIGHT = 'highlight',
  PLAY_OF_THE_GAME = 'play_of_the_game',
  MOMENT = 'moment',
  KILL = 'kill',
  DEATH = 'death',
  ASSIST = 'assist',
  ACE = 'ace',
  CLUTCH = 'clutch',
}

// Delivery method
export const enum DeliveryMethod {
  DM = 'dm',
  CHANNEL = 'channel',
}

// Delivery status
export const enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

// User preferences interface
export interface UserPreferences {
  userId: string;
  deliveryMethod: DeliveryMethod;
  channelId?: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  preferredClipTypes: ClipType[];
  notificationsEnabled: boolean;
}

// Linked account interface
export interface LinkedAccount {
  id: string;
  userId: string;
  platform: PlatformType;
  platformAccountId: string;
  platformUsername?: string;
  status: AccountLinkStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  pollState?: PollState;
  createdAt: Date;
  updatedAt: Date;
}

export interface PollState {
  id: string;
  linkedAccountId: string;
  lastMatchId?: string;
  lastCheckedAt: Date;
  pollingEnabled: boolean;
}

// Match record interface
export interface MatchRecord {
  id: string;
  userId: string;
  platform: PlatformType;
  gameTitle: GamePlatform;
  matchId: string;
  platformMatchId: string;
  status: MatchStatus;
  startedAt?: Date;
  endedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Clip record interface
export interface ClipRecord {
  id: string;
  matchId: string;
  userId: string;
  allstarClipId: string;
  type: ClipType;
  title?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  status: ClipStatus;
  requestedAt?: Date;
  readyAt?: Date;
  deliveredAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Delivery record interface
export interface DeliveryRecord {
  id: string;
  clipId: string;
  userId: string;
  recipientId: string;
  method: DeliveryMethod;
  status: DeliveryStatus;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Job data types
export interface MatchPollJobData {
  linkedAccountId: string;
  platform: PlatformType;
  platformAccountId: string;
}

export interface ClipRequestJobData {
  matchId: string;
  userId: string;
  platform: PlatformType;
  platformMatchId: string;
}

export interface ClipMonitorJobData {
  matchId: string;
  clipRequestId: string;
}

export interface ClipDeliveryJobData {
  clipId: string;
  userId: string;
  matchId: string;
}

// Platform match info
export interface MatchInfo {
  matchId: string;
  matchtime?: number;
  result?: string;
}
