import { EmbedBuilder, type APIEmbed } from "discord.js";
import { ClipType, ClipStatus } from "../../types/index.js";

export class ClipEmbed {
  buildClipEmbed(options: {
    title?: string;
    clipType: ClipType;
    status: ClipStatus;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    gameTitle?: string;
  }): EmbedBuilder {
    const {
      title,
      clipType,
      status,
      videoUrl,
      thumbnailUrl,
      duration,
      gameTitle,
    } = options;

    const embed = new EmbedBuilder()
      .setColor(this.getStatusColor(status))
      .setTitle(title || "🎬 New Clip!")
      .addFields(
        { name: "Type", value: this.formatClipType(clipType), inline: true },
        { name: "Status", value: this.formatStatus(status), inline: true },
      );

    if (duration) {
      embed.addFields({
        name: "Duration",
        value: `${duration}s`,
        inline: true,
      });
    }

    if (gameTitle) {
      embed.addFields({ name: "Game", value: gameTitle, inline: true });
    }

    if (thumbnailUrl) {
      embed.setThumbnail(thumbnailUrl);
    }

    if (videoUrl) {
      embed.setURL(videoUrl);
      embed.setDescription(`[Watch Clip](${videoUrl})`);
    }

    embed.setFooter({ text: "Powered by ClipVault" });

    return embed;
  }

  buildClipListEmbed(
    clips: Array<{
      id: string;
      title?: string;
      type: ClipType;
      status: ClipStatus;
      createdAt: Date;
    }>,
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📋 Your Clips");

    if (clips.length === 0) {
      embed.setDescription("No clips yet!");
    } else {
      const clipList = clips
        .slice(0, 10)
        .map((clip, index) => {
          return `${index + 1}. **${clip.title || "Untitled"}** - ${this.formatClipType(clip.type)}`;
        })
        .join("\n");

      embed.setDescription(clipList);
    }

    embed.setFooter({ text: "Powered by ClipVault" });

    return embed;
  }

  private getStatusColor(status: ClipStatus): number {
    switch (status) {
      case ClipStatus.READY:
        return 0x57f287;
      case ClipStatus.PROCESSING:
        return 0xfee75c;
      case ClipStatus.DELIVERED:
        return 0x5865f2;
      case ClipStatus.FAILED:
        return 0xed4245;
      default:
        return 0x99aab5;
    }
  }

  private formatClipType(type: ClipType): string {
    const typeMap: Record<string, string> = {
      [ClipType.HIGHLIGHT]: "Highlight",
      [ClipType.PLAY_OF_THE_GAME]: "Play of the Game",
      [ClipType.MOMENT]: "Epic Moment",
      [ClipType.KILL]: "Kill",
      [ClipType.DEATH]: "Death",
      [ClipType.ASSIST]: "Assist",
      [ClipType.ACE]: "Ace",
      [ClipType.CLUTCH]: "Clutch",
    };
    return typeMap[type] || type;
  }

  private formatStatus(status: ClipStatus): string {
    const statusMap: Record<string, string> = {
      [ClipStatus.REQUESTED]: "⏳ Requested",
      [ClipStatus.PROCESSING]: "⚙️ Processing",
      [ClipStatus.READY]: "✅ Ready",
      [ClipStatus.DELIVERED]: "📤 Delivered",
      [ClipStatus.FAILED]: "❌ Failed",
    };
    return statusMap[status] || status;
  }
}

export const clipEmbed = new ClipEmbed();
