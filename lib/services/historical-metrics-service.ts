// HISTORICAL METRICS SERVICE
// Calculate MoM, WoW growth rates and retrieve historical data
// This service powers the trend analysis in the dashboard

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
export interface DailyMetric {
  date: string
  revenue_usdc: number
  new_users: number
  active_users: number
  total_users: number
  tickets_sold: number
  hourly_draws_executed: number
  daily_draws_executed: number
}

export interface GrowthMetrics {
  current: number
  previous: number
  growth: number
  growth_percentage: string
}

// ============================================
// HISTORICAL DATA RETRIEVAL
// ============================================

/**
 * Get daily metrics for a specific date range
 */
export async function getHistoricalMetrics(days: number = 30): Promise<DailyMetric[]> {
  const supabase = getSupabaseClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching historical metrics:', error)
    throw error
  }

  return data || []
}

/**
 * Get revenue for last N days
 */
export async function getHistoricalRevenue(days: number = 30): Promise<{ date: string; amount: number }[]> {
  const metrics = await getHistoricalMetrics(days)

  return metrics.map(m => ({
    date: m.date,
    amount: Number(m.revenue_usdc),
  }))
}

/**
 * Get user growth for last N days
 */
export async function getHistoricalUsers(days: number = 30): Promise<{ date: string; total: number; new: number }[]> {
  const metrics = await getHistoricalMetrics(days)

  return metrics.map(m => ({
    date: m.date,
    total: m.total_users,
    new: m.new_users,
  }))
}

// ============================================
// GROWTH CALCULATIONS
// ============================================

/**
 * Calculate Month-over-Month growth for any metric
 */
export async function calculateMoMGrowth(metricName: keyof DailyMetric): Promise<GrowthMetrics> {
  const supabase = getSupabaseClient()

  // Get current month (latest available data)
  const { data: currentData } = await supabase
    .from('daily_metrics')
    .select(metricName)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // Get last month (30 days ago)
  const lastMonthDate = new Date()
  lastMonthDate.setDate(lastMonthDate.getDate() - 30)

  const { data: previousData } = await supabase
    .from('daily_metrics')
    .select(metricName)
    .lte('date', lastMonthDate.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const current = Number(currentData?.[metricName] || 0)
  const previous = Number(previousData?.[metricName] || 0)

  const growth = previous === 0 ? current : current - previous
  const growthPercentage = previous === 0 ? 100 : ((growth / previous) * 100)

  return {
    current,
    previous,
    growth,
    growth_percentage: `${growthPercentage > 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`,
  }
}

/**
 * Calculate Week-over-Week growth for any metric
 */
export async function calculateWoWGrowth(metricName: keyof DailyMetric): Promise<GrowthMetrics> {
  const supabase = getSupabaseClient()

  // Get current week (latest available data)
  const { data: currentData } = await supabase
    .from('daily_metrics')
    .select(metricName)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // Get last week (7 days ago)
  const lastWeekDate = new Date()
  lastWeekDate.setDate(lastWeekDate.getDate() - 7)

  const { data: previousData } = await supabase
    .from('daily_metrics')
    .select(metricName)
    .lte('date', lastWeekDate.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const current = Number(currentData?.[metricName] || 0)
  const previous = Number(previousData?.[metricName] || 0)

  const growth = previous === 0 ? current : current - previous
  const growthPercentage = previous === 0 ? 100 : ((growth / previous) * 100)

  return {
    current,
    previous,
    growth,
    growth_percentage: `${growthPercentage > 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`,
  }
}

/**
 * Get all growth metrics for dashboard
 */
export async function getAllGrowthMetrics() {
  const [revenueMoM, usersMoM, ticketsMoM] = await Promise.all([
    calculateMoMGrowth('revenue_usdc'),
    calculateMoMGrowth('total_users'),
    calculateMoMGrowth('tickets_sold'),
  ])

  return {
    revenue: revenueMoM,
    users: usersMoM,
    tickets: ticketsMoM,
  }
}

// ============================================
// AGGREGATIONS
// ============================================

/**
 * Get total revenue for a specific period
 */
export async function getRevenueForPeriod(period: 'today' | 'week' | 'month' | 'all'): Promise<number> {
  const supabase = getSupabaseClient()

  let startDate: Date | null = null

  switch (period) {
    case 'today':
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'month':
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      break
    case 'all':
      startDate = null
      break
  }

  let query = supabase
    .from('daily_metrics')
    .select('revenue_usdc')

  if (startDate) {
    query = query.gte('date', startDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching revenue:', error)
    return 0
  }

  return data?.reduce((sum, row) => sum + Number(row.revenue_usdc || 0), 0) || 0
}

/**
 * Calculate MRR (Monthly Recurring Revenue)
 * For now, we'll use the last 30 days average
 */
export async function calculateMRR(): Promise<number> {
  const revenue30Days = await getRevenueForPeriod('month')
  return revenue30Days // In crypto lottery, this IS the MRR (no subscriptions yet)
}

/**
 * Get metrics summary for dashboard
 */
export async function getMetricsSummary() {
  const [
    revenueAll,
    revenueMonth,
    revenueWeek,
    revenueToday,
    mrr,
    growthMetrics,
  ] = await Promise.all([
    getRevenueForPeriod('all'),
    getRevenueForPeriod('month'),
    getRevenueForPeriod('week'),
    getRevenueForPeriod('today'),
    calculateMRR(),
    getAllGrowthMetrics(),
  ])

  return {
    revenue: {
      all: revenueAll,
      month: revenueMonth,
      week: revenueWeek,
      today: revenueToday,
      mrr,
      allFormatted: `$${(revenueAll / 1e6).toFixed(2)}`,
      monthFormatted: `$${(revenueMonth / 1e6).toFixed(2)}`,
      weekFormatted: `$${(revenueWeek / 1e6).toFixed(2)}`,
      todayFormatted: `$${(revenueToday / 1e6).toFixed(2)}`,
      mrrFormatted: `$${(mrr / 1e6).toFixed(2)}`,
    },
    growth: growthMetrics,
  }
}
