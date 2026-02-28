export const DISCORD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25MB
  MAX_EMBEDS_PER_MESSAGE: 10,
  MAX_FILE_SIZE_NITRO: 50 * 1024 * 1024, // 50MB (Nitro)
  DM_RATE_LIMIT_PER_SECOND: 5,
  DM_RATE_LIMIT_PER_MINUTE: 10,
} as const;

export const EMBED_COLORS = {
  DEFAULT: 0x5865f2,
  SUCCESS: 0x57f287,
  ERROR: 0xed4245,
  WARNING: 0xfee75c,
  INFO: 0x3498db,
  CS2: 0xf7931a,
  LOL: 0xc89b3c,
  DOTA2: 0xe44c2a,
  FORTNITE: 0x9d4db8,
} as const;

export const POLLING_CONFIG = {
  DEFAULT_INTERVAL_MS: 60_000,
  MIN_INTERVAL_MS: 30_000,
  MAX_INTERVAL_MS: 300_000,
  BATCH_SIZE: 50,
  NUM_SLOTS: 60,
  ACTIVE_USER_INTERVAL_MS: 120_000,
  RECENT_USER_INTERVAL_MS: 300_000,
  INACTIVE_USER_INTERVAL_MS: 900_000,
} as const;

export const CLIP_PROCESSING_TIMES = {
  cs2: 30 * 60 * 1000,
  lol: 15 * 60 * 1000,
  dota2: 20 * 60 * 1000,
  fortnite: 10 * 60 * 1000,
} as const;

export const BACKOFF_CONFIG = {
  INITIAL_DELAY_MS: 60_000,
  MAX_DELAY_MS: 3600_000,
  MULTIPLIER: 2,
  JITTER: 0.1,
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
} as const;

export const ALLSTAR_CONFIG = {
  CLIP_URL_TEMPLATE: "https://allstar.gg/clip?clip={clipId}",
  IFRAME_URL_TEMPLATE: "https://allstar.gg/iframe?clip={clipId}",
  CLAIM_URL_TEMPLATE:
    "https://allstar.gg/partner/claim/{partnerName}?steamid64={steamId}",
  MAX_CLIPS_PER_MATCH: 20,
} as const;

export const QUEUE_NAMES = {
  MATCH_POLL: "match-poll",
  CLIP_REQUEST: "clip-request",
  CLIP_MONITOR: "clip-monitor",
  CLIP_DELIVER: "clip-deliver",
  ACCOUNT_SYNC: "account-sync",
} as const;

export const CACHE_KEYS = {
  RATE_LIMIT: "ratelimit:",
  POLL_STATE: "pollstate:",
  USER_SESSION: "session:",
  OAUTH_STATE: "oauth:state:",
} as const;

export const API_ENDPOINTS = {
  STEAM_BASE: "https://api.steampowered.com",
  RIOT_BASE: "https://americas.api.riotgames.com",
  OPENDOTA_BASE: "https://api.opendota.com/api",
  FORTNITE_API_BASE: "https://fortniteapi.io",
} as const;

export const MATCH_STATUS_TIMESTAMPS = {
  DETECTED: "detectedAt",
  CLIPS_REQUESTED: "clipsRequestedAt",
  CLIPS_READY: "clipsReadyAt",
  DELIVERED: "deliveredAt",
} as const;

export const REQUIRED_DISCORD_INTENTS = [
  "Guilds",
  "GuildMembers",
  "DirectMessages",
] as const;

export const DEFAULT_POLL_INTERVAL = POLLING_CONFIG.DEFAULT_INTERVAL_MS;
export const DEFAULT_BATCH_SIZE = POLLING_CONFIG.BATCH_SIZE;
