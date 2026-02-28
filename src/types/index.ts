import {
  PlatformType as PrismaPlatformType,
  AccountLinkStatus as PrismaAccountLinkStatus,
  GamePlatform as PrismaGamePlatform,
  MatchStatus as PrismaMatchStatus,
  ClipStatus as PrismaClipStatus,
  ClipType as PrismaClipType,
  DeliveryMethod as PrismaDeliveryMethod,
  DeliveryStatus as PrismaDeliveryStatus,
  Prisma,
} from "@prisma/client";

export const PlatformType = {
  STEAM: "steam" as PrismaPlatformType,
  RIOT: "riot" as PrismaPlatformType,
  EPIC: "epic" as PrismaPlatformType,
  DISCORD: "discord" as PrismaPlatformType,
  FACEIT: "faceit" as PrismaPlatformType,
};
export type PlatformType = PrismaPlatformType;

export const AccountLinkStatus = {
  PENDING: "pending" as PrismaAccountLinkStatus,
  LINKED: "linked" as PrismaAccountLinkStatus,
  EXPIRED: "expired" as PrismaAccountLinkStatus,
  ERROR: "error" as PrismaAccountLinkStatus,
};
export type AccountLinkStatus = PrismaAccountLinkStatus;

export const GamePlatform = {
  CS2: "cs2" as PrismaGamePlatform,
  LEAGUE_OF_LEGENDS: "lol" as PrismaGamePlatform,
  DOTA2: "dota2" as PrismaGamePlatform,
  FORTNITE: "fortnite" as PrismaGamePlatform,
};
export type GamePlatform = PrismaGamePlatform;

export const GameTitle = {
  CS2: "Counter-Strike 2",
  LOL: "League of Legends",
  DOTA2: "Dota 2",
  FORTNITE: "Fortnite",
} as const;
export type GameTitle = (typeof GameTitle)[keyof typeof GameTitle];

export const MatchStatus = {
  DETECTED: "detected" as PrismaMatchStatus,
  PROCESSING: "processing" as PrismaMatchStatus,
  COMPLETED: "completed" as PrismaMatchStatus,
  FAILED: "failed" as PrismaMatchStatus,
  EXPIRED: "expired" as PrismaMatchStatus,
};
export type MatchStatus = PrismaMatchStatus;

export const ClipStatus = {
  REQUESTED: "requested" as PrismaClipStatus,
  PROCESSING: "processing" as PrismaClipStatus,
  READY: "ready" as PrismaClipStatus,
  DELIVERED: "delivered" as PrismaClipStatus,
  FAILED: "failed" as PrismaClipStatus,
  EXPIRED: "expired" as PrismaClipStatus,
};
export type ClipStatus = PrismaClipStatus;

export const ClipType = {
  HIGHLIGHT: "highlight" as PrismaClipType,
  PLAY_OF_THE_GAME: "play_of_the_game" as PrismaClipType,
  MOMENT: "moment" as PrismaClipType,
  KILL: "kill" as PrismaClipType,
  DEATH: "death" as PrismaClipType,
  ASSIST: "assist" as PrismaClipType,
  ACE: "ace" as PrismaClipType,
  CLUTCH: "clutch" as PrismaClipType,
};
export type ClipType = PrismaClipType;

export const DeliveryMethod = {
  DM: "dm" as PrismaDeliveryMethod,
  CHANNEL: "channel" as PrismaDeliveryMethod,
};
export type DeliveryMethod = PrismaDeliveryMethod;

export const DeliveryStatus = {
  PENDING: "pending" as PrismaDeliveryStatus,
  SENT: "sent" as PrismaDeliveryStatus,
  FAILED: "failed" as PrismaDeliveryStatus,
};
export type DeliveryStatus = PrismaDeliveryStatus;

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

export interface MatchRecord {
  id: string;
  userId: string;
  platform: PlatformType;
  gameTitle: GamePlatform;
  matchId: string;
  platformMatchId: string;
  status: MatchStatus;
  startedAt?: Date | null;
  endedAt?: Date | null;
  metadata?: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClipRecord {
  id: string;
  matchId: string;
  userId: string;
  allstarClipId: string;
  type: ClipType;
  title?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  status: ClipStatus;
  requestedAt?: Date | null;
  readyAt?: Date | null;
  deliveredAt?: Date | null;
  metadata?: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface MatchPollJobData {
  linkedAccountId: string;
  platform: PlatformType;
  platformAccountId: string;
}

export interface ClipRequestJobData {
  matchId: string;
  userId: string;
  platform: string;
  platformAccountId: string;
  platformMatchId: string;
  gameTitle: GamePlatform;
}

export interface ClipMonitorJobData {
  clipId: string;
  matchId: string;
}

export interface ClipDeliveryJobData {
  clipId: string;
  userId: string;
  matchId?: string;
}

export interface MatchInfo {
  matchId: string;
  matchtime?: number;
  result?: string;
}
