import { linkedAccountRepository } from "../../db/repositories/LinkedAccountRepository.js";
import { logger } from "../../utils/logger.js";
import type { PlatformType } from "../../types/index.js";

export class AccountSyncService {
  async syncAllAccounts(): Promise<{ success: number; failed: number }> {
    const accounts = await linkedAccountRepository.findAllLinked();

    let success = 0;
    let failed = 0;

    for (const account of accounts) {
      try {
        await this.syncAccount(account.id);
        success++;
      } catch (error) {
        logger.error("Failed to sync account", {
          accountId: account.id,
          error: String(error),
        });
        failed++;
      }
    }

    return { success, failed };
  }

  async syncAccount(linkedAccountId: string): Promise<void> {
    const account =
      await linkedAccountRepository.findByIdWithPollState(linkedAccountId);
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.platform === "riot" || account.platform === "epic") {
      await this.refreshTokenIfNeeded(account);
    }

    logger.info("Synced account", {
      accountId: linkedAccountId,
      platform: account.platform,
    });
  }

  private async refreshTokenIfNeeded(account: {
    id: string;
    platform: string;
    tokenExpiry?: Date | null;
    refreshToken?: string | null;
  }): Promise<void> {
    if (!account.tokenExpiry || !account.refreshToken) {
      return;
    }

    const now = new Date();
    const expiryDate = new Date(account.tokenExpiry);
    const hoursUntilExpiry =
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry > 24) {
      return;
    }

    logger.info("Token expiring soon, refreshing", {
      accountId: account.id,
      platform: account.platform,
      hoursUntilExpiry,
    });

    // Token refresh logic would go here for Riot/Epic
    // For now, we just log it
  }

  async getAccountsToSync(): Promise<{ id: string; platform: PlatformType }[]> {
    const accounts = await linkedAccountRepository.findAllLinked();

    return accounts.map((account) => ({
      id: account.id,
      platform: account.platform as PlatformType,
    }));
  }

  async updateLastSyncTime(linkedAccountId: string): Promise<void> {
    const account = await linkedAccountRepository.findById(linkedAccountId);
    if (account) {
      logger.info("Updated last sync time", { accountId: linkedAccountId });
    }
  }
}

export const accountSyncService = new AccountSyncService();
