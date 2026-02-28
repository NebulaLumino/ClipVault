import { PlatformType as PrismaPlatformType, AccountLinkStatus as PrismaAccountLinkStatus, GamePlatform as PrismaGamePlatform, MatchStatus as PrismaMatchStatus, ClipStatus as PrismaClipStatus, ClipType as PrismaClipType, DeliveryMethod as PrismaDeliveryMethod, DeliveryStatus as PrismaDeliveryStatus, Prisma } from "@prisma/client";
export declare const PlatformType: {
    STEAM: PrismaPlatformType;
    RIOT: PrismaPlatformType;
    EPIC: PrismaPlatformType;
    DISCORD: PrismaPlatformType;
    FACEIT: PrismaPlatformType;
};
export type PlatformType = PrismaPlatformType;
export declare const AccountLinkStatus: {
    PENDING: PrismaAccountLinkStatus;
    LINKED: PrismaAccountLinkStatus;
    EXPIRED: PrismaAccountLinkStatus;
    ERROR: PrismaAccountLinkStatus;
};
export type AccountLinkStatus = PrismaAccountLinkStatus;
export declare const GamePlatform: {
    CS2: PrismaGamePlatform;
    LEAGUE_OF_LEGENDS: PrismaGamePlatform;
    DOTA2: PrismaGamePlatform;
    FORTNITE: PrismaGamePlatform;
};
export type GamePlatform = PrismaGamePlatform;
export declare const GameTitle: {
    readonly CS2: "Counter-Strike 2";
    readonly LOL: "League of Legends";
    readonly DOTA2: "Dota 2";
    readonly FORTNITE: "Fortnite";
};
export type GameTitle = (typeof GameTitle)[keyof typeof GameTitle];
export declare const MatchStatus: {
    DETECTED: PrismaMatchStatus;
    PROCESSING: PrismaMatchStatus;
    COMPLETED: PrismaMatchStatus;
    FAILED: PrismaMatchStatus;
    EXPIRED: PrismaMatchStatus;
};
export type MatchStatus = PrismaMatchStatus;
export declare const ClipStatus: {
    REQUESTED: PrismaClipStatus;
    PROCESSING: PrismaClipStatus;
    READY: PrismaClipStatus;
    DELIVERED: PrismaClipStatus;
    FAILED: PrismaClipStatus;
    EXPIRED: PrismaClipStatus;
};
export type ClipStatus = PrismaClipStatus;
export declare const ClipType: {
    HIGHLIGHT: PrismaClipType;
    PLAY_OF_THE_GAME: PrismaClipType;
    MOMENT: PrismaClipType;
    KILL: PrismaClipType;
    DEATH: PrismaClipType;
    ASSIST: PrismaClipType;
    ACE: PrismaClipType;
    CLUTCH: PrismaClipType;
};
export type ClipType = PrismaClipType;
export declare const DeliveryMethod: {
    DM: PrismaDeliveryMethod;
    CHANNEL: PrismaDeliveryMethod;
};
export type DeliveryMethod = PrismaDeliveryMethod;
export declare const DeliveryStatus: {
    PENDING: PrismaDeliveryStatus;
    SENT: PrismaDeliveryStatus;
    FAILED: PrismaDeliveryStatus;
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
//# sourceMappingURL=index.d.ts.map