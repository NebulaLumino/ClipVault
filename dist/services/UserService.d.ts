import { Prisma } from '@prisma/client';
import type { UserPreferences } from '../types/index.js';
export declare class UserService {
    getOrCreateUser(discordId: string, username?: string, globalName?: string, avatarUrl?: string): Promise<{
        discordId: string;
        createdAt: Date;
        id: string;
        username: string | null;
        globalName: string | null;
        avatarUrl: string | null;
        preferences: Prisma.JsonValue | null;
        updatedAt: Date;
    }>;
    getUserByDiscordId(discordId: string): Promise<{
        discordId: string;
        createdAt: Date;
        id: string;
        username: string | null;
        globalName: string | null;
        avatarUrl: string | null;
        preferences: Prisma.JsonValue | null;
        updatedAt: Date;
    } | null>;
    getUserById(id: string): Promise<{
        discordId: string;
        createdAt: Date;
        id: string;
        username: string | null;
        globalName: string | null;
        avatarUrl: string | null;
        preferences: Prisma.JsonValue | null;
        updatedAt: Date;
    } | null>;
    updateUser(id: string, data: {
        username?: string;
        globalName?: string;
        avatarUrl?: string;
        preferences?: UserPreferences;
    }): Promise<{
        discordId: string;
        createdAt: Date;
        id: string;
        username: string | null;
        globalName: string | null;
        avatarUrl: string | null;
        preferences: Prisma.JsonValue | null;
        updatedAt: Date;
    }>;
    getPreferences(userId: string): Promise<UserPreferences>;
    updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}
export declare const userService: UserService;
//# sourceMappingURL=UserService.d.ts.map