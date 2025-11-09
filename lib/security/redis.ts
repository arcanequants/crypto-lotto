/**
 * Redis Utilities for Security
 *
 * Provides:
 * - Distributed locks (prevent race conditions)
 * - Rate limiting (prevent DoS attacks)
 *
 * Uses Upstash Redis (serverless, edge-compatible)
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ============ REDIS CLIENT ============

/**
 * Upstash Redis client
 *
 * Setup:
 * 1. Create Upstash account: https://upstash.com
 * 2. Create Redis database
 * 3. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://...
 *    UPSTASH_REDIS_REST_TOKEN=...
 */
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Missing Redis credentials. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local'
      );
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

// ============ DISTRIBUTED LOCKS ============

export interface LockOptions {
  ttl?: number; // Time to live in seconds (default: 10s)
  retries?: number; // Number of retry attempts (default: 0)
  retryDelay?: number; // Delay between retries in ms (default: 100ms)
}

export interface Lock {
  acquired: boolean;
  release: () => Promise<void>;
}

/**
 * Acquire distributed lock
 *
 * Use case: Prevent race conditions on nonce validation
 *
 * Example:
 * ```typescript
 * const lock = await acquireLock('nonce-lock:0x123...', { ttl: 10 });
 * if (!lock.acquired) {
 *   return { error: 'Purchase in progress' };
 * }
 * try {
 *   // Critical section (validate nonce + execute TX)
 * } finally {
 *   await lock.release();
 * }
 * ```
 */
export async function acquireLock(
  key: string,
  options: LockOptions = {}
): Promise<Lock> {
  const redis = getRedisClient();
  const ttl = options.ttl || 10;
  const retries = options.retries || 0;
  const retryDelay = options.retryDelay || 100;

  let acquired = false;
  let attempts = 0;

  while (!acquired && attempts <= retries) {
    // Try to set key with NX (only if not exists)
    const result = await redis.set(key, '1', { nx: true, ex: ttl });
    acquired = result === 'OK';

    if (!acquired && attempts < retries) {
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    attempts++;
  }

  return {
    acquired,
    release: async () => {
      if (acquired) {
        await redis.del(key);
      }
    },
  };
}

/**
 * Execute function with lock
 *
 * Automatically acquires lock, executes function, and releases lock
 *
 * Example:
 * ```typescript
 * const result = await withLock('nonce-lock:0x123...', async () => {
 *   // Critical section
 *   return await processTransaction();
 * });
 * ```
 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: LockOptions = {}
): Promise<T | null> {
  const lock = await acquireLock(key, options);

  if (!lock.acquired) {
    return null; // Lock not acquired
  }

  try {
    return await fn();
  } finally {
    await lock.release();
  }
}

// ============ RATE LIMITING ============

/**
 * Rate limiter for gasless API endpoint
 *
 * Limits: 10 requests per minute per user address
 *
 * Uses sliding window algorithm for accuracy
 */
let gaslessRateLimiter: Ratelimit | null = null;

export function getGaslessRateLimiter(): Ratelimit {
  if (!gaslessRateLimiter) {
    const redis = getRedisClient();

    gaslessRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
      analytics: true, // Track usage analytics
      prefix: 'ratelimit:gasless',
    });
  }

  return gaslessRateLimiter;
}

/**
 * Check rate limit for address
 *
 * Returns:
 * - success: true if request is allowed
 * - limit: max requests per window
 * - remaining: requests remaining in current window
 * - reset: timestamp when window resets (ms)
 *
 * Example:
 * ```typescript
 * const { success, remaining, reset } = await checkGaslessRateLimit(buyer);
 * if (!success) {
 *   return NextResponse.json({
 *     error: 'Rate limit exceeded',
 *     retryAfter: new Date(reset).toISOString(),
 *   }, { status: 429 });
 * }
 * ```
 */
export async function checkGaslessRateLimit(address: string) {
  const limiter = getGaslessRateLimiter();
  const identifier = address.toLowerCase(); // Normalize address

  return await limiter.limit(identifier);
}

// ============ UTILITY FUNCTIONS ============

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Connection test failed:', error);
    return false;
  }
}
