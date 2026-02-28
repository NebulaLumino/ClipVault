import { EmbedBuilder } from "discord.js";
import { PlatformType } from "../../types/index.js";

export interface LinkedAccountData {
  id: string;
  platform: PlatformType;
  platformUsername?: string;
  platformAccountId: string;
  status: string;
  createdAt: Date;
}

export class StatusEmbed {
  buildStatusEmbed(accounts: LinkedAccountData[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🔗 Linked Accounts");

    if (accounts.length === 0) {
      embed.setDescription(
        "No linked accounts. Use `/link` to connect your gaming accounts!",
      );
    } else {
      const accountFields = accounts.map((account) => ({
        name: this.getPlatformName(account.platform),
        value: `${account.platformUsername || account.platformAccountId}\nStatus: ${account.status}`,
        inline: true,
      }));

      embed.addFields(accountFields);
    }

    embed.setFooter({ text: "Use /unlink to remove accounts" });

    return embed;
  }

  buildAccountLinkedEmbed(
    platform: PlatformType,
    username: string,
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("✅ Account Linked")
      .setDescription(
        `Your **${this.getPlatformName(platform)}** account (\`${username}\`) has been linked successfully!`,
      );
  }

  buildAccountUnlinkedEmbed(platform: PlatformType): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle("🔓 Account Unlinked")
      .setDescription(
        `Your **${this.getPlatformName(platform)}** account has been unlinked.`,
      );
  }

  buildErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("❌ Error")
      .setDescription(message);
  }

  private getPlatformName(platform: PlatformType): string {
    const platformNames: Record<string, string> = {
      [PlatformType.STEAM]: "Steam",
      [PlatformType.RIOT]: "Riot",
      [PlatformType.EPIC]: "Epic Games",
      [PlatformType.FACEIT]: "FACEIT",
    };
    return platformNames[platform] || platform;
  }
}

export const statusEmbed = new StatusEmbed();
