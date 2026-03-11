import { Worker, Job } from 'bullmq';
import { logger } from '../utils/logger.js';
import { matchDetectionService } from '../services/match/MatchDetectionService.js';
import type { MatchPollJobData } from '../types/index.js';

export function createMatchPollWorker() {
  const worker = new Worker<MatchPollJobData>(
    'match-poll',
    async (job: Job<MatchPollJobData>) => {
      const { linkedAccountId, platform, platformAccountId } = job.data;

      logger.info('Processing match poll job', {
        jobId: job.id,
        linkedAccountId,
        platform,
        platformAccountId,
      });

      try {
        const createdCount = await matchDetectionService.detectMatchesForAccount(linkedAccountId);

        return {
          status: 'completed',
          matchesFound: createdCount,
        };
      } catch (error) {
        logger.error('Match poll job failed', {
          jobId: job.id,
          linkedAccountId,
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
    logger.info('Match poll job completed', {
      jobId: job.id,
      result: job.returnvalue,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Match poll job failed', {
      jobId: job?.id,
      error: error.message,
    });
  });

  return worker;
}
