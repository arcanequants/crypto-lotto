// ALERT SERVICE
// Automatically creates alerts in event_log when issues are detected

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for alert service')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
type AlertCategory =
  | 'cron'
  | 'blockchain'
  | 'database'
  | 'security'
  | 'performance'
  | 'system'

interface CreateAlertParams {
  eventType: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  description?: string
  metadata?: Record<string, any>
}

/**
 * Create an alert in the event_log table
 */
export async function createAlert(params: CreateAlertParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('event_log').insert({
      event_type: params.eventType,
      severity: params.severity,
      category: params.category,
      title: params.title,
      description: params.description || null,
      metadata: params.metadata || null,
      resolved: false,
    })

    if (error) {
      console.error('❌ Failed to create alert:', error)
      return false
    }

    console.log(
      `🚨 Alert created: [${params.severity.toUpperCase()}] ${params.title}`
    )
    return true
  } catch (error) {
    console.error('❌ Error creating alert:', error)
    return false
  }
}

/**
 * Resolve an alert by ID
 */
export async function resolveAlert(
  alertId: string,
  resolvedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('event_log')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', alertId)

    if (error) {
      console.error('❌ Failed to resolve alert:', error)
      return false
    }

    console.log(`✅ Alert ${alertId} resolved by ${resolvedBy}`)
    return true
  } catch (error) {
    console.error('❌ Error resolving alert:', error)
    return false
  }
}

/**
 * Get active alerts (unresolved)
 */
export async function getActiveAlerts(
  severity?: AlertSeverity,
  category?: AlertCategory
) {
  try {
    let query = supabase
      .from('event_log')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Failed to fetch active alerts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Error fetching active alerts:', error)
    return []
  }
}

// ============================================
// AUTOMATIC ALERT GENERATORS
// ============================================

/**
 * Check CRON job health and create alerts if needed
 */
export async function checkCronHealth() {
  try {
    // Get all CRON jobs and their recent executions
    const { data: cronStats } = await supabase.rpc('get_cron_health_stats')

    if (!cronStats) return

    // Check for jobs that haven't run recently
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    for (const job of cronStats) {
      if (!job.last_execution || new Date(job.last_execution) < oneHourAgo) {
        await createAlert({
          eventType: 'cron_not_running',
          severity: 'warning',
          category: 'cron',
          title: `CRON job "${job.job_name}" hasn't run in over 1 hour`,
          description: `Last execution: ${job.last_execution || 'Never'}`,
          metadata: {
            job_name: job.job_name,
            last_execution: job.last_execution,
          },
        })
      }

      // Check for high failure rate
      if (job.uptime_percentage < 80) {
        await createAlert({
          eventType: 'cron_low_uptime',
          severity: 'error',
          category: 'cron',
          title: `CRON job "${job.job_name}" has low uptime (${job.uptime_percentage}%)`,
          description: `Recent failures are impacting reliability`,
          metadata: {
            job_name: job.job_name,
            uptime_percentage: job.uptime_percentage,
            failures_24h: job.failures_24h,
          },
        })
      }
    }
  } catch (error) {
    console.error('❌ Error checking CRON health:', error)
  }
}

/**
 * Check executor wallet balance and create alert if low
 */
export async function checkExecutorBalance(balanceETH: number) {
  const threshold = 0.02 // Alert if below 0.02 ETH

  if (balanceETH < threshold) {
    await createAlert({
      eventType: 'low_executor_balance',
      severity: balanceETH < 0.01 ? 'critical' : 'warning',
      category: 'blockchain',
      title: `Executor wallet balance is low: ${balanceETH.toFixed(4)} ETH`,
      description: `Please top up the executor wallet to ensure draws can continue`,
      metadata: {
        current_balance: balanceETH,
        threshold,
      },
    })
  }
}

/**
 * Check database connection and create alert if down
 */
export async function checkDatabaseHealth() {
  try {
    const { data, error } = await supabase.from('products').select('count')

    if (error) {
      await createAlert({
        eventType: 'database_connection_error',
        severity: 'critical',
        category: 'database',
        title: 'Database connection failed',
        description: error.message,
        metadata: { error: error.message },
      })
      return false
    }

    return true
  } catch (error) {
    await createAlert({
      eventType: 'database_connection_error',
      severity: 'critical',
      category: 'database',
      title: 'Database connection failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    return false
  }
}

/**
 * Run all health checks and generate alerts
 */
export async function runHealthChecks() {
  console.log('🔍 Running health checks...')

  await checkCronHealth()
  await checkDatabaseHealth()

  console.log('✅ Health checks completed')
}
