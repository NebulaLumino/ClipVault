import { Worker } from 'bullmq';
import { logger } from '../utils/logger.js';
import { accountService } from '../services/AccountService.js';
import { matchService } from '../services/MatchService.js';
import { PlatformType } from '../types/index.js';
export function createMatchPollWorker() {
    const worker = new Worker('match-poll', async (job) => {
        const { linkedAccountId, platform, platformAccountId } = job.data;
        logger.info('Processing match poll job', {
            jobId: job.id,
            linkedAccountId,
            platform,
            platformAccountId,
        });
        try {
            // Get account with polling state
            const account = await accountService.getLinkedAccountById(linkedAccountId);
            if (!account) {
                logger.warn('Linked account not found', { linkedAccountId });
                return { status: 'skipped', reason: 'account_not_found' };
            }
            if (!account.pollState?.pollingEnabled) {
                logger.info('Polling disabled for account', { linkedAccountId });
                return { status: 'skipped', reason: 'polling_disabled' };
            }
            // Get recent matches based on platform
            let platformEnum;
            if (platform === 'steam') {
                platformEnum = PlatformType.STEAM;
            }
            else if (platform === 'riot') {
                platformEnum = PlatformType.RIOT;
            }
            else if (platform === 'epic') {
                platformEnum = PlatformType.EPIC;
            }
            else {
                platformEnum = PlatformType.STEAM;
            }
            const recentMatches = await accountService.getRecentMatches(platformEnum, platformAccountId);
            // Check for new matches
            const lastMatchId = account.pollState?.lastMatchId;
            const newMatches = recentMatches.filter((m) => m.matchId !== lastMatchId);
            if (newMatches.length > 0) {
                logger.info('Found new matches', {
                    linkedAccountId,
                    newMatchCount: newMatches.length,
                });
                // Determine game title based on platform
                let gameTitle;
                switch (platform) {
                    case 'steam':
                        gameTitle = "cs2" /* GamePlatform.CS2 */; // Could also be Dota2
                        break;
                    case 'riot':
                        gameTitle = "lol" /* GamePlatform.LEAGUE_OF_LEGENDS */;
                        break;
                    case 'epic':
                        gameTitle = "fortnite" /* GamePlatform.FORTNITE */;
                        break;
                    default:
                        gameTitle = "cs2" /* GamePlatform.CS2 */;
                }
                // Create match records
                for (const match of newMatches) {
                    await matchService.createMatch(account.userId, platformEnum, gameTitle, match.matchId, match.matchId);
                }
                // Update poll state with latest match
                await accountService.updatePollState(linkedAccountId, {
                    lastMatchId: newMatches[0].matchId,
                });
            }
            return {
                status: 'completed',
                matchesFound: newMatches.length,
            };
        }
        catch (error) {
            logger.error('Match poll job failed', {
                jobId: job.id,
                linkedAccountId,
                error: String(error),
            });
            throw error;
        }
    }, {
        concurrency: 5,
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        },
    });
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
//# sourceMappingURL=matchPoll.worker.js.map