/**
 * CRITICAL FIX C-10: CRON Job Idempotency
 * =========================================
 * Prevents duplicate execution of CRON jobs using PostgreSQL advisory locks
 *
 * CVSS: 9.0/10 (CRITICAL)
 *
 * VULNERABILITY:
 * - Multiple CRON instances could execute simultaneously
 * - Leads to: duplicate draws, duplicate payments, data corruption
 *
 * FIX:
 * - Distributed locks using PostgreSQL advisory locks
 * - Execution tracking table
 * - Automatic stale lock cleanup
 * - Comprehensive audit trail
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logging/logger';
import crypto from 'crypto';

export interface CronLockResult {
  acquired: boolean;
  execution_uuid: string | null;
  message: string;
}

export interface CronExecutionStats {
  job_name: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  running_executions: number;
  avg_duration_seconds: number;
  last_execution_at: string;
  last_status: 'running' | 'completed' | 'failed';
}

/**
 * Acquire distributed lock for CRON job
 *
 * @param jobName - Name of the CRON job (e.g., 'execute-daily-draw')
 * @param timeoutSeconds - Max execution time before considering stale (default: 5 minutes)
 * @returns Lock result with execution UUID if acquired
 *
 * @example
 * ```typescript
 * const lock = await acquireCronLock('execute-daily-draw');
 * if (!lock.acquired) {
 *   return NextResponse.json({ error: lock.message }, { status: 409 });
 * }
 *
 * try {
 *   // Execute job...
 *   await releaseCronLock(lock.execution_uuid!, 'completed');
 * } catch (error) {
 *   await releaseCronLock(lock.execution_uuid!, 'failed', error.message);
 * }
 * ```
 */
