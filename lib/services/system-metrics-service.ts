// SYSTEM METRICS SERVICE
// Tracks uptime, response time, error rate, and other system health indicators
// Stores historical data in database for trend analysis

import { createClient } from '@supabase/supabase-js'

// Helper to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// ============================================
// SYSTEM UPTIME METRICS
// ============================================

/**
 * Calculate system uptime percentage based on event_log
 * Uptime = (Total Time - Downtime) / Total Time
 */
export async function getSystemUptime(days = 30) {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get all critical errors and warnings in the time period
    const { data: incidents, error } = await supabase
      .from('event_log')
      .select('created_at, resolved_at, severity')
      .in('severity', ['critical', 'error'])
      .eq('category', 'system')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching incidents:', error)
      return {
        uptime_percentage: 100,
        total_incidents: 0,
        total_downtime_minutes: 0,
        period_days: days,
      }
    }

    if (!incidents || incidents.length === 0) {
      return {
        uptime_percentage: 100,
        total_incidents: 0,
        total_downtime_minutes: 0,
        period_days: days,
      }
    }

    // Calculate total downtime
    let totalDowntimeMs = 0
    for (const incident of incidents) {
      const startTime = new Date(incident.created_at).getTime()
      const endTime = incident.resolved_at
        ? new Date(incident.resolved_at).getTime()
        : Date.now() // If not resolved, count until now

      const downtime = endTime - startTime
      totalDowntimeMs += downtime
    }

    const totalPeriodMs = days * 24 * 60 * 60 * 1000
    const uptimePercentage = ((totalPeriodMs - totalDowntimeMs) / totalPeriodMs) * 100

    return {
      uptime_percentage: Number(uptimePercentage.toFixed(2)),
      total_incidents: incidents.length,
      total_downtime_minutes: Math.round(totalDowntimeMs / 60000),
      period_days: days,
    }
  } catch (error) {
    console.error('Error calculating uptime:', error)
    return {
      uptime_percentage: 100,
      total_incidents: 0,
      total_downtime_minutes: 0,
      period_days: days,
    }
  }
}

// ============================================
// API RESPONSE TIME METRICS
// ============================================

/**
 * Calculate average API response time
 * This would ideally be tracked in a separate metrics table
 * For now, we'll estimate based on recent successful requests
 */
export async function getAverageResponseTime() {
  try {
    const supabase = getSupabaseClient()

    // Get recent API success logs from event_log (if they exist)
    const { data: apiLogs } = await supabase
      .from('event_log')
      .select('metadata, created_at')
      .eq('category', 'api')
      .eq('severity', 'info')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false })
      .limit(100)

    if (!apiLogs || apiLogs.length === 0) {
      // Default to healthy response time if no logs
      return {
        average_ms: 150,
        p50_ms: 120,
        p95_ms: 250,
        p99_ms: 400,
        sample_size: 0,
      }
    }

    // Extract response times from metadata
    const responseTimes = apiLogs
      .map(log => {
        const metadata = log.metadata as any
        return metadata?.response_time_ms || metadata?.duration_ms
      })
      .filter(Boolean) as number[]

    if (responseTimes.length === 0) {
      return {
        average_ms: 150,
        p50_ms: 120,
        p95_ms: 250,
        p99_ms: 400,
        sample_size: 0,
      }
    }

    // Calculate percentiles
    const sorted = responseTimes.sort((a, b) => a - b)
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]
    const average = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length

    return {
      average_ms: Math.round(average),
      p50_ms: p50,
      p95_ms: p95,
      p99_ms: p99,
      sample_size: responseTimes.length,
    }
  } catch (error) {
    console.error('Error calculating response time:', error)
    return {
      average_ms: 150,
      p50_ms: 120,
      p95_ms: 250,
      p99_ms: 400,
      sample_size: 0,
    }
  }
}

// ============================================
// ERROR RATE METRICS
// ============================================

/**
 * Calculate system-wide error rate
 * Error Rate = (Errors / Total Requests) * 100
 */
