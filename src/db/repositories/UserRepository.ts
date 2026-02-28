import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import type {
  User,
  LinkedAccount,
  MatchRecord,
  ClipRecord,
  DeliveryRecord,
} from "@prisma/client";

export interface CreateUserData {
  discordId: string;
  username?: string;
  globalName?: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  username?: string;
  globalName?: string;
  avatarUrl?: string;
  preferences?: Record<string, unknown>;
}

export class UserRepository {
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        discordId: data.discordId,
        username: data.username,
        globalName: data.globalName,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  async findByDiscordId(discordId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { discordId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        globalName: data.globalName,
        avatarUrl: data.avatarUrl,
        preferences: data.preferences as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findByDiscordIdWithRelations(
    discordId: string,
  ): Promise<(User & { linkedAccounts: LinkedAccount[] }) | null> {
    return prisma.user.findUnique({
      where: { discordId },
      include: {
        linkedAccounts: true,
      },
    });
  }

  async findAllWithLinkedAccounts(): Promise<
    (User & { linkedAccounts: LinkedAccount[] })[]
  > {
    return prisma.user.findMany({
      include: {
        linkedAccounts: true,
      },
    });
  }

  async findOrCreate(discordId: string): Promise<User> {
    const existing = await this.findByDiscordId(discordId);
    if (existing) {
      return existing;
    }
    return this.create({ discordId });
  }
}

export const userRepository = new UserRepository();