export async function acquireCronLock(
  jobName: string,
  timeoutSeconds: number = 300
): Promise<CronLockResult> {
  try {
    // Generate unique execution ID
    const executionId = `${jobName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    logger.info('Attempting to acquire CRON lock', {
      jobName,
      executionId,
      timeoutSeconds,
    });

    // Call PostgreSQL function to acquire lock
    const { data, error } = await supabase.rpc('acquire_cron_lock', {
      p_job_name: jobName,
      p_execution_id: executionId,
      p_timeout_seconds: timeoutSeconds,
    });

    if (error) {
      logger.error('Failed to acquire CRON lock', {
        jobName,
        error: error.message,
      });

      return {
        acquired: false,
        execution_uuid: null,
        message: `Database error: ${error.message}`,
      };
    }

    // Parse result (data is array with single row)
    const result = Array.isArray(data) ? data[0] : data;

    if (result.acquired) {
      logger.info('CRON lock acquired successfully', {
        jobName,
        executionUuid: result.execution_uuid,
      });
    } else {
      logger.warn('CRON lock not acquired', {
        jobName,
        reason: result.message,
      });
    }

    return {
      acquired: result.acquired,
      execution_uuid: result.execution_uuid,
      message: result.message,
    };
  } catch (error) {
    logger.error('Exception acquiring CRON lock', {
      jobName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      acquired: false,
      execution_uuid: null,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Release distributed lock and mark execution as completed/failed
 *
 * @param executionUuid - UUID returned from acquireCronLock
 * @param status - 'completed' or 'failed'
 * @param errorMessage - Error message if status is 'failed'
 * @param metadata - Optional metadata to store with execution
 * @returns True if released successfully
 *
 * @example
 * ```typescript
 * await releaseCronLock(executionUuid, 'completed', null, {
 *   draws_executed: 5,
 *   total_prizes: 1000
 * });
 * ```
 */
export async function releaseCronLock(
  executionUuid: string,
  status: 'completed' | 'failed' = 'completed',
  errorMessage: string | null = null,
  metadata: Record<string, any> | null = null
): Promise<boolean> {
  try {
    logger.info('Releasing CRON lock', {
      executionUuid,
      status,
      hasError: !!errorMessage,
    });

    const { data, error } = await supabase.rpc('release_cron_lock', {
      p_execution_uuid: executionUuid,
      p_status: status,
      p_error_message: errorMessage,
      p_metadata: metadata ? JSON.stringify(metadata) : null,
    });

    if (error) {
      logger.error('Failed to release CRON lock', {
        executionUuid,
        error: error.message,
      });
      return false;
    }

    logger.info('CRON lock released successfully', {
      executionUuid,
      status,
    });

    return true;
  } catch (error) {
    logger.error('Exception releasing CRON lock', {
      executionUuid,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return false;
  }
}

/**
 * Check if a CRON job is currently running
 *
 * @param jobName - Name of the CRON job
 * @returns True if job is currently locked/running
 *
 * @example
 * ```typescript
 * const isRunning = await isCronLocked('execute-daily-draw');
 * if (isRunning) {
 *   console.log('Job already running, skipping...');
 * }
 * ```
 */
export async function isCronLocked(jobName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_cron_locked', {
      p_job_name: jobName,
    });

    if (error) {
      logger.error('Failed to check CRON lock status', {
        jobName,
        error: error.message,
      });
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error('Exception checking CRON lock status', {
      jobName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return false;
  }
}

/**
 * Get execution statistics for CRON jobs
 *
 * @param jobName - Optional job name filter (null = all jobs)
 * @param hours - Hours to look back (default: 24)
 * @returns Execution statistics
 *
 * @example
 * ```typescript
 * const stats = await getCronExecutionStats('execute-daily-draw', 24);
 * console.log(`Success rate: ${stats[0].successful_executions / stats[0].total_executions * 100}%`);
 * ```
 */
export async function getCronExecutionStats(
  jobName: string | null = null,
  hours: number = 24
): Promise<CronExecutionStats[]> {
  try {
    const { data, error } = await supabase.rpc('get_cron_execution_stats', {
      p_job_name: jobName,
      p_hours: hours,
    });

    if (error) {
      logger.error('Failed to get CRON execution stats', {
        jobName,
        error: error.message,
      });
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Exception getting CRON execution stats', {
      jobName,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return [];
  }
}

/**
 * Higher-order function to wrap CRON handlers with idempotency
 *
 * @param jobName - Name of the CRON job
 * @param handler - Async function to execute
 * @param timeoutSeconds - Max execution time (default: 5 minutes)
 * @returns Wrapped handler with idempotency
 *
 * @example
 * ```typescript
 * export const GET = withCronIdempotency(
 *   'execute-daily-draw',
 *   async () => {
 *     // Your CRON job logic here
 *     const result = await executeDailyDraw();
 *     return { success: true, result };
 *   }
 * );
 * ```
 */
export function withCronIdempotency<T>(
  jobName: string,
  handler: () => Promise<T>,
  timeoutSeconds: number = 300
) {
  return async (): Promise<T | { error: string; message: string }> => {
    // Acquire lock
    const lock = await acquireCronLock(jobName, timeoutSeconds);

    if (!lock.acquired) {
      logger.warn('CRON job skipped - lock not acquired', {
        jobName,
        reason: lock.message,
      });

      return {
        error: 'Job already running',
        message: lock.message,
      } as any;
    }

    const startTime = Date.now();

    try {
      // Execute handler
      logger.info('Executing CRON job', {
        jobName,
        executionUuid: lock.execution_uuid,
      });

      const result = await handler();

      const executionTime = Date.now() - startTime;

      // Release lock with success
      await releaseCronLock(lock.execution_uuid!, 'completed', null, {
        execution_time_ms: executionTime,
      });

      logger.info('CRON job completed successfully', {
        jobName,
        executionUuid: lock.execution_uuid,
        executionTimeMs: executionTime,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('CRON job failed', {
        jobName,
        executionUuid: lock.execution_uuid,
        error: errorMessage,
        executionTimeMs: executionTime,
      });

      // Release lock with failure
      await releaseCronLock(lock.execution_uuid!, 'failed', errorMessage, {
        execution_time_ms: executionTime,
      });

      throw error;
    }
  };
}
