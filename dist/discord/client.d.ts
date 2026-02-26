import { Client, REST, Collection, Guild, User, DMChannel, GuildMember } from 'discord.js';
export declare class ClipVaultClient extends Client {
    rest: REST;
    commands: Collection<string, unknown>;
    constructor();
    login(): Promise<string>;
    getUser(discordId: string): Promise<User | null>;
    sendDM(userId: string, content: string): Promise<DMChannel | null>;
    getGuild(guildId: string): Promise<Guild | null>;
    getGuildMember(guildId: string, userId: string): Promise<GuildMember | null>;
}
export declare const discordClient: ClipVaultClient;
//# sourceMappingURL=client.d.ts.map