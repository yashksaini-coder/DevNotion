import PQueue from 'p-queue';
import pRetry from 'p-retry';

export interface RateLimiterOptions {
  /** Max concurrent requests */
  concurrency: number;
  /** Interval window in ms */
  intervalMs: number;
  /** Max requests per interval window */
  intervalCap?: number;
  /** Retry attempts on transient failure */
  retries?: number;
}

export type RateLimitedFn = <T>(fn: () => Promise<T>) => Promise<T>;

/**
 * Factory that creates a shared rate-limited + retry wrapper.
 * Use one instance per API service to avoid cross-service interference.
 */
export function createRateLimiter(opts: RateLimiterOptions): RateLimitedFn {
  const queue = new PQueue({
    concurrency: opts.concurrency,
    interval: opts.intervalMs,
    intervalCap: opts.intervalCap ?? 1,
  });

  return function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
    return queue.add(() =>
      pRetry(fn, {
        retries: opts.retries ?? 3,
        onFailedAttempt: (err) => {
          console.warn(
            `Rate limiter: attempt ${err.attemptNumber} failed — ${err.message}. Retrying...`,
          );
        },
      }),
    ) as Promise<T>;
  };
}

// Pre-built limiters for each API service
export const notionLimiter = createRateLimiter({ concurrency: 1, intervalMs: 334 });
export const devtoLimiter = createRateLimiter({ concurrency: 1, intervalMs: 1000 });
export const hashnodeLimiter = createRateLimiter({ concurrency: 1, intervalMs: 500 });
export const githubLimiter = createRateLimiter({ concurrency: 1, intervalMs: 250 });
