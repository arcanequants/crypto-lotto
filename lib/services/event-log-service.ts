// EVENT LOG SERVICE
// System alerts, events, and notifications
// Powers the Recent Alerts section in dashboard

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
// TYPES
// ============================================
export interface Event {
  id?: string
  event_type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  category: string
  title: string
  description?: string
  metadata?: any
  resolved?: boolean
  resolved_at?: string
  resolved_by?: string
  created_at?: string
}

export interface EventSummary {
  total: number
  critical: number
  errors: number
  warnings: number
  info: number
  unresolved: number
}

// ============================================
// LOGGING
// ============================================

/**
 * Log a system event
 */
export async function logEvent(event: Event): Promise<string | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('event_log')
    .insert({
      event_type: event.event_type,
      severity: event.severity,
      category: event.category,
      title: event.title,
      description: event.description || null,
      metadata: event.metadata || null,
      resolved: event.resolved || false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error logging event:', error)
    return null
  }

  return data?.id || null
}

/**
 * Helper functions for specific event types
 */
export async function logInfo(category: string, title: string, description?: string, metadata?: any) {
  return logEvent({
    event_type: 'info',
    severity: 'info',
    category,
    title,
    description,
    metadata,
  })
}

export async function logWarning(category: string, title: string, description?: string, metadata?: any) {
  return logEvent({
    event_type: 'warning',
    severity: 'warning',
    category,
    title,
    description,
    metadata,
  })
}

export async function logError(category: string, title: string, description?: string, metadata?: any) {
  return logEvent({
    event_type: 'error',
    severity: 'error',
    category,
    title,
    description,
    metadata,
  })
}

export async function logCritical(category: string, title: string, description?: string, metadata?: any) {
  return logEvent({
    event_type: 'critical',
    severity: 'critical',
    category,
    title,
    description,
    metadata,
  })
}

// ============================================
// RETRIEVAL
// ============================================

/**
 * Get recent alerts (last N events)
 */
export async function getRecentAlerts(limit: number = 10): Promise<Event[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('event_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent alerts:', error)
    return []
  }

  return data || []
}

/**
 * Get active/unresolved issues only
 */
export async function getActiveIssues(): Promise<Event[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('event_log')
    .select('*')
    .eq('resolved', false)
    .in('severity', ['warning', 'error', 'critical'])
    .order('severity', { ascending: true }) // Critical first
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching active issues:', error)
    return []
  }

  return data || []
}

/**
 * Get events by category
 */
export async function getEventsByCategory(category: string, limit: number = 50): Promise<Event[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('event_log')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching events by category:', error)
    return []
  }

  return data || []
}

/**
 * Get events by severity
 */
export async function getEventsBySeverity(
  severity: 'info' | 'warning' | 'error' | 'critical',
  limit: number = 50
): Promise<Event[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('event_log')
    .select('*')
    .eq('severity', severity)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching events by severity:', error)
    return []
  }

  return data || []
}

// ============================================
// RESOLUTION
// ============================================

/**
 * Mark an event as resolved
 */
export async function resolveEvent(eventId: string, resolvedBy?: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('event_log')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy || 'system',
    })
    .eq('id', eventId)

  if (error) {
    console.error('Error resolving event:', error)
    return false
  }

  return true
}

/**
 * Auto-resolve old events (older than N days)
 */
export async function autoResolveOldEvents(daysOld: number = 30): Promise<number> {
  const supabase = getSupabaseClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const { data, error } = await supabase
    .from('event_log')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: 'auto',
    })
    .eq('resolved', false)
    .lte('created_at', cutoffDate.toISOString())
    .select('id')

  if (error) {
    console.error('Error auto-resolving old events:', error)
    return 0
  }

  return data?.length || 0
}

// ============================================
// ANALYTICS
// ============================================

/**
 * Get event summary/stats
 */
export async function getEventSummary(days: number = 7): Promise<EventSummary> {
  const supabase = getSupabaseClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('event_log')
    .select('severity, resolved')
    .gte('created_at', startDate.toISOString())

  if (error) {
    console.error('Error fetching event summary:', error)
    return {
      total: 0,
      critical: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      unresolved: 0,
    }
  }

  const events = data || []

  return {
    total: events.length,
    critical: events.filter(e => e.severity === 'critical').length,
    errors: events.filter(e => e.severity === 'error').length,
    warnings: events.filter(e => e.severity === 'warning').length,
    info: events.filter(e => e.severity === 'info').length,
    unresolved: events.filter(e => !e.resolved).length,
  }
}

// ============================================
// PRE-DEFINED EVENTS
// ============================================

/**
 * Log specific system events with standardized format
 */
export const SystemEvents = {
  // Executor wallet
  executorLowBalance: (balance: string) =>
    logWarning(
      'infrastructure',
      'Executor wallet balance low',
      `Balance is ${balance}. Refill needed within 3 days.`,
      { balance }
    ),

  executorCriticalBalance: (balance: string) =>
    logCritical(
      'infrastructure',
      'Executor wallet critically low',
      `Balance is ${balance}. Immediate refill required!`,
      { balance }
    ),

  // Draw executions
  drawExecuted: (drawType: 'hourly' | 'daily', drawId: number, winner?: string) =>
    logInfo(
      'draws',
      `${drawType === 'hourly' ? 'Hourly' : 'Daily'} draw #${drawId} executed successfully`,
      winner ? `Winner: ${winner}` : 'No winner (auto-rollover)',
      { drawType, drawId, winner }
    ),

  drawFailed: (drawType: 'hourly' | 'daily', drawId: number, error: string) =>
    logError(
      'draws',
      `${drawType === 'hourly' ? 'Hourly' : 'Daily'} draw #${drawId} execution failed`,
      error,
      { drawType, drawId, error }
    ),

  // Infrastructure
  rpcDown: () =>
    logCritical(
      'infrastructure',
      'RPC connection degraded',
      'Unable to connect to BASE RPC provider.',
      {}
    ),

  databaseDown: () =>
    logCritical(
      'infrastructure',
      'Database connection issues',
      'Unable to connect to Supabase.',
      {}
    ),

  // Security
  failedLogin: (ip: string, attempts: number) =>
    logWarning(
      'security',
      'Failed login attempts detected',
      `${attempts} failed login attempts from IP: ${ip}`,
      { ip, attempts }
    ),

  suspiciousActivity: (description: string, metadata?: any) =>
    logWarning('security', 'Suspicious activity detected', description, metadata),

  // Milestones
  userMilestone: (count: number) =>
    logInfo(
      'milestone',
      `Milestone reached: ${count} total users!`,
      undefined,
      { count }
    ),

  revenueMilestone: (amount: string) =>
    logInfo(
      'milestone',
      `Revenue milestone: ${amount} total revenue!`,
      undefined,
      { amount }
    ),
}
