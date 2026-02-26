import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should have valid schema for required environment variables', async () => {
    // Set required env vars
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/clipvault');
    vi.stubEnv('DISCORD_CLIENT_ID', '123456789');
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-token');

    const { config } = await import('../../../src/config/index.js');
    
    expect(config.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/clipvault');
    expect(config.DISCORD_CLIENT_ID).toBe('123456789');
    expect(config.DISCORD_CLIENT_SECRET).toBe('test-secret');
    expect(config.DISCORD_BOT_TOKEN).toBe('test-token');
  });

  it('should use default values for optional env vars', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/clipvault');
    vi.stubEnv('DISCORD_CLIENT_ID', '123456789');
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-token');
    vi.stubEnv('NODE_ENV', 'development');

    const { config } = await import('../../../src/config/index.js');
    
    expect(config.REDIS_HOST).toBe('localhost');
    expect(config.REDIS_PORT).toBe(6379);
    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('development');
  });

  it('should use custom values when provided', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/clipvault');
    vi.stubEnv('DISCORD_CLIENT_ID', '123456789');
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-token');
    vi.stubEnv('REDIS_HOST', 'custom-redis');
    vi.stubEnv('REDIS_PORT', '6380');
    vi.stubEnv('PORT', '4000');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOG_LEVEL', 'debug');
    vi.stubEnv('STEAM_API_KEY', 'steam-key');
    vi.stubEnv('RIOT_API_KEY', 'riot-key');

    const { config } = await import('../../../src/config/index.js');
    
    expect(config.REDIS_HOST).toBe('custom-redis');
    expect(config.REDIS_PORT).toBe(6380);
    expect(config.PORT).toBe(4000);
    expect(config.NODE_ENV).toBe('production');
    expect(config.LOG_LEVEL).toBe('debug');
    expect(config.STEAM_API_KEY).toBe('steam-key');
    expect(config.RIOT_API_KEY).toBe('riot-key');
  });

  it('should use OAUTH_REDIRECT_BASE default', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/clipvault');
    vi.stubEnv('DISCORD_CLIENT_ID', '123456789');
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-token');

    const { config } = await import('../../../src/config/index.js');
    
    expect(config.OAUTH_REDIRECT_BASE).toBe('http://localhost:3000');
  });
});
