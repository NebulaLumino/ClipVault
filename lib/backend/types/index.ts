export enum PlatformType {
  STEAM = "STEAM",
  RIOT = "RIOT",
  EPIC = "EPIC",
}

export enum MatchStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum ClipStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
}

export enum DeliveryMethod {
  DM = "DM",
  CHANNEL = "CHANNEL",
}

export enum ClipType {
  HIGHLIGHT = "HIGHLIGHT",
  PLAY_OF_THE_GAME = "PLAY_OF_THE_GAME",
  ACE = "ACE",
  CLUTCH = "CLUTCH",
  SKILL_SHOT = "SKILL_SHOT",
}

export interface User {
  id: string;
  discordId: string;
  username: string;
  globalName?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  deliveryMethod: DeliveryMethod;
  deliveryChannelId?: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  preferredClipTypes: ClipType[];
}

export interface LinkedAccount {
  id: string;
  userId: string;
  platform: PlatformType;
  platformAccountId: string;
  platformUsername?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Clip {
  id: string;
  userId: string;
  platform: PlatformType;
  matchId: string;
  externalClipId: string;
  clipUrl?: string;
  thumbnailUrl?: string;
  status: ClipStatus;
  clipType?: ClipType;
  metadata?: Record<string, unknown>;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  userId: string;
  platform: PlatformType;
  platformMatchId: string;
  game: string;
  status: MatchStatus;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
