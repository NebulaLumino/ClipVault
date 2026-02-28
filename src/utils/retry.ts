import { logger } from "./logger.js";
import { AppError } from "./errors.js";

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  multiplier: 2,
  shouldRetry: (error: unknown) => {
    if (error instanceof AppError) {
      return error.statusCode >= 500 || error.statusCode === 429;
    }
    return true;
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = Math.min(
    options.initialDelayMs * Math.pow(options.multiplier, attempt),
    options.maxDelayMs,
  );
  const jitter = delay * 0.1;
  const jitterAmount = (Math.random() - 0.5) * 2 * jitter;
  return Math.max(0, Math.floor(delay + jitterAmount));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxRetries) {
        break;
      }

      if (opts.shouldRetry && !opts.shouldRetry(error)) {
        throw error;
      }

      const delay = calculateDelay(attempt, opts);

      logger.warn("Retrying after error", {
        attempt: attempt + 1,
        maxRetries: opts.maxRetries,
        delayMs: delay,
        error: String(error),
      });

      if (opts.onRetry) {
        opts.onRetry(error, attempt + 1);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

export function retryable<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: Partial<RetryOptions>,
): T {
  return ((...args: unknown[]) => withRetry(() => fn(...args), options)) as T;
}
