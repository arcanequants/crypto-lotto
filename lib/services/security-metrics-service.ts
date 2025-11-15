// SECURITY METRICS SERVICE
// Track authentication security, failed logins, audit trail, and security events
// Powers the Security tab in admin dashboard

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
// AUTHENTICATION SECURITY
// ============================================

/**
 * Get failed login attempts
 * Tracks authentication failures from event_log
 */
export async function getFailedLoginAttempts(hours = 24) {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    // Get failed login events
    const { data: failedLogins, error } = await supabase
      .from('event_log')
      .select('*')
      .eq('category', 'auth')
      .eq('severity', 'warning')
      .ilike('title', '%failed%')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching failed logins:', error)
      return {
        total_attempts: 0,
        unique_ips: 0,
        unique_users: 0,
        recent_attempts: [],
        status: 'healthy' as const,
      }
    }

    // Extract unique IPs and users from metadata
    const uniqueIps = new Set<string>()
    const uniqueUsers = new Set<string>()

    failedLogins?.forEach(log => {
      const metadata = log.metadata as any
      if (metadata?.ip) uniqueIps.add(metadata.ip)
      if (metadata?.user_id) uniqueUsers.add(metadata.user_id)
    })

    // Determine status
    const totalAttempts = failedLogins?.length || 0
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (totalAttempts > 100) status = 'critical'
    else if (totalAttempts > 20) status = 'warning'

    return {
      total_attempts: totalAttempts,
      unique_ips: uniqueIps.size,
      unique_users: uniqueUsers.size,
      recent_attempts: failedLogins?.slice(0, 10) || [],
      status,
      period_hours: hours,
    }
  } catch (error) {
    console.error('Error calculating failed logins:', error)
    return {
      total_attempts: 0,
      unique_ips: 0,
      unique_users: 0,
      recent_attempts: [],
      status: 'healthy' as const,
      period_hours: hours,
    }
  }
}

/**
 * Get successful logins (for comparison)
 */
export async function getSuccessfulLogins(hours = 24) {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    const { count } = await supabase
      .from('event_log')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auth')
      .eq('severity', 'info')
      .ilike('title', '%success%')
      .gte('created_at', cutoffDate.toISOString())

    return count || 0
  } catch (error) {
    console.error('Error counting successful logins:', error)
    return 0
  }
}

/**
 * Calculate login success rate
 */
export async function getLoginSuccessRate(hours = 24) {
  const [successful, failed] = await Promise.all([
    getSuccessfulLogins(hours),
    getFailedLoginAttempts(hours),
  ])

  const total = successful + failed.total_attempts
  const successRate = total > 0 ? (successful / total) * 100 : 100

  return {
    success_rate: Number(successRate.toFixed(2)),
    success_rate_formatted: `${successRate.toFixed(1)}%`,
    total_logins: total,
    successful_logins: successful,
    failed_logins: failed.total_attempts,
    status: successRate >= 95 ? 'healthy' : successRate >= 80 ? 'warning' : 'critical',
  }
}

// ============================================
// AUDIT TRAIL
// ============================================

/**
 * Get recent audit events (admin actions, sensitive operations)
 */
export async function getAuditTrail(limit = 50) {
  try {
    const supabase = getSupabaseClient()

    // Get audit events from event_log
    const { data: auditEvents, error } = await supabase
      .from('event_log')
      .select('*')
      .eq('category', 'audit')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching audit trail:', error)
      return []
    }

    return auditEvents || []
  } catch (error) {
    console.error('Error fetching audit trail:', error)
    return []
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(days = 7) {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Count audit events by severity
    const { data: events } = await supabase
      .from('event_log')
      .select('severity')
      .eq('category', 'audit')
      .gte('created_at', cutoffDate.toISOString())

    const counts = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    }

    events?.forEach(e => {
      if (e.severity in counts) {
        counts[e.severity as keyof typeof counts]++
      }
    })

    const total = Object.values(counts).reduce((sum, c) => sum + c, 0)

    return {
      total_events: total,
      by_severity: counts,
      period_days: days,
      compliance_score: calculateComplianceScore(counts),
    }
  } catch (error) {
    console.error('Error calculating audit stats:', error)
    return {
      total_events: 0,
      by_severity: { info: 0, warning: 0, error: 0, critical: 0 },
      period_days: days,
      compliance_score: 100,
    }
  }
}

function calculateComplianceScore(counts: { info: number; warning: number; error: number; critical: number }) {
  // Perfect score starts at 100
  let score = 100

  // Deduct points for warnings and errors
  score -= counts.warning * 0.5
  score -= counts.error * 2
  score -= counts.critical * 5

  return Math.max(0, Math.round(score))
}

// ============================================
// SECURITY EVENTS
// ============================================

/**
 * Get suspicious activity (multiple failed logins, unusual patterns)
 */
