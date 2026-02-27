import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger.js';
import { deliveryService } from '../services/DeliveryService.js';
import type { ClipDeliveryJobData } from '../types/index.js';

export function createClipDeliveryWorker() {
  const worker = new Worker<ClipDeliveryJobData>(
    'clip-delivery',
    async (job: Job<ClipDeliveryJobData>) => {
      const { clipId, userId } = job.data;

      logger.info('Processing clip delivery job', {
        jobId: job.id,
        clipId,
        userId,
      });

      try {
        // Attempt delivery
        const success = await deliveryService.deliverClip(clipId, userId);

        if (!success) {
          logger.warn('Clip delivery failed', { clipId, userId });
          // Don't throw - let the job retry based on queue settings
          return { status: 'failed', reason: 'delivery_failed' };
        }

        logger.info('Clip delivered successfully', {
          jobId: job.id,
          clipId,
          userId,
        });

        return {
          status: 'completed',
          delivered: true,
        };
      } catch (error) {
        logger.error('Clip delivery job failed', {
          jobId: job.id,
          clipId,
          userId,
          error: String(error),
        });
        
        throw error;
      }
    },
    {
      concurrency: 3,
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info('Clip delivery job completed', {
      jobId: job.id,
      result: job.returnvalue,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Clip delivery job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  return worker;
}
