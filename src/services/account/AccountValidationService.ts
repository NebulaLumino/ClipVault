import { linkedAccountRepository } from "../../db/repositories/LinkedAccountRepository.js";
import { logger } from "../../utils/logger.js";
import type { PlatformType } from "../../types/index.js";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class AccountValidationService {
  async validatePlatformAccount(
    platform: PlatformType,
    platformAccountId: string,
  ): Promise<ValidationResult> {
    switch (platform) {
      case "steam":
        return this.validateSteamAccount(platformAccountId);
      case "riot":
        return this.validateRiotAccount(platformAccountId);
      case "epic":
        return this.validateEpicAccount(platformAccountId);
      default:
        return { valid: false, error: `Unsupported platform: ${platform}` };
    }
  }

  private async validateSteamAccount(
    steamId: string,
  ): Promise<ValidationResult> {
    if (!this.isValidSteam64Id(steamId)) {
      return { valid: false, error: "Invalid Steam64 ID format" };
    }

    return { valid: true };
  }

  private async validateRiotAccount(puuid: string): Promise<ValidationResult> {
    if (!this.isValidRiotPUUID(puuid)) {
      return { valid: false, error: "Invalid Riot PUUID format" };
    }

    return { valid: true };
  }

  private async validateEpicAccount(epicId: string): Promise<ValidationResult> {
    if (!this.isValidEpicId(epicId)) {
      return { valid: false, error: "Invalid Epic Account ID format" };
    }

    return { valid: true };
  }

  private isValidSteam64Id(steamId: string): boolean {
    return /^\d{17}$/.test(steamId);
  }

  private isValidRiotPUUID(puuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(puuid);
  }

  private isValidEpicId(epicId: string): boolean {
    return /^[0-9a-f]{32}$/.test(epicId);
  }

  async checkAccountOwnership(
    discordUserId: string,
    platform: PlatformType,
    platformAccountId: string,
  ): Promise<boolean> {
    const user = await linkedAccountRepository.findByUserIdAndPlatform(
      discordUserId as string,
      platform,
    );
    if (!user) {
      return false;
    }
    return user.platformAccountId === platformAccountId;
  }

  async isAccountAlreadyLinked(
    platform: PlatformType,
    platformAccountId: string,
  ): Promise<boolean> {
    const existing = await linkedAccountRepository.findByPlatformAndAccountId(
      platform,
      platformAccountId,
    );
    return existing !== null;
  }

  async validateOAuthTokens(
    linkedAccountId: string,
  ): Promise<ValidationResult> {
    const account = await linkedAccountRepository.findById(linkedAccountId);
    if (!account) {
      return { valid: false, error: "Account not found" };
    }

    if (!account.accessToken) {
      return { valid: false, error: "No access token" };
    }

    if (account.tokenExpiry && new Date(account.tokenExpiry) < new Date()) {
      return { valid: false, error: "Access token expired" };
    }

    return { valid: true };
  }
}

export const accountValidationService = new AccountValidationService();
