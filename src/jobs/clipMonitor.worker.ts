import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger.js';
import { clipService } from '../services/ClipService.js';
import { allstarClient } from '../integrations/allstar/AllstarClient.js';
import { ClipStatus } from '../types/index.js';
import type { ClipMonitorJobData } from '../types/index.js';

function mapAllstarStatusToClipStatus(status: string): ClipStatus {
  switch (status.toLowerCase()) {
    case 'requested':
      return ClipStatus.REQUESTED;
    case 'processing':
      return ClipStatus.PROCESSING;
    case 'ready':
      return ClipStatus.READY;
    case 'delivered':
      return ClipStatus.DELIVERED;
    case 'failed':
      return ClipStatus.FAILED;
    case 'expired':
      return ClipStatus.EXPIRED;
    default:
      return ClipStatus.PROCESSING;
  }
}

export function createClipMonitorWorker() {
  const worker = new Worker<ClipMonitorJobData>(
    'clip-monitor',
    async (job: Job<ClipMonitorJobData>) => {
      const { clipId, matchId } = job.data;

      logger.info('Processing clip monitor job', {
        jobId: job.id,
        clipId,
        matchId,
      });

      try {
        // Get clip record
        const clip = await clipService.getClipById(clipId);
        if (!clip) {
          logger.warn('Clip not found', { clipId });
          return { status: 'skipped', reason: 'clip_not_found' };
        }

        // Check if clip is already ready
        if (clip.status === ClipStatus.READY || clip.status === ClipStatus.DELIVERED) {
          logger.info('Clip already ready', { clipId, status: clip.status });
          return { status: 'skipped', reason: 'clip_already_ready' };
        }

        // Poll Allstar for clip status
        const clipStatus = await allstarClient.getClipStatus(clip.allstarClipId);
        const mappedStatus = mapAllstarStatusToClipStatus(clipStatus.status);

        // Update clip record
        await clipService.updateClipStatus(clipId, mappedStatus, {
          videoUrl: clipStatus.videoUrl,
          thumbnailUrl: clipStatus.thumbnailUrl,
          duration: clipStatus.duration,
        });

        logger.info('Clip status updated', {
          clipId,
          newStatus: mappedStatus,
        });

        // If clip is ready, queue for delivery
        if (mappedStatus === ClipStatus.READY) {
          const { clipDeliveryQueue } = await import('./queue.js');
          await clipDeliveryQueue.add('deliver-clip', {
            clipId,
            matchId,
          });
          
          logger.info('Clip ready, queued for delivery', { clipId });
        }

        return {
          status: 'completed',
          currentStatus: mappedStatus,
        };
      } catch (error) {
        logger.error('Clip monitor job failed', {
          jobId: job.id,
          clipId,
          error: String(error),
        });
        
        throw error;
      }
    },
    {
      concurrency: 5,
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info('Clip monitor job completed', {
      jobId: job.id,
      result: job.returnvalue,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Clip monitor job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  return worker;
}
