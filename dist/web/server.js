import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
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
fastify.get('/oauth/steam/callback', async (request, reply) => {
    const { code, state, steamId } = request.query;
    if (!code || !state) {
        return reply.status(400).send({ error: 'Missing code or state' });
    }
    try {
        const userId = state;
        await accountService.linkAccount(userId, PlatformType.STEAM, steamId, undefined, code);
        return reply.redirect(`${config.OAUTH_REDIRECT_BASE}/linked?platform=steam`);
    }
    catch (error) {
        logger.error('Steam OAuth callback error', { error: String(error) });
        return reply.status(500).send({ error: 'Failed to link account' });
    }
});
fastify.get('/oauth/riot/callback', async (request, reply) => {
    const { code, state } = request.query;
    if (!code || !state) {
        return reply.status(400).send({ error: 'Missing code or state' });
    }
    try {
        const userId = state;
        await accountService.linkAccount(userId, PlatformType.RIOT, code, undefined, code);
        return reply.redirect(`${config.OAUTH_REDIRECT_BASE}/linked?platform=riot`);
    }
    catch (error) {
        logger.error('Riot OAuth callback error', { error: String(error) });
        return reply.status(500).send({ error: 'Failed to link account' });
    }
});
fastify.get('/oauth/epic/callback', async (request, reply) => {
    const { code, state, epicId } = request.query;
    if (!code || !state) {
        return reply.status(400).send({ error: 'Missing code or state' });
    }
    try {
        const userId = state;
        await accountService.linkAccount(userId, PlatformType.EPIC, epicId, undefined, code);
        return reply.redirect(`${config.OAUTH_REDIRECT_BASE}/linked?platform=epic`);
    }
    catch (error) {
        logger.error('Epic OAuth callback error', { error: String(error) });
        return reply.status(500).send({ error: 'Failed to link account' });
    }
});
// Allstar webhook handler
fastify.post('/webhooks/allstar', async (request, reply) => {
    const body = request.body;
    logger.debug('Allstar webhook received', body);
    const eventType = body.event;
    const clipId = body.clipId;
    const status = body.status;
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
export async function startWebServer() {
    // Try primary port first, fall back to alternative if in use
    const portsToTry = [config.PORT, config.PORT + 1, config.PORT + 2];
    for (const port of portsToTry) {
        try {
            await fastify.listen({ port, host: '0.0.0.0' });
            logger.info(`Web server listening on port ${port}`);
            return fastify;
        }
        catch (err) {
            const error = err;
            if (error.code === 'EADDRINUSE') {
                logger.warn(`Port ${port} in use, trying next port`);
                continue;
            }
            logger.error('Failed to start web server', { error: String(err) });
            throw err;
        }
    }
    throw new Error('No available ports found');
}
export { fastify };
//# sourceMappingURL=server.js.map