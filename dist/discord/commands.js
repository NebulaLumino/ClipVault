import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
export const linkCommand = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your gaming accounts to ClipVault')
    .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName('steam')
    .setDescription('Link your Steam account for CS2/Dota 2'))
    .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName('riot')
    .setDescription('Link your Riot account for League of Legends'))
    .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName('epic')
    .setDescription('Link your Epic Games account for Fortnite'));
export const unlinkCommand = new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlink your gaming accounts from ClipVault')
    .addStringOption((option) => option
    .setName('platform')
    .setDescription('Platform to unlink')
    .setRequired(true)
    .addChoices({ name: 'Steam', value: 'steam' }, { name: 'Riot', value: 'riot' }, { name: 'Epic Games', value: 'epic' }));
export const settingsCommand = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure your ClipVault preferences')
    .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName('view')
    .setDescription('View your current settings'))
    .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName('delivery')
    .setDescription('Set delivery method')
    .addStringOption((option) => option
    .setName('method')
    .setDescription('How to receive clips')
    .setRequired(true)
    .addChoices({ name: 'Direct Message', value: 'dm' }, { name: 'Server Channel', value: 'channel' })))
    .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName('quiet-hours')
    .setDescription('Set quiet hours')
    .addBooleanOption((option) => option
    .setName('enabled')
    .setDescription('Enable quiet hours')
    .setRequired(true))
    .addStringOption((option) => option
    .setName('start')
    .setDescription('Start time (HH:MM)'))
    .addStringOption((option) => option
    .setName('end')
    .setDescription('End time (HH:MM)')))
    .addSubcommand(new SlashCommandSubcommandBuilder()
    .setName('clip-types')
    .setDescription('Set preferred clip types')
    .addStringOption((option) => option
    .setName('types')
    .setDescription('Comma-separated clip types')
    .setRequired(true)));
export const statusCommand = new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check your linked accounts and recent activity');
export const historyCommand = new SlashCommandBuilder()
    .setName('history')
    .setDescription('View your clip delivery history')
    .addIntegerOption((option) => option
    .setName('limit')
    .setDescription('Number of entries to show')
    .setMinValue(1)
    .setMaxValue(50));
export const helpCommand = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with ClipVault commands');
export const allCommands = [
    linkCommand,
    unlinkCommand,
    settingsCommand,
    statusCommand,
    historyCommand,
    helpCommand,
];
//# sourceMappingURL=commands.js.map