import { logger } from '../utils/logger.js';
import { accountService } from '../services/AccountService.js';
import { matchPollQueue, clipRequestQueue } from './queue.js';
import { matchService } from '../services/MatchService.js';

const POLL_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Polls all linked accounts for new matches, then enqueues
 * clip requests for any newly detected matches.
 */
async function pollAllAccounts(): Promise<void> {
  try {
    const accounts = await accountService.getAccountsToPoll();

    if (accounts.length === 0) {
      return;
    }

    logger.info('Scheduler: polling accounts', { count: accounts.length });

    for (const account of accounts) {
      await matchPollQueue.add(
        'match-poll',
        {
          linkedAccountId: account.id,
          platform: account.platform,
          platformAccountId: account.platformAccountId,
        },
        {
          jobId: `poll-${account.id}-${Date.now()}`,
        }
      );
    }
  } catch (error) {
    logger.error('Scheduler: poll cycle failed', { error: String(error) });
  }
}

/**
 * Checks for matches in DETECTED status that don't have clip requests yet,
 * and enqueues clip request jobs for them.
 */
async function processDetectedMatches(): Promise<void> {
  try {
    const pendingMatches = await matchService.getPendingMatches();

    if (pendingMatches.length === 0) {
      return;
    }

    logger.info('Scheduler: processing detected matches', { count: pendingMatches.length });

    for (const match of pendingMatches) {
      await clipRequestQueue.add(
        'clip-request',
        {
          matchId: match.id,
          userId: match.userId,
          platform: match.platform,
          platformAccountId: match.platformMatchId,
          platformMatchId: match.platformMatchId,
          gameTitle: match.gameTitle,
        },
        {
          jobId: `clip-req-${match.id}`,
        }
      );

      // Mark as processing so we don't re-enqueue
      await matchService.markMatchProcessing(match.id);
    }
  } catch (error) {
    logger.error('Scheduler: detected match processing failed', { error: String(error) });
  }
}

/**
 * Single scheduler tick — runs poll + detected match processing.
 */
async function schedulerTick(): Promise<void> {
  await pollAllAccounts();
  await processDetectedMatches();
}

/**
 * Starts the background scheduler.
 */
export function startScheduler(): void {
  logger.info('Starting match poll scheduler', { intervalMs: POLL_INTERVAL_MS });

  // Run immediately on startup
  schedulerTick();

  // Then run on interval
  schedulerInterval = setInterval(schedulerTick, POLL_INTERVAL_MS);
}

/**
 * Stops the background scheduler.
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Match poll scheduler stopped');
  }
}
