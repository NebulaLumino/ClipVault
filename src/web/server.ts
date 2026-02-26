import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { userService } from '../services/UserService.js';
import { accountService } from '../services/AccountService.js';
import { PlatformType } from '../types/index.js';

const fastify = Fastify({
  logger: false,
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(cookie);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// OAuth callback routes
fastify.get('/oauth/steam/callback', async (request: FastifyRequest, reply: FastifyReply) => {
  const { code, state, steamId } = request.query as Record<string, string>;
  
  if (!code || !state) {
    return reply.status(400).send({ error: 'Missing code or state' });
  }

  try {
    const userId = state;
    await accountService.linkAccount(
      userId,
      PlatformType.STEAM,
      steamId,
      undefined,
      code
    );
    
    return reply.redirect(`${config.OAUTH_REDIRECT_BASE}/linked?platform=steam`);
  } catch (error) {
    logger.error('Steam OAuth callback error', { error: String(error) });
    return reply.status(500).send({ error: 'Failed to link account' });
  }
});

fastify.get('/oauth/riot/callback', async (request: FastifyRequest, reply: FastifyReply) => {
  const { code, state } = request.query as Record<string, string>;
  
  if (!code || !state) {
    return reply.status(400).send({ error: 'Missing code or state' });
  }

  try {
    const userId = state;
    await accountService.linkAccount(
      userId,
      PlatformType.RIOT,
      code,
      undefined,
      code
    );
    
    return reply.redirect(`${config.OAUTH_REDIRECT_BASE}/linked?platform=riot`);
  } catch (error) {
    logger.error('Riot OAuth callback error', { error: String(error) });
    return reply.status(500).send({ error: 'Failed to link account' });
  }
});

fastify.get('/oauth/epic/callback', async (request: FastifyRequest, reply: FastifyReply) => {
  const { code, state, epicId } = request.query as Record<string, string>;
  
  if (!code || !state) {
    return reply.status(400).send({ error: 'Missing code or state' });
  }

  try {
    const userId = state;
    await accountService.linkAccount(
      userId,
      PlatformType.EPIC,
      epicId,
      undefined,
      code
    );
    
    return reply.redirect(`${config.OAUTH_REDIRECT_BASE}/linked?platform=epic`);
  } catch (error) {
    logger.error('Epic OAuth callback error', { error: String(error) });
    return reply.status(500).send({ error: 'Failed to link account' });
  }
});

// Allstar webhook handler
fastify.post('/webhooks/allstar', async (request: FastifyRequest, reply: FastifyReply) => {
  const body = request.body as Record<string, unknown>;
  
  logger.debug('Allstar webhook received', body);

  const eventType = body.event as string;
  const clipId = body.clipId as string;
  const status = body.status as string;

  if (eventType === 'clip.ready' && clipId) {
    logger.info('Clip ready from Allstar', { clipId, status });
    const { clipDeliveryQueue } = await import('../jobs/queue.js');
    await clipDeliveryQueue.add('deliver-clip', {
      clipId,
    });
  }

  return { received: true };
});

// Start server
export async function startWebServer(): Promise<typeof fastify> {
  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`Web server listening on port ${config.PORT}`);
    return fastify;
  } catch (err) {
    logger.error('Failed to start web server', { error: String(err) });
    throw err;
  }
}

export { fastify };
