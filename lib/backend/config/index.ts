import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_BOT_TOKEN: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),

  OAUTH_REDIRECT_BASE: z.string().min(1).default('http://localhost:3000'),

  STEAM_API_KEY: z.string().optional(),

  RIOT_API_KEY: z.string().optional(),
  RIOT_CLIENT_ID: z.string().optional(),
  RIOT_CLIENT_SECRET: z.string().optional(),

  EPIC_CLIENT_ID: z.string().optional(),
  EPIC_CLIENT_SECRET: z.string().optional(),

  ALLSTAR_API_KEY: z.string().optional(),
  ALLSTAR_API_URL: z.string().min(1).default('https://api.allstar.gg'),
  ALLSTAR_PARTNER_NAME: z.string().optional(),

  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  PORT: z.coerce.number().default(3000),

  BACKEND_URL: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Invalid configuration:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
}

export const config = loadConfig();
