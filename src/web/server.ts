import Fastify, { FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import prisma from '../db/prisma.js';
import { oauthRoutes } from './routes/oauth.js';

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
await oauthRoutes(fastify);

// Allstar webhook handler
fastify.post('/webhooks/allstar', async (request: FastifyRequest) => {
  const body = request.body as Record<string, unknown>;

  logger.debug('Allstar webhook received', body);

  const eventType = body.event as string;
  const clipId = body.clipId as string;
  const allstarClipId = body.allstarClipId as string || clipId;
  const status = body.status as string;

  if (eventType === 'clip.ready' && (clipId || allstarClipId)) {
    logger.info('Clip ready from Allstar', { clipId, allstarClipId, status });

    // Look up the clip record to get userId
    try {
      const clip = await prisma.clipRecord.findFirst({
        where: allstarClipId
          ? { allstarClipId }
          : { id: clipId },
      });

      if (clip) {
        // Update clip status to ready
        await prisma.clipRecord.update({
          where: { id: clip.id },
          data: {
            status: 'ready',
            readyAt: new Date(),
            videoUrl: (body.videoUrl as string) || clip.videoUrl,
            thumbnailUrl: (body.thumbnailUrl as string) || clip.thumbnailUrl,
          },
        });

        const { clipDeliveryQueue } = await import('../jobs/queue.js');
        await clipDeliveryQueue.add('deliver-clip', {
          clipId: clip.id,
          userId: clip.userId,
          matchId: clip.matchId,
        });
        logger.info('Queued clip delivery', { clipId: clip.id, userId: clip.userId });
      } else {
        logger.warn('Clip not found for webhook', { clipId, allstarClipId });
      }
    } catch (error) {
      logger.error('Failed to process Allstar webhook', { error: String(error) });
    }
  }

  return { received: true };
});

// Start server
export async function startWebServer(): Promise<typeof fastify> {
  // Try primary port first, fall back to alternative if in use
  const portsToTry = [config.PORT, config.PORT + 1, config.PORT + 2];
  
  for (const port of portsToTry) {
    try {
      await fastify.listen({ port, host: '0.0.0.0' });
      logger.info(`Web server listening on port ${port}`);
      return fastify;
    } catch (err: unknown) {
      const error = err as { code?: string };
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

