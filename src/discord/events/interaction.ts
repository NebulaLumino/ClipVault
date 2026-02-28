import { discordClient } from "../client.js";
import { userService } from "../../services/UserService.js";
import { accountService } from "../../services/AccountService.js";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { PlatformType, DeliveryMethod, ClipType } from "../../types/index.js";

export function setupInteractionHandler(): void {
  discordClient.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }
  });
}

async function handleSlashCommand(interaction: any): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user: discordUser } = interaction;
  const options = interaction.options;
  logger.info("Command received", { commandName, userId: discordUser.id });

  try {
    let user = await userService.getOrCreateUser(
      discordUser.id,
      discordUser.username,
      discordUser.globalName || undefined,
    );

    if (!user) {
      throw new Error("Failed to get or create user");
    }

    switch (commandName) {
      case "link": {
        await handleLinkCommand(interaction, options);
        break;
      }

      case "unlink": {
        const platform = options.getString("platform") as PlatformType;
        await accountService.unlinkAccount(user.id, platform);
        await interaction.reply({
          content: `Your ${platform} account has been unlinked.`,
          ephemeral: true,
        });
        break;
      }

      case "settings": {
        await handleSettingsCommand(interaction, options, user.id);
        break;
      }

      case "status": {
        await handleStatusCommand(interaction, user.id);
        break;
      }

      case "history": {
        await handleHistoryCommand(interaction, options);
        break;
      }

      case "help": {
        await handleHelpCommand(interaction);
        break;
      }
    }
  } catch (error) {
    logger.error("Command error", { commandName, error: String(error) });
    await interaction.reply({
      content: "An error occurred while processing your command.",
      ephemeral: true,
    });
  }
}

async function handleLinkCommand(
  interaction: any,
  options: any,
): Promise<void> {
  const subcommand = options.getSubcommand();
  let authUrl = "";

  switch (subcommand) {
    case "steam":
      authUrl = `https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to=${encodeURIComponent(config.OAUTH_REDIRECT_BASE + "/oauth/steam/callback")}&openid.realm=${encodeURIComponent(config.OAUTH_REDIRECT_BASE)}&openid.identity=http://specs.openid.net/auth/2.0/claimed_identity&openid.claimed_id=http://specs.openid.net/auth/2.0/claimed_identity`;
      break;
    case "riot":
      authUrl = `https://auth.riotgames.com/authorize?redirect_uri=${encodeURIComponent(config.OAUTH_REDIRECT_BASE + "/oauth/riot/callback")}&client_id=${config.RIOT_CLIENT_ID}&response_type=code&scope=openid%20profile%20lol`;
      break;
    case "epic":
      authUrl = `https://www.epicgames.com/id/authorize?redirect_uri=${encodeURIComponent(config.OAUTH_REDIRECT_BASE + "/oauth/epic/callback")}&client_id=${config.EPIC_CLIENT_ID}&response_type=code`;
      break;
  }

  if (authUrl) {
    await interaction.reply({
      content: `Please link your account: ${authUrl}`,
      ephemeral: true,
    });
  }
}

async function handleSettingsCommand(
  interaction: any,
  options: any,
  userId: string,
): Promise<void> {
  const subcommand = options.getSubcommand();

  switch (subcommand) {
    case "view": {
      const prefs =
        ((await userService.getUserById(userId))?.preferences as Record<
          string,
          unknown
        >) || {};
      await interaction.reply({
        content: `Current settings: ${JSON.stringify(prefs, null, 2)}`,
        ephemeral: true,
      });
      break;
    }
    case "delivery": {
      const method = options.getString("method");
      await userService.updatePreferences(userId, {
        deliveryMethod:
          method === "channel" ? DeliveryMethod.CHANNEL : DeliveryMethod.DM,
      });
      await interaction.reply({
        content: `Delivery method set to: ${method}`,
        ephemeral: true,
      });
      break;
    }
    case "quiet-hours": {
      const enabled = options.getBoolean("enabled");
      const start = options.getString("start");
      const end = options.getString("end");
      await userService.updatePreferences(userId, {
        quietHoursEnabled: enabled || false,
        quietHoursStart: start || undefined,
        quietHoursEnd: end || undefined,
      });
      await interaction.reply({
        content: `Quiet hours ${enabled ? "enabled" : "disabled"}`,
        ephemeral: true,
      });
      break;
    }
    case "clip-types": {
      const types = options.getString("types");
      const clipTypes =
        types?.split(",").map((t: string) => t.trim().toLowerCase()) || [];
      await userService.updatePreferences(userId, {
        preferredClipTypes: clipTypes as unknown as ClipType[],
      });
      await interaction.reply({
        content: `Clip types updated: ${types}`,
        ephemeral: true,
      });
      break;
    }
  }
}

async function handleStatusCommand(
  interaction: any,
  userId: string,
): Promise<void> {
  const accounts = await accountService.getLinkedAccounts(userId);
  const statusText =
    accounts.length > 0
      ? accounts
          .map(
            (a) =>
              `${a.platform}: ${a.platformUsername || a.platformAccountId}`,
          )
          .join("\n")
      : "No linked accounts";

  await interaction.reply({
    content: `Linked Accounts:\n${statusText}`,
    ephemeral: true,
  });
}

async function handleHistoryCommand(
  interaction: any,
  options: any,
): Promise<void> {
  const limit = options.getInteger("limit") || 10;
  await interaction.reply({
    content: `Recent clips: (showing last ${limit})\n[History feature coming soon]`,
    ephemeral: true,
  });
}

async function handleHelpCommand(interaction: any): Promise<void> {
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
}

async function handleButton(interaction: any): Promise<void> {
  const { customId } = interaction;
  logger.info("Button interaction", { customId, userId: interaction.user.id });

  switch (customId) {
    case "clip_watch":
      await interaction.reply({
        content: "🎬 Opening clip...",
        ephemeral: true,
      });
      break;
    case "clip_share":
      await interaction.reply({
        content: "📤 Share feature coming soon!",
        ephemeral: true,
      });
      break;
    case "settings_edit":
      await interaction.reply({
        content: "⚙️ Opening settings...",
        ephemeral: true,
      });
      break;
    default:
      await interaction.reply({ content: "Unknown button", ephemeral: true });
  }
}

async function handleSelectMenu(interaction: any): Promise<void> {
  const { customId, values } = interaction;
  logger.info("Select menu interaction", {
    customId,
    values,
    userId: interaction.user.id,
  });

  await interaction.reply({ content: "Selection received!", ephemeral: true });
}

async function handleModal(interaction: any): Promise<void> {
  const { customId } = interaction;
  logger.info("Modal submission", { customId, userId: interaction.user.id });

  await interaction.reply({ content: "Settings updated!", ephemeral: true });
}
