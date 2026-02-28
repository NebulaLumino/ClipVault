import { preferenceRepository } from "../db/repositories/PreferenceRepository.js";
import { logger } from "../utils/logger.js";
import { DeliveryMethod, ClipType } from "../types/index.js";
import type { UserPreferences } from "../types/index.js";

export interface UpdatePreferencesData {
  deliveryMethod?: DeliveryMethod;
  channelId?: string;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  preferredClipTypes?: ClipType[];
  notificationsEnabled?: boolean;
}

export class PreferenceService {
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const prefs = await preferenceRepository.getPreferences(userId);

    const typedPrefs = prefs as Record<string, unknown> | null;

    const defaultPrefs: UserPreferences = {
      userId,
      deliveryMethod: DeliveryMethod.DM,
      quietHoursEnabled: false,
      preferredClipTypes: [ClipType.HIGHLIGHT],
      notificationsEnabled: true,
    };

    if (!typedPrefs) {
      return defaultPrefs;
    }

    return {
      userId,
      deliveryMethod:
        (typedPrefs.deliveryMethod as DeliveryMethod) || DeliveryMethod.DM,
      channelId: typedPrefs.channelId as string | undefined,
      quietHoursEnabled: (typedPrefs.quietHoursEnabled as boolean) ?? false,
      quietHoursStart: typedPrefs.quietHoursStart as string | undefined,
      quietHoursEnd: typedPrefs.quietHoursEnd as string | undefined,
      preferredClipTypes: (typedPrefs.preferredClipTypes as ClipType[]) || [
        ClipType.HIGHLIGHT,
      ],
      notificationsEnabled:
        (typedPrefs.notificationsEnabled as boolean) ?? true,
    };
  }

  async updateUserPreferences(
    userId: string,
    data: UpdatePreferencesData,
  ): Promise<UserPreferences> {
    const updateData: Record<string, unknown> = {};

    if (data.deliveryMethod !== undefined) {
      updateData.deliveryMethod = data.deliveryMethod;
    }
    if (data.channelId !== undefined) {
      updateData.channelId = data.channelId;
    }
    if (data.quietHoursEnabled !== undefined) {
      updateData.quietHoursEnabled = data.quietHoursEnabled;
    }
    if (data.quietHoursStart !== undefined) {
      updateData.quietHoursStart = data.quietHoursStart;
    }
    if (data.quietHoursEnd !== undefined) {
      updateData.quietHoursEnd = data.quietHoursEnd;
    }
    if (data.preferredClipTypes !== undefined) {
      updateData.preferredClipTypes = data.preferredClipTypes;
    }
    if (data.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = data.notificationsEnabled;
    }

    await preferenceRepository.updatePreferences(
      userId,
      updateData as {
        dmEnabled?: boolean;
        serverFeedOptIn?: boolean;
        enabledGames?: string[];
        clipTypes?: string[];
        minClipRating?: number;
        deliveryFormat?: string;
        quietHoursStart?: string;
        quietHoursEnd?: string;
        timezone?: string;
      },
    );

    logger.info("Updated user preferences", { userId });

    return this.getUserPreferences(userId);
  }

  async setDeliveryMethod(
    userId: string,
    method: DeliveryMethod,
    channelId?: string,
  ): Promise<UserPreferences> {
    return this.updateUserPreferences(userId, {
      deliveryMethod: method,
      channelId,
    });
  }

  async setQuietHours(
    userId: string,
    enabled: boolean,
    start?: string,
    end?: string,
  ): Promise<UserPreferences> {
    return this.updateUserPreferences(userId, {
      quietHoursEnabled: enabled,
      quietHoursStart: start,
      quietHoursEnd: end,
    });
  }

  async setPreferredClipTypes(
    userId: string,
    types: ClipType[],
  ): Promise<UserPreferences> {
    return this.updateUserPreferences(userId, {
      preferredClipTypes: types,
    });
  }

  async canDeliverNow(userId: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);

    if (!prefs.quietHoursEnabled) {
      return true;
    }

    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return true;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const start = prefs.quietHoursStart;
    const end = prefs.quietHoursEnd;

    if (start <= end) {
      return currentTime < start || currentTime >= end;
    } else {
      return currentTime >= end && currentTime < start;
    }
  }

  async deleteUserPreferences(userId: string): Promise<void> {
    await preferenceRepository.clearPreferences(userId);
    logger.info("Deleted user preferences", { userId });
  }
}

export const preferenceService = new PreferenceService();
