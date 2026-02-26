import { Prisma } from '@prisma/client';
import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { DeliveryMethod, ClipType } from '../types/index.js';
import type { UserPreferences } from '../types/index.js';

export class UserService {
  async getOrCreateUser(discordId: string, username?: string, globalName?: string, avatarUrl?: string) {
    let user = await prisma.user.findUnique({
      where: { discordId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId,
          username,
          globalName,
          avatarUrl,
        },
      });
      logger.info('Created new user', { discordId, userId: user.id });
    }

    return user;
  }

  async getUserByDiscordId(discordId: string) {
    return prisma.user.findUnique({
      where: { discordId },
    });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, data: {
    username?: string;
    globalName?: string;
    avatarUrl?: string;
    preferences?: UserPreferences;
  }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        preferences: data.preferences as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const defaultPreferences: UserPreferences = {
      userId,
      deliveryMethod: DeliveryMethod.DM,
      quietHoursEnabled: false,
      preferredClipTypes: [
        ClipType.HIGHLIGHT,
        ClipType.PLAY_OF_THE_GAME,
        ClipType.ACE,
        ClipType.CLUTCH,
      ],
      notificationsEnabled: true,
    };

    if (!user?.preferences) {
      return defaultPreferences;
    }

    const prefs = user.preferences as unknown;
    if (prefs && typeof prefs === 'object') {
      return {
        ...defaultPreferences,
        ...(prefs as UserPreferences),
      };
    }
    
    return defaultPreferences;
  }

  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...preferences, userId };

    await prisma.user.update({
      where: { id: userId },
      data: { preferences: updated as Prisma.InputJsonValue },
    });

    return updated;
  }
}

export const userService = new UserService();
