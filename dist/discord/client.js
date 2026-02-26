import { Client, GatewayIntentBits, REST, Collection } from 'discord.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
export class ClipVaultClient extends Client {
    rest;
    commands = new Collection();
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
        this.rest = new REST({ version: '10' }).setToken(config.DISCORD_BOT_TOKEN);
    }
    async login() {
        logger.info('Logging in to Discord...');
        const token = await super.login(config.DISCORD_BOT_TOKEN);
        logger.info('Discord bot logged in successfully');
        return token;
    }
    async getUser(discordId) {
        try {
            return await this.users.fetch(discordId);
        }
        catch (error) {
            logger.error('Failed to fetch user', { discordId, error: String(error) });
            return null;
        }
    }
    async sendDM(userId, content) {
        try {
            const user = await this.getUser(userId);
            if (!user) {
                logger.error('User not found for DM', { userId });
                return null;
            }
            const dm = await user.createDM();
            await dm.send(content);
            logger.info('DM sent successfully', { userId });
            return dm;
        }
        catch (error) {
            logger.error('Failed to send DM', { userId, error: String(error) });
            return null;
        }
    }
    async getGuild(guildId) {
        try {
            return await this.guilds.fetch(guildId);
        }
        catch (error) {
            logger.error('Failed to fetch guild', { guildId, error: String(error) });
            return null;
        }
    }
    async getGuildMember(guildId, userId) {
        try {
            const guild = await this.getGuild(guildId);
            if (!guild)
                return null;
            return await guild.members.fetch(userId);
        }
        catch (error) {
            logger.error('Failed to fetch guild member', { guildId, userId, error: String(error) });
            return null;
        }
    }
}
export const discordClient = new ClipVaultClient();
// Event handlers
discordClient.on('ready', () => {
    logger.info(`Discord bot ready: ${discordClient.user?.tag}`);
});
discordClient.on('error', (error) => {
    logger.error('Discord client error', { error: String(error) });
});
discordClient.on('warn', (warning) => {
    logger.warn('Discord client warning', { warning });
});
//# sourceMappingURL=client.js.map