import { EmbedBuilder } from "discord.js";
import { DeliveryMethod, ClipType } from "../../types/index.js";

export interface UserPreferencesData {
  deliveryMethod?: DeliveryMethod;
  channelId?: string;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  preferredClipTypes?: ClipType[];
  notificationsEnabled?: boolean;
}

export class SettingsEmbed {
  buildSettingsEmbed(preferences: UserPreferencesData): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("⚙️ Your Settings")
      .addFields(
        {
          name: "Delivery Method",
          value:
            preferences.deliveryMethod === DeliveryMethod.CHANNEL
              ? "📢 Channel"
              : "💬 DM",
          inline: true,
        },
        {
          name: "Notifications",
          value: preferences.notificationsEnabled
            ? "✅ Enabled"
            : "🔕 Disabled",
          inline: true,
        },
        {
          name: "Quiet Hours",
          value: preferences.quietHoursEnabled
            ? `${preferences.quietHoursStart || "22:00"} - ${preferences.quietHoursEnd || "08:00"}`
            : "❌ Disabled",
          inline: true,
        },
        {
          name: "Preferred Clip Types",
          value: preferences.preferredClipTypes?.length
            ? preferences.preferredClipTypes
                .map((t) => this.formatClipType(t))
                .join(", ")
            : "All",
        },
      );

    if (preferences.channelId) {
      embed.addFields({
        name: "Channel",
        value: `<#${preferences.channelId}>`,
        inline: true,
      });
    }

    embed.setFooter({ text: "Use /settings to modify these settings" });

    return embed;
  }

  buildSettingsSuccessEmbed(action: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("✅ Settings Updated")
      .setDescription(action);
  }

  buildSettingsErrorEmbed(error: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("❌ Error")
      .setDescription(error);
  }

  private formatClipType(type: ClipType): string {
    const typeMap: Record<string, string> = {
      [ClipType.HIGHLIGHT]: "Highlight",
      [ClipType.PLAY_OF_THE_GAME]: "POTG",
      [ClipType.MOMENT]: "Moment",
      [ClipType.KILL]: "Kill",
      [ClipType.DEATH]: "Death",
      [ClipType.ASSIST]: "Assist",
      [ClipType.ACE]: "Ace",
      [ClipType.CLUTCH]: "Clutch",
    };
    return typeMap[type] || type;
  }
}

export const settingsEmbed = new SettingsEmbed();