export async function getSuspiciousActivity(hours = 24) {
  try {
    const supabase = getSupabaseClient()
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hours)

    // Get security-related events
    const { data: securityEvents, error } = await supabase
      .from('event_log')
      .select('*')
      .eq('category', 'security')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching security events:', error)
      return {
        total_events: 0,
        high_priority: 0,
        events: [],
      }
    }

    const highPriority = securityEvents?.filter(e => e.severity === 'critical' || e.severity === 'error').length || 0

    return {
      total_events: securityEvents?.length || 0,
      high_priority: highPriority,
      events: securityEvents?.slice(0, 10) || [],
    }
  } catch (error) {
    console.error('Error fetching suspicious activity:', error)
    return {
      total_events: 0,
      high_priority: 0,
      events: [],
    }
  }
}

/**
 * Get wallet security status
 * Checks executor wallet balance and monitors for unusual activity
 */
export async function getWalletSecurityStatus() {
  try {
    const supabase = getSupabaseClient()

    // Get recent wallet-related events
    const { data: walletEvents } = await supabase
      .from('event_log')
      .select('*')
      .eq('category', 'wallet')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check for critical wallet events
    const criticalEvents = walletEvents?.filter(e => e.severity === 'critical' || e.severity === 'error') || []

    return {
      status: criticalEvents.length > 0 ? 'warning' : 'healthy',
      recent_events: walletEvents?.length || 0,
      critical_events: criticalEvents.length,
      last_event: walletEvents?.[0] || null,
    }
  } catch (error) {
    console.error('Error checking wallet security:', error)
    return {
      status: 'unknown' as const,
      recent_events: 0,
      critical_events: 0,
      last_event: null,
    }
  }
}

// ============================================
// AGGREGATED SECURITY METRICS
// ============================================

/**
 * Get comprehensive security dashboard
 */
export async function getSecurityMetrics() {
  const [
    failedLogins24h,
    loginSuccessRate,
    auditStats,
    suspiciousActivity,
    walletSecurity,
  ] = await Promise.all([
    getFailedLoginAttempts(24),
    getLoginSuccessRate(24),
    getAuditStats(7),
    getSuspiciousActivity(24),
    getWalletSecurityStatus(),
  ])

  // Calculate overall security score (0-100)
  const securityScore = calculateSecurityScore({
    failedLogins: failedLogins24h.total_attempts,
    loginSuccessRate: loginSuccessRate.success_rate,
    complianceScore: auditStats.compliance_score,
    suspiciousEvents: suspiciousActivity.high_priority,
    walletStatus: walletSecurity.status,
  })

  return {
    authentication: {
      failed_logins_24h: failedLogins24h,
      login_success_rate: loginSuccessRate,
    },
    audit: {
      stats_7d: auditStats,
      recent_trail: await getAuditTrail(10),
    },
    threats: {
      suspicious_activity_24h: suspiciousActivity,
      wallet_security: walletSecurity,
    },
    overall: {
      security_score: securityScore.score,
      security_grade: securityScore.grade,
      status: securityScore.status,
    },
    timestamp: new Date().toISOString(),
  }
}

function calculateSecurityScore(params: {
  failedLogins: number
  loginSuccessRate: number
  complianceScore: number
  suspiciousEvents: number
  walletStatus: string
}) {
  let score = 100

  // Failed logins penalty (max -20 points)
  score -= Math.min(20, params.failedLogins * 0.2)

  // Login success rate (weight 20%)
  score -= (100 - params.loginSuccessRate) * 0.2

  // Compliance score (weight 30%)
  score -= (100 - params.complianceScore) * 0.3

  // Suspicious events penalty (max -15 points)
  score -= Math.min(15, params.suspiciousEvents * 3)

  // Wallet security penalty
  if (params.walletStatus === 'warning') score -= 10
  if (params.walletStatus === 'critical') score -= 25

  const finalScore = Math.max(0, Math.round(score))

  return {
    score: finalScore,
    grade: finalScore >= 90 ? 'A' :
           finalScore >= 80 ? 'B' :
           finalScore >= 70 ? 'C' :
           finalScore >= 60 ? 'D' : 'F',
    status: finalScore >= 80 ? 'healthy' :
            finalScore >= 60 ? 'warning' : 'critical',
  }
}

/**
 * Get security metrics summary for dashboard
 */
export async function getSecurityMetricsSummary() {
  const metrics = await getSecurityMetrics()

  return {
    security_score: metrics.overall.security_score,
    security_grade: metrics.overall.security_grade,
    security_status: metrics.overall.status,
    failed_logins_24h: metrics.authentication.failed_logins_24h.total_attempts,
    login_success_rate: metrics.authentication.login_success_rate.success_rate_formatted,
    audit_events_7d: metrics.audit.stats_7d.total_events,
    suspicious_activity: metrics.threats.suspicious_activity_24h.high_priority,
    wallet_status: metrics.threats.wallet_security.status,
  }
}
