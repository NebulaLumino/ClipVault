import { Queue, Worker } from 'bullmq';
import redis from '../db/redis.js';
import { logger } from '../utils/logger.js';

// Queue names
export const QUEUES = {
  MATCH_POLL: 'match-poll',
  CLIP_REQUEST: 'clip-request',
  CLIP_MONITOR: 'clip-monitor',
  CLIP_DELIVERY: 'clip-delivery',
} as const;

// Create queues
export const matchPollQueue = new Queue(QUEUES.MATCH_POLL, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const clipRequestQueue = new Queue(QUEUES.CLIP_REQUEST, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
  },
});

export const clipMonitorQueue = new Queue(QUEUES.CLIP_MONITOR, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 60000, // Start with 1 minute
    },
  },
});

export const clipDeliveryQueue = new Queue(QUEUES.CLIP_DELIVERY, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export async function closeQueues(): Promise<void> {
  await Promise.all([
    matchPollQueue.close(),
    clipRequestQueue.close(),
    clipMonitorQueue.close(),
    clipDeliveryQueue.close(),
  ]);
  logger.info('All queues closed');
}

// Health check
export async function checkQueueHealth(): Promise<Record<string, unknown>> {
  const [matchPoll, clipRequest, clipMonitor, clipDelivery] = await Promise.all([
    matchPollQueue.getJobCounts(),
    clipRequestQueue.getJobCounts(),
    clipMonitorQueue.getJobCounts(),
    clipDeliveryQueue.getJobCounts(),
  ]);

  return {
    matchPoll,
    clipRequest,
    clipMonitor,
    clipDelivery,
  };
}
