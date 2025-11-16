// ADMIN HEALTH REPORT API
// Comprehensive system health data for debugging and monitoring
// GET /api/admin/health

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aggregateAllMetrics } from '@/lib/services/data-collector'
import { getCronSystemHealth } from '@/lib/services/cron-monitoring-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET() {
  try {
    console.log('📊 Fetching comprehensive health report...')

    // Get all metrics
    const metrics = await aggregateAllMetrics()
    const cronHealth = await getCronSystemHealth()

    // Get recent event logs
    const supabase = getSupabaseClient()
    const { data: recentEvents } = await supabase
      .from('event_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    // Get recent cron executions (last 100)
    const { data: recentCronExecutions } = await supabase
      .from('cron_executions')
      .select('*')
      .order('execution_time', { ascending: false })
      .limit(100)

    // Get failed cron executions in last 24h
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: recentFailures } = await supabase
      .from('cron_executions')
      .select('*')
      .eq('status', 'failed')
      .gte('execution_time', twentyFourHoursAgo.toISOString())
      .order('execution_time', { ascending: false })

    // Get total tickets from database
    const { count: totalTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    // Environment info
    const environment = {
      node_version: process.version,
      platform: process.platform,
      vercel_env: process.env.VERCEL_ENV || 'development',
      vercel_region: process.env.VERCEL_REGION || 'local',
      executor_wallet_configured: !!process.env.NEXT_PUBLIC_EXECUTOR_WALLET,
      alchemy_configured: !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      supabase_configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    }

    // System checks
    const systemChecks = {
      database: {
        status: metrics.health.database.status,
        latency_ms: 0, // Could add timing
      },
      rpc: {
        status: metrics.health.rpc.status,
        block_number: metrics.health.rpc.blockNumber,
        latency_ms: 0,
      },
      contract: {
        status: metrics.health.contract.status,
        address: metrics.health.contract.address,
      },
      executor: {
        status: metrics.health.executor.balance > 0 ? 'healthy' : 'critical',
        balance: metrics.health.executor.balance,
        balance_formatted: metrics.health.executor.balanceFormatted,
        low_balance_warning: metrics.health.executor.lowBalance,
      },
    }

    // Build comprehensive report
    const healthReport = {
      timestamp: new Date().toISOString(),
      overall_status: calculateOverallStatus(cronHealth, systemChecks),

      // System metrics
      metrics: {
        revenue: metrics.revenue,
        users: metrics.users,
        tickets: {
          total: totalTickets || 0,
          hourly: metrics.draws.hourlyTickets,
          daily: metrics.draws.dailyTickets,
        },
        draws: {
          current_hourly_id: metrics.draws.currentHourlyId,
          current_daily_id: metrics.draws.currentDailyId,
          success_rate: metrics.draws.successRate,
        },
      },

      // Cron jobs health
      crons: {
        ...cronHealth,
        recent_executions: recentCronExecutions || [],
        recent_failures: recentFailures || [],
      },

      // System health
      system: systemChecks,

      // Environment
      environment,

      // Recent events
      events: {
        recent: recentEvents || [],
        total_unresolved: (recentEvents || []).filter((e: any) => !e.resolved).length,
      },

      // Alerts
      alerts: generateAlerts(metrics, cronHealth, systemChecks),
    }

    return NextResponse.json(healthReport)
  } catch (error: any) {
    console.error('❌ Error generating health report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate health report',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

function calculateOverallStatus(cronHealth: any, systemChecks: any): string {
  // Critical if any system check is down
  if (systemChecks.database.status === 'error' || systemChecks.rpc.status === 'error') {
    return 'critical'
  }

  // Warning if executor balance is low
  if (systemChecks.executor.low_balance_warning) {
    return 'warning'
  }

  // Degraded if crons are degraded
  if (cronHealth.overall_status === 'degraded') {
    return 'degraded'
  }

  // Down if crons are down
  if (cronHealth.overall_status === 'down') {
    return 'warning'
  }

  return 'healthy'
}

function generateAlerts(metrics: any, cronHealth: any, systemChecks: any): any[] {
  const alerts = []

  // Low balance alert
  if (systemChecks.executor.low_balance_warning) {
    alerts.push({
      severity: 'critical',
      category: 'executor',
      title: 'Low Executor Balance',
      message: `Executor wallet balance is ${systemChecks.executor.balance_formatted}. Please top up to avoid failed transactions.`,
      timestamp: new Date().toISOString(),
    })
  }

  // Cron jobs down
  if (cronHealth.down > 0) {
    alerts.push({
      severity: 'warning',
      category: 'crons',
      title: 'Cron Jobs Not Running',
      message: `${cronHealth.down} cron job(s) have not executed recently.`,
      timestamp: new Date().toISOString(),
    })
  }

  // Recent failures
  if (cronHealth.recent_failures && cronHealth.recent_failures.length > 0) {
    alerts.push({
      severity: 'warning',
      category: 'crons',
      title: 'Recent Cron Failures',
      message: `${cronHealth.recent_failures.length} cron job(s) failed in the last 24 hours.`,
      timestamp: new Date().toISOString(),
    })
  }

  // Database issues
  if (systemChecks.database.status === 'error') {
    alerts.push({
      severity: 'critical',
      category: 'database',
      title: 'Database Connection Failed',
      message: 'Cannot connect to Supabase. System functionality is impaired.',
      timestamp: new Date().toISOString(),
    })
  }

  // RPC issues
  if (systemChecks.rpc.status === 'error') {
    alerts.push({
      severity: 'critical',
      category: 'rpc',
      title: 'RPC Connection Failed',
      message: 'Cannot connect to Base network. Draws cannot be executed.',
      timestamp: new Date().toISOString(),
    })
  }

  return alerts
}
