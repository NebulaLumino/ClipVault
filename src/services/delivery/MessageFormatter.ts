import type { ClipRecord } from "../../types/index.js";
import { ClipType } from "../../types/index.js";

export interface FormattedMessage {
  content: string;
  embeds?: unknown[];
}

export class MessageFormatter {
  formatClipMessage(clip: ClipRecord): FormattedMessage {
    const lines: string[] = ["🎬 **Your ClipVault Highlights!**", ""];

    if (clip.title) {
      lines.push(`**${clip.title}**`);
    }

    lines.push(`📊 Type: ${this.formatClipType(clip.type)}`);

    if (clip.duration) {
      lines.push(`⏱️ Duration: ${clip.duration}s`);
    }

    if (clip.videoUrl) {
      lines.push(`🔗 Watch: ${clip.videoUrl}`);
    }

    if (clip.thumbnailUrl) {
      lines.push(`🖼️ Preview: ${clip.thumbnailUrl}`);
    }

    lines.push("");
    lines.push("_Powered by ClipVault_");

    return {
      content: lines.join("\n"),
    };
  }

  formatClipType(type: ClipType): string {
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

  formatDeliverySuccess(clip: ClipRecord, method: string): string {
    return `✅ Clip delivered successfully via ${method}!`;
  }

  formatDeliveryFailure(clip: ClipRecord, error: string): string {
    return `❌ Failed to deliver clip: ${error}`;
  }
}

export const messageFormatter = new MessageFormatter();
