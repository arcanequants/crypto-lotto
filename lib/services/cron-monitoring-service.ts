// CRON MONITORING SERVICE
// Track CRON job executions for system health monitoring
// Powers the System Health section in dashboard

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Helper to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

// ============================================
// TYPES
// ============================================
export interface CronExecution {
  id: string
  job_name: string
  execution_time: string
  status: 'success' | 'failed' | 'timeout' | 'skipped'
  duration_ms: number | null
  error_message: string | null
  metadata: any
}

export interface CronJobStatus {
  job_name: string
  status: 'healthy' | 'degraded' | 'down'
  last_execution: string | null
  last_success: string | null
  last_failure: string | null
  uptime_percentage: number
  total_executions: number
  failures_24h: number
  avg_duration_ms: number
  next_run_time: string | null
}

// ============================================
// LOGGING
// ============================================

/**
 * Log a CRON job execution
 * Call this at the start and end of every CRON job
 */
export async function logCronExecution(
  jobName: string,
  status: 'success' | 'failed' | 'timeout' | 'skipped',
  durationMs?: number,
  errorMessage?: string,
  metadata?: any
): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('cron_executions')
    .insert({
      job_name: jobName,
      execution_time: new Date().toISOString(),
      status,
      duration_ms: durationMs || null,
      error_message: errorMessage || null,
      metadata: metadata || null,
    })

  if (error) {
    console.error('Error logging CRON execution:', error)
    // Don't throw - logging failure shouldn't break the CRON job
  }
}

/**
 * Wrapper function to automatically log CRON execution
 * Usage: await withCronMonitoring('job-name', async () => { ... })
 */
export async function withCronMonitoring<T>(
  jobName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    await logCronExecution(jobName, 'success', duration)

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logCronExecution(jobName, 'failed', duration, errorMessage)

    throw error
  }
}

// ============================================
// MONITORING
// ============================================

/**
 * Get status for a specific CRON job
 */
export async function getCronJobStatus(jobName: string): Promise<CronJobStatus> {
  const supabase = getSupabaseClient()

  // Get all executions for this job in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: executions } = await supabase
    .from('cron_executions')
    .select('*')
    .eq('job_name', jobName)
    .gte('execution_time', thirtyDaysAgo.toISOString())
    .order('execution_time', { ascending: false })

  if (!executions || executions.length === 0) {
    return {
      job_name: jobName,
      status: 'down',
      last_execution: null,
      last_success: null,
      last_failure: null,
      uptime_percentage: 0,
      total_executions: 0,
      failures_24h: 0,
      avg_duration_ms: 0,
      next_run_time: null,
    }
  }

  // Calculate metrics
  const lastExecution = executions[0]
  const lastSuccess = executions.find(e => e.status === 'success')
  const lastFailure = executions.find(e => e.status === 'failed')

  const totalExecutions = executions.length
  const successCount = executions.filter(e => e.status === 'success').length
  const uptimePercentage = (successCount / totalExecutions) * 100

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const failures24h = executions.filter(
    e => e.status === 'failed' && new Date(e.execution_time) >= twentyFourHoursAgo
  ).length

  const durations = executions
    .filter(e => e.duration_ms !== null)
    .map(e => e.duration_ms!)
  const avgDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'down' = 'healthy'
  if (failures24h > 5) {
    status = 'down'
  } else if (failures24h > 2 || uptimePercentage < 95) {
    status = 'degraded'
  }

  // Calculate next run time (this is approximate, based on schedule)
  const nextRunTime = calculateNextRunTime(jobName, lastExecution.execution_time)

  return {
    job_name: jobName,
    status,
    last_execution: lastExecution.execution_time,
    last_success: lastSuccess?.execution_time || null,
    last_failure: lastFailure?.execution_time || null,
    uptime_percentage: Number(uptimePercentage.toFixed(2)),
    total_executions: totalExecutions,
    failures_24h: failures24h,
    avg_duration_ms: Math.round(avgDuration),
    next_run_time: nextRunTime,
  }
}

/**
 * Get status for all CRON jobs
 */
export async function getAllCronJobsStatus(): Promise<CronJobStatus[]> {
  const jobNames = [
    'close-hourly-draw',
    'execute-hourly-draw',
    'close-daily-draw',
    'execute-daily-draw',
    'update-context',
    'daily-snapshot',
  ]

  const statuses = await Promise.all(
    jobNames.map(jobName => getCronJobStatus(jobName))
  )

  return statuses
}

/**
 * Calculate uptime percentage for a job over N days
 */
export async function calculateCronUptime(jobName: string, days: number = 30): Promise<number> {
  const supabase = getSupabaseClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: executions } = await supabase
    .from('cron_executions')
    .select('status')
    .eq('job_name', jobName)
    .gte('execution_time', startDate.toISOString())

  if (!executions || executions.length === 0) {
    return 0
  }

  const successCount = executions.filter(e => e.status === 'success').length
  return (successCount / executions.length) * 100
}

// ============================================
// HELPERS
// ============================================

/**
 * Calculate next run time based on job schedule
 * This is approximate - actual schedule is in vercel.json
 */
function calculateNextRunTime(jobName: string, lastExecutionTime: string): string | null {
  const schedules: Record<string, string> = {
    'close-hourly-draw': '0 * * * *', // Every hour at :00
    'execute-hourly-draw': '5 * * * *', // Every hour at :05
    'close-daily-draw': '0 2 * * *', // Daily at 2 AM
    'execute-daily-draw': '5 2 * * *', // Daily at 2:05 AM
    'update-context': '*/5 * * * *', // Every 5 minutes
    'daily-snapshot': '0 0 * * *', // Daily at midnight
  }

  const schedule = schedules[jobName]
  if (!schedule) return null

  const last = new Date(lastExecutionTime)
  const now = new Date()

  // Simple calculation based on common patterns
  if (schedule === '*/5 * * * *') {
    // Every 5 minutes
    const next = new Date(last)
    next.setMinutes(next.getMinutes() + 5)
    return next.toISOString()
  } else if (schedule.startsWith('0 * * * *') || schedule.startsWith('5 * * * *')) {
    // Hourly
    const next = new Date(last)
    next.setHours(next.getHours() + 1)
    return next.toISOString()
  } else if (schedule.includes('2 * * *')) {
    // Daily at specific hour
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    return next.toISOString()
  } else if (schedule === '0 0 * * *') {
    // Daily at midnight
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    next.setHours(0, 0, 0, 0)
    return next.toISOString()
  }

  return null
}

/**
 * Get summary of all CRON jobs health
 */
export async function getCronSystemHealth() {
  const allJobs = await getAllCronJobsStatus()

  const totalJobs = allJobs.length
  const healthyJobs = allJobs.filter(j => j.status === 'healthy').length
  const degradedJobs = allJobs.filter(j => j.status === 'degraded').length
  const downJobs = allJobs.filter(j => j.status === 'down').length

  const overallStatus = downJobs > 0 ? 'down' : degradedJobs > 0 ? 'degraded' : 'healthy'

  return {
    overall_status: overallStatus,
    total_jobs: totalJobs,
    healthy: healthyJobs,
    degraded: degradedJobs,
    down: downJobs,
    jobs: allJobs,
  }
}
