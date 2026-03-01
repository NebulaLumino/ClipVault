import { Client, GatewayIntentBits, REST, Routes, Collection, Guild, User, DMChannel, GuildMember } from 'discord.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { userService } from '../services/UserService.js';
import { accountService } from '../services/AccountService.js';
import { allCommands } from './commands.js';
import { PlatformType, DeliveryMethod, ClipType } from '../types/index.js';

export class ClipVaultClient extends Client {
  public rest: REST;
  public commands: Collection<string, unknown> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
    const token = config.DISCORD_BOT_TOKEN || '';
    this.rest = new REST({ version: '10' }).setToken(token);
  }

  async login(): Promise<string> {
    if (!config.DISCORD_BOT_TOKEN) {
      throw new Error('Discord bot token not configured');
    }
    logger.info('Logging in to Discord...');
    const token = await super.login(config.DISCORD_BOT_TOKEN);
    logger.info('Discord bot logged in successfully');
    return token;
  }

  async getUser(discordId: string): Promise<User | null> {
    try {
      return await this.users.fetch(discordId);
    } catch (error) {
      logger.error('Failed to fetch user', { discordId, error: String(error) });
      return null;
    }
  }

  async sendDM(userId: string, content: string): Promise<DMChannel | null> {
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
    } catch (error) {
      logger.error('Failed to send DM', { userId, error: String(error) });
      return null;
    }
  }

  async getGuild(guildId: string): Promise<Guild | null> {
    try {
      return await this.guilds.fetch(guildId);
    } catch (error) {
      logger.error('Failed to fetch guild', { guildId, error: String(error) });
      return null;
    }
  }

  async getGuildMember(guildId: string, userId: string): Promise<GuildMember | null> {
    try {
      const guild = await this.getGuild(guildId);
      if (!guild) return null;
      return await guild.members.fetch(userId);
    } catch (error) {
      logger.error('Failed to fetch guild member', { guildId, userId, error: String(error) });
      return null;
    }
  }
}

export const discordClient = new ClipVaultClient();

// Event handlers
discordClient.on('ready', async () => {
  logger.info(`Discord bot ready: ${discordClient.user?.tag}`);
  
  // Register slash commands
  if (!config.DISCORD_CLIENT_ID) {
    logger.warn('Discord client ID not configured, skipping command registration');
    return;
  }
  
  try {
    await discordClient.rest.put(
      Routes.applicationCommands(config.DISCORD_CLIENT_ID),
      { body: allCommands.map(cmd => cmd.toJSON()) }
    );
    logger.info('Slash commands registered');
  } catch (error) {
    logger.error('Failed to register commands', { error: String(error) });
  }
});

