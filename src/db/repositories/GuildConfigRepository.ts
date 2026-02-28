import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";

export interface GuildConfigData {
  guildId: string;
  feedChannelId?: string | null;
  adminRoleId?: string | null;
  isActive?: boolean;
}

export interface UpdateGuildConfigData {
  feedChannelId?: string | null;
  adminRoleId?: string | null;
  isActive?: boolean;
}

export interface GuildConfigRecord {
  id: string;
  guildId: string;
  feedChannelId: string | null;
  adminRoleId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GuildConfigRepository {
  async create(data: GuildConfigData): Promise<GuildConfigRecord> {
    const result = await prisma.$queryRaw<GuildConfigRecord[]>`
      INSERT INTO "GuildConfig" (id, "guildId", "feedChannelId", "adminRoleId", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${data.guildId}, ${data.feedChannelId ?? null}, ${data.adminRoleId ?? null}, ${data.isActive ?? true}, NOW(), NOW())
      RETURNING *
    `;
    return result[0];
  }

  async findByGuildId(guildId: string): Promise<GuildConfigRecord | null> {
    const results = await prisma.$queryRaw<GuildConfigRecord[]>`
      SELECT * FROM "GuildConfig" WHERE "guildId" = ${guildId} LIMIT 1
    `;
    return results[0] ?? null;
  }

  async findAll(): Promise<GuildConfigRecord[]> {
    return prisma.$queryRaw<GuildConfigRecord[]>`
      SELECT * FROM "GuildConfig" WHERE "isActive" = true
    `;
  }

  async findAllWithFeedChannel(): Promise<GuildConfigRecord[]> {
    return prisma.$queryRaw<GuildConfigRecord[]>`
      SELECT * FROM "GuildConfig" WHERE "feedChannelId" IS NOT NULL AND "isActive" = true
    `;
  }

  async upsert(data: GuildConfigData): Promise<GuildConfigRecord> {
    const existing = await this.findByGuildId(data.guildId);

    if (existing) {
      return this.update(data.guildId, data);
    }

    return this.create(data);
  }

  async update(
    guildId: string,
    data: UpdateGuildConfigData,
  ): Promise<GuildConfigRecord> {
    const existing = await this.findByGuildId(guildId);
    if (!existing) {
      return this.create({ guildId, ...data });
    }

    const feedChannelId =
      data.feedChannelId !== undefined
        ? data.feedChannelId
        : existing.feedChannelId;
    const adminRoleId =
      data.adminRoleId !== undefined ? data.adminRoleId : existing.adminRoleId;
    const isActive =
      data.isActive !== undefined ? data.isActive : existing.isActive;

    const result = await prisma.$queryRaw<GuildConfigRecord[]>`
      UPDATE "GuildConfig" 
      SET "feedChannelId" = ${feedChannelId},
          "adminRoleId" = ${adminRoleId},
          "isActive" = ${isActive},
          "updatedAt" = NOW()
      WHERE "guildId" = ${guildId}
      RETURNING *
    `;
    return result[0];
  }

  async delete(guildId: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM "GuildConfig" WHERE "guildId" = ${guildId}
    `;
  }

  async setFeedChannel(
    guildId: string,
    channelId: string | null,
  ): Promise<GuildConfigRecord> {
    return this.upsert({ guildId, feedChannelId: channelId });
  }

  async setAdminRole(
    guildId: string,
    roleId: string | null,
  ): Promise<GuildConfigRecord> {
    return this.upsert({ guildId, adminRoleId: roleId });
  }

  async isAdmin(
    guildId: string,
    _userId: string,
    roleIds: string[],
  ): Promise<boolean> {
    const config = await this.findByGuildId(guildId);
    if (!config?.adminRoleId) {
      return false;
    }
    return roleIds.includes(config.adminRoleId);
  }
}

export const guildConfigRepository = new GuildConfigRepository();
