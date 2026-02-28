import { linkedAccountRepository } from "../../db/repositories/LinkedAccountRepository.js";
import { userRepository } from "../../db/repositories/UserRepository.js";
import { logger } from "../../utils/logger.js";
import type { PlatformType, AccountLinkStatus } from "../../types/index.js";

export interface LinkAccountInput {
  discordUserId: string;
  platform: PlatformType;
  platformAccountId: string;
  platformUsername?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  region?: string;
}

export interface LinkAccountResult {
  success: boolean;
  accountId: string;
  platformUsername: string;
}

export class AccountLinkService {
  async linkAccount(input: LinkAccountInput): Promise<LinkAccountResult> {
    const {
      discordUserId,
      platform,
      platformAccountId,
      platformUsername,
      accessToken,
      refreshToken,
      tokenExpiry,
    } = input;

    const user = await userRepository.findOrCreate(discordUserId);

    const existingAccount =
      await linkedAccountRepository.findByUserIdAndPlatform(user.id, platform);
    if (existingAccount) {
      await linkedAccountRepository.update(existingAccount.id, {
        platformUsername,
        accessToken,
        refreshToken,
        tokenExpiry,
        status: "linked" as AccountLinkStatus,
      });

      logger.info("Updated linked account", {
        userId: user.id,
        platform,
        accountId: existingAccount.id,
      });

      return {
        success: true,
        accountId: existingAccount.id,
        platformUsername: platformUsername || "Unknown",
      };
    }

    const account = await linkedAccountRepository.create({
      userId: user.id,
      platform,
      platformAccountId,
      platformUsername,
      accessToken,
      refreshToken,
      tokenExpiry,
      status: "linked" as AccountLinkStatus,
    });

    await linkedAccountRepository.upsertPollState(account.id, "");

    logger.info("Created new linked account", {
      userId: user.id,
      platform,
      accountId: account.id,
    });

    return {
      success: true,
      accountId: account.id,
      platformUsername: platformUsername || "Unknown",
    };
  }

  async unlinkAccount(
    discordUserId: string,
    platform: PlatformType,
  ): Promise<boolean> {
    const user = await userRepository.findByDiscordId(discordUserId);
    if (!user) {
      return false;
    }

    const account = await linkedAccountRepository.findByUserIdAndPlatform(
      user.id,
      platform,
    );
    if (!account) {
      return false;
    }

    await linkedAccountRepository.delete(account.id);

    logger.info("Unlinked account", {
      userId: user.id,
      platform,
    });

    return true;
  }

  async getLinkedAccounts(discordUserId: string) {
    const user = await userRepository.findByDiscordId(discordUserId);
    if (!user) {
      return [];
    }

    return linkedAccountRepository.findByUserId(user.id);
  }

  async getLinkedAccount(discordUserId: string, platform: PlatformType) {
    const user = await userRepository.findByDiscordId(discordUserId);
    if (!user) {
      return null;
    }

    return linkedAccountRepository.findByUserIdAndPlatform(user.id, platform);
  }

  async getLinkedAccountById(id: string) {
    return linkedAccountRepository.findByIdWithPollState(id);
  }

  async isAccountLinked(
    discordUserId: string,
    platform: PlatformType,
  ): Promise<boolean> {
    const account = await this.getLinkedAccount(discordUserId, platform);
    return account !== null;
  }
}

export const accountLinkService = new AccountLinkService();