// Handle slash command interactions
discordClient.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const { commandName, user: discordUser } = interaction;
  const options = interaction.options;
  logger.info('Command received', { commandName, userId: discordUser.id });
  
  try {
    // Get or create user in database
    let user = await userService.getOrCreateUser(
      discordUser.id,
      discordUser.username,
      discordUser.globalName || undefined
    );
    
    if (!user) {
      throw new Error('Failed to get or create user');
    }
    
    switch (commandName) {
      case 'link': {
        const subcommand = options.getSubcommand();
        let authUrl = '';
        
        switch (subcommand) {
          case 'steam':
            authUrl = `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to=${encodeURIComponent(config.OAUTH_REDIRECT_BASE + '/api/auth/steam?state=' + user.id)}&openid.realm=${encodeURIComponent(config.OAUTH_REDIRECT_BASE)}&openid.identity=http://specs.openid.net/auth/2.0/claimed_identity&openid.claimed_id=http://specs.openid.net/auth/2.0/claimed_identity`;
            break;
          case 'riot':
            authUrl = `https://auth.riotgames.com/authorize?redirect_uri=${encodeURIComponent(config.OAUTH_REDIRECT_BASE + '/oauth/riot/callback')}&client_id=${config.RIOT_CLIENT_ID}&response_type=code&scope=openid%20profile%20lol`;
            break;
          case 'epic':
            authUrl = `https://www.epicgames.com/id/authorize?redirect_uri=${encodeURIComponent(config.OAUTH_REDIRECT_BASE + '/oauth/epic/callback')}&client_id=${config.EPIC_CLIENT_ID}&response_type=code`;
            break;
        }
        
        if (authUrl) {
          console.log('[DEBUG] Sending to Discord:', authUrl);
          await interaction.reply({
            content: `Please link your account: ${authUrl}`,
            ephemeral: true,
          });
        }
        break;
      }
      
      case 'unlink': {
        const platform = options.getString('platform') as PlatformType;
        await accountService.unlinkAccount(user.id, platform);
        await interaction.reply({
          content: `Your ${platform} account has been unlinked.`,
          ephemeral: true,
        });
        break;
      }
      
      case 'settings': {
        const subcommand = options.getSubcommand();
        
        switch (subcommand) {
          case 'view': {
            const prefs = user.preferences as Record<string, unknown> || {};
            await interaction.reply({
              content: `Current settings: ${JSON.stringify(prefs, null, 2)}`,
              ephemeral: true,
            });
            break;
          }
          case 'delivery': {
            const method = options.getString('method');
            await userService.updatePreferences(user.id, { deliveryMethod: method === 'channel' ? DeliveryMethod.CHANNEL : DeliveryMethod.DM });
            await interaction.reply({
              content: `Delivery method set to: ${method}`,
              ephemeral: true,
            });
            break;
          }
          case 'quiet-hours': {
            const enabled = options.getBoolean('enabled');
            const start = options.getString('start');
            const end = options.getString('end');
            await userService.updatePreferences(user.id, {
              quietHoursEnabled: enabled || false,
              quietHoursStart: start || undefined,
              quietHoursEnd: end || undefined,
            });
            await interaction.reply({
              content: `Quiet hours ${enabled ? 'enabled' : 'disabled'}`,
              ephemeral: true,
            });
            break;
          }
          case 'clip-types': {
            const types = options.getString('types');
            const clipTypes = types?.split(',').map((t: string) => t.trim().toLowerCase()) || [];
            await userService.updatePreferences(user.id, {
              preferredClipTypes: clipTypes as unknown as ClipType[],
            });
            await interaction.reply({
              content: `Clip types updated: ${types}`,
              ephemeral: true,
            });
            break;
          }
        }
        break;
      }
      
      case 'status': {
        const accounts = await accountService.getLinkedAccounts(user.id);
        const statusText = accounts.length > 0
          ? accounts.map(a => `${a.platform}: ${a.platformUsername || a.platformAccountId}`).join('\n')
          : 'No linked accounts';
        
        await interaction.reply({
          content: `Linked Accounts:\n${statusText}`,
          ephemeral: true,
        });
        break;
      }
      
      case 'history': {
        const limit = options.getInteger('limit') || 10;
        await interaction.reply({
          content: `Recent clips: (showing last ${limit})\n[History feature coming soon]`,
          ephemeral: true,
        });
        break;
      }
      
      case 'help': {
        await interaction.reply({
          content: `**ClipVault Commands:**
/link steam - Link Steam account (CS2/Dota 2)
/link riot - Link Riot account (League of Legends)
/link epic - Link Epic Games account (Fortnite)
/unlink - Unlink a platform account
/settings view - View your settings
/settings delivery - Set DM or channel delivery
/settings quiet-hours - Set quiet hours
/settings clip-types - Set preferred clip types
/status - Check linked accounts
/history - View clip delivery history
/help - Show this help message`,
          ephemeral: true,
        });
        break;
      }
    }
  } catch (error) {
    logger.error('Command error', { commandName, error: String(error) });
    await interaction.reply({
      content: 'An error occurred while processing your command.',
      ephemeral: true,
    });
  }
});

discordClient.on('error', (error) => {
  logger.error('Discord client error', { error: String(error) });
});

discordClient.on('warn', (warning) => {
  logger.warn('Discord client warning', { warning });
});
