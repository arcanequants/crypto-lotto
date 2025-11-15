// TREND DATA SERVICE
// Get historical data for charts and trends

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for trend data service')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TrendDataPoint {
  label: string
  value: number
}

/**
 * Get revenue trend data for the last N days
 */
export async function getRevenueTrend(days: number = 7): Promise<TrendDataPoint[]> {
  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('date, revenue_usdc')
      .order('date', { ascending: true })
      .limit(days)

    if (error) {
      console.error('❌ Failed to fetch revenue trend:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((row) => ({
      label: new Date(row.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: parseFloat(row.revenue_usdc) || 0,
    }))
  } catch (error) {
    console.error('❌ Error fetching revenue trend:', error)
    return []
  }
}

/**
 * Get users trend data for the last N days
 */
export async function getUsersTrend(days: number = 7): Promise<TrendDataPoint[]> {
  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('date, total_users')
      .order('date', { ascending: true })
      .limit(days)

    if (error) {
      console.error('❌ Failed to fetch users trend:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((row) => ({
      label: new Date(row.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: row.total_users || 0,
    }))
  } catch (error) {
    console.error('❌ Error fetching users trend:', error)
    return []
  }
}

/**
 * Get tickets sold trend for the last N days
 */
export async function getTicketsTrend(days: number = 7): Promise<TrendDataPoint[]> {
  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .select('date, tickets_sold')
      .order('date', { ascending: true })
      .limit(days)

    if (error) {
      console.error('❌ Failed to fetch tickets trend:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    return data.map((row) => ({
      label: new Date(row.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: row.tickets_sold || 0,
    }))
  } catch (error) {
    console.error('❌ Error fetching tickets trend:', error)
    return []
  }
}

/**
 * Get all trend data in one call
 */
export async function getAllTrends(days: number = 7) {
  const [revenue, users, tickets] = await Promise.all([
    getRevenueTrend(days),
    getUsersTrend(days),
    getTicketsTrend(days),
  ])

  return {
    revenue,
    users,
    tickets,
  }
}
