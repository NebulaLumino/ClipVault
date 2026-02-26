import prisma from '../db/prisma.js';
import { logger } from '../utils/logger.js';
export class UserService {
    async getOrCreateUser(discordId, username, globalName, avatarUrl) {
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
    async getUserByDiscordId(discordId) {
        return prisma.user.findUnique({
            where: { discordId },
        });
    }
    async getUserById(id) {
        return prisma.user.findUnique({
            where: { id },
        });
    }
    async updateUser(id, data) {
        return prisma.user.update({
            where: { id },
            data: {
                ...data,
                preferences: data.preferences,
            },
        });
    }
    async getPreferences(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true },
        });
        const defaultPreferences = {
            userId,
            deliveryMethod: "dm" /* DeliveryMethod.DM */,
            quietHoursEnabled: false,
            preferredClipTypes: [
                "highlight" /* ClipType.HIGHLIGHT */,
                "play_of_the_game" /* ClipType.PLAY_OF_THE_GAME */,
                "ace" /* ClipType.ACE */,
                "clutch" /* ClipType.CLUTCH */,
            ],
            notificationsEnabled: true,
        };
        if (!user?.preferences) {
            return defaultPreferences;
        }
        const prefs = user.preferences;
        if (prefs && typeof prefs === 'object') {
            return {
                ...defaultPreferences,
                ...prefs,
            };
        }
        return defaultPreferences;
    }
    async updatePreferences(userId, preferences) {
        const current = await this.getPreferences(userId);
        const updated = { ...current, ...preferences, userId };
        await prisma.user.update({
            where: { id: userId },
            data: { preferences: updated },
        });
        return updated;
    }
}
export const userService = new UserService();
//# sourceMappingURL=UserService.js.map