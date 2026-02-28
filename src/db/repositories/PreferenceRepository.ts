import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import type { User } from "@prisma/client";

export interface UserPreferenceData {
  userId: string;
  dmEnabled?: boolean;
  serverFeedOptIn?: boolean;
  enabledGames?: string[];
  clipTypes?: string[];
  minClipRating?: number;
  deliveryFormat?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export interface UpdatePreferenceData {
  dmEnabled?: boolean;
  serverFeedOptIn?: boolean;
  enabledGames?: string[];
  clipTypes?: string[];
  minClipRating?: number;
  deliveryFormat?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export class PreferenceRepository {
  async getOrCreate(userId: string): Promise<User> {
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, discordId: userId },
      });
    }

    return user;
  }

  async getPreferences(
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    return user?.preferences as Record<string, unknown> | null;
  }

  async updatePreferences(
    userId: string,
    data: UpdatePreferenceData,
  ): Promise<User> {
    const currentPreferences = await this.getPreferences(userId);
    const merged = {
      ...currentPreferences,
      ...data,
      updatedAt: new Date(),
    };

    return prisma.user.update({
      where: { id: userId },
      data: {
        preferences: merged as Prisma.InputJsonValue,
      },
    });
  }

  async setPreference(
    userId: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    const current = (await this.getPreferences(userId)) || {};
    current[key] = value;

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: current as Prisma.InputJsonValue,
      },
    });
  }

  async getPreference<T>(userId: string, key: string): Promise<T | null> {
    const prefs = await this.getPreferences(userId);
    return (prefs?.[key] as T) ?? null;
  }

  async clearPreferences(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {} as Prisma.InputJsonValue,
      },
    });
  }

  async isDmEnabled(userId: string): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    return (prefs?.["dmEnabled"] as boolean) ?? true;
  }

  async isServerFeedOptIn(userId: string): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    return (prefs?.["serverFeedOptIn"] as boolean) ?? false;
  }

  async getEnabledGames(userId: string): Promise<string[]> {
    const prefs = await this.getPreferences(userId);
    return (
      (prefs?.["enabledGames"] as string[]) ?? [
        "cs2",
        "lol",
        "dota2",
        "fortnite",
      ]
    );
  }

  async getClipTypes(userId: string): Promise<string[]> {
    const prefs = await this.getPreferences(userId);
    return (
      (prefs?.["clipTypes"] as string[]) ?? [
        "highlight",
        "play_of_the_game",
        "moment",
      ]
    );
  }
}

export const preferenceRepository = new PreferenceRepository();