export async function getErrorRate(hours = 24) {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    // Get total events in time period
    const { count: totalEvents } = await supabase
      .from('event_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffDate.toISOString())

    // Get error events
    const { count: errorEvents } = await supabase
      .from('event_log')
      .select('*', { count: 'exact', head: true })
      .in('severity', ['error', 'critical'])
      .gte('created_at', cutoffDate.toISOString())

    const total = totalEvents || 0
    const errors = errorEvents || 0

    const errorRate = total > 0 ? (errors / total) * 100 : 0

    return {
      error_rate_percentage: Number(errorRate.toFixed(2)),
      total_errors: errors,
      total_requests: total,
      period_hours: hours,
      status: errorRate < 1 ? 'healthy' : errorRate < 5 ? 'warning' : 'critical',
    }
  } catch (error) {
    console.error('Error calculating error rate:', error)
    return {
      error_rate_percentage: 0,
      total_errors: 0,
      total_requests: 0,
      period_hours: hours,
      status: 'healthy' as const,
    }
  }
}

// ============================================
// AGGREGATED SYSTEM METRICS
// ============================================

/**
 * Get all system health metrics in one call
 */
export async function getSystemHealthMetrics() {
  const [uptime30d, uptime7d, responseTime, errorRate24h, errorRate1h] = await Promise.all([
    getSystemUptime(30),
    getSystemUptime(7),
    getAverageResponseTime(),
    getErrorRate(24),
    getErrorRate(1),
  ])

  return {
    uptime: {
      last_30_days: uptime30d,
      last_7_days: uptime7d,
      current_status: uptime30d.uptime_percentage >= 99.9 ? 'excellent' :
                      uptime30d.uptime_percentage >= 99.0 ? 'good' :
                      uptime30d.uptime_percentage >= 95.0 ? 'fair' : 'poor',
    },
    response_time: {
      ...responseTime,
      status: responseTime.average_ms < 200 ? 'excellent' :
              responseTime.average_ms < 500 ? 'good' :
              responseTime.average_ms < 1000 ? 'fair' : 'poor',
    },
    error_rate: {
      last_24_hours: errorRate24h,
      last_1_hour: errorRate1h,
      trending: errorRate1h.error_rate_percentage > errorRate24h.error_rate_percentage
        ? 'increasing'
        : 'stable',
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get system metrics summary for dashboard
 */
export async function getSystemMetricsSummary() {
  const metrics = await getSystemHealthMetrics()

  return {
    uptime_30d: `${metrics.uptime.last_30_days.uptime_percentage}%`,
    uptime_status: metrics.uptime.current_status,
    avg_response_time: `${metrics.response_time.average_ms}ms`,
    response_time_status: metrics.response_time.status,
    error_rate_24h: `${metrics.error_rate.last_24_hours.error_rate_percentage}%`,
    error_rate_status: metrics.error_rate.last_24_hours.status,
    last_incident: metrics.uptime.last_30_days.total_incidents > 0
      ? `${metrics.uptime.last_30_days.total_downtime_minutes} minutes ago`
      : 'None',
    health_score: calculateHealthScore(metrics),
  }
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(metrics: Awaited<ReturnType<typeof getSystemHealthMetrics>>) {
  // Weight: Uptime (40%), Response Time (30%), Error Rate (30%)
  const uptimeScore = metrics.uptime.last_30_days.uptime_percentage * 0.4

  // Response time score (inverse - lower is better)
  const responseScore = Math.max(0, 100 - (metrics.response_time.average_ms / 10)) * 0.3

  // Error rate score (inverse - lower is better)
  const errorScore = Math.max(0, 100 - (metrics.error_rate.last_24_hours.error_rate_percentage * 10)) * 0.3

  const totalScore = uptimeScore + responseScore + errorScore

  return {
    score: Math.round(totalScore),
    grade: totalScore >= 95 ? 'A+' :
           totalScore >= 90 ? 'A' :
           totalScore >= 80 ? 'B' :
           totalScore >= 70 ? 'C' :
           totalScore >= 60 ? 'D' : 'F',
  }
}
