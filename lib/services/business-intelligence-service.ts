// BUSINESS INTELLIGENCE SERVICE
// Advanced metrics calculations: growth projections, retention, margins, etc.
// Powers the North Star Metrics and Revenue Projections

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
export interface GrowthProjections {
  current_mrr: number
  growth_rate_mom: number
  projections: {
    next_month: number
    three_months: number
    six_months: number
    next_month_formatted: string
    three_months_formatted: string
    six_months_formatted: string
  }
  realistic_note: string
}

export interface RetentionMetrics {
  thirty_day_retention: number
  thirty_day_retention_percentage: string
  total_users_30_days_ago: number
  returned_users: number
  new_users_last_30_days: number
}

export interface GrossMarginMetrics {
  gross_revenue: number
  total_costs: number
  gross_margin: number
  gross_margin_percentage: string
  breakdown: {
    prize_pools: number
    gas_fees: number
    platform_fees: number
  }
}

export interface TimeToGoalMetrics {
  current_mrr: number
  target_mrr: number
  gap: number
  monthly_growth_rate: number
  estimated_months: number
  estimated_weeks: number
  estimated_date: string
  confidence: 'high' | 'medium' | 'low'
}

// ============================================
// GROWTH PROJECTIONS
// ============================================

/**
 * Calculate growth projections based on current MRR and MoM growth rate
 */
export async function calculateGrowthProjections(
  currentMRR: number,
  growthRateMoM: number
): Promise<GrowthProjections> {
  // Calculate projections using compound growth
  const nextMonth = currentMRR * (1 + growthRateMoM / 100)
  const threeMonths = currentMRR * Math.pow(1 + growthRateMoM / 100, 3)
  const sixMonths = currentMRR * Math.pow(1 + growthRateMoM / 100, 6)

  // Realistic note based on growth rate
  let realisticNote = 'Note: Exponential growth tends to stabilize. More realistic steady-state: 20-30% MoM'
  if (growthRateMoM < 50) {
    realisticNote = 'Growth rate is healthy and sustainable at current levels.'
  }

  return {
    current_mrr: currentMRR,
    growth_rate_mom: growthRateMoM,
    projections: {
      next_month: nextMonth,
      three_months: threeMonths,
      six_months: sixMonths,
      next_month_formatted: `$${(nextMonth / 1e6).toFixed(2)}`,
      three_months_formatted: `$${(threeMonths / 1e6).toFixed(2)}`,
      six_months_formatted: sixMonths >= 1e9
        ? `$${(sixMonths / 1e9).toFixed(1)}B`
        : `$${(sixMonths / 1e6).toFixed(2)}`,
    },
    realistic_note: realisticNote,
  }
}

// ============================================
// TIME TO GOAL
// ============================================

/**
 * Calculate estimated time to reach revenue goal
 */
export async function calculateTimeToGoal(
  currentMRR: number,
  targetMRR: number,
  monthlyGrowthRate: number
): Promise<TimeToGoalMetrics> {
  const gap = targetMRR - currentMRR

  // If already at or above goal
  if (gap <= 0) {
    return {
      current_mrr: currentMRR,
      target_mrr: targetMRR,
      gap: 0,
      monthly_growth_rate: monthlyGrowthRate,
      estimated_months: 0,
      estimated_weeks: 0,
      estimated_date: new Date().toISOString(),
      confidence: 'high',
    }
  }

  // Calculate months needed using logarithm
  // Formula: months = log(target/current) / log(1 + growth_rate)
  let estimatedMonths = 0
  let confidence: 'high' | 'medium' | 'low' = 'high'

  if (monthlyGrowthRate > 0) {
    estimatedMonths = Math.log(targetMRR / currentMRR) / Math.log(1 + monthlyGrowthRate / 100)

    // Adjust confidence based on growth rate stability
    if (monthlyGrowthRate > 100) {
      confidence = 'low' // Very high growth is unsustainable
    } else if (monthlyGrowthRate > 50) {
      confidence = 'medium' // High growth may slow down
    }
  } else {
    // No growth or negative growth - use linear estimate
    estimatedMonths = 999 // Basically never
    confidence = 'low'
  }

  const estimatedWeeks = estimatedMonths * 4.33 // Average weeks per month
  const estimatedDate = new Date()
  estimatedDate.setMonth(estimatedDate.getMonth() + Math.ceil(estimatedMonths))

  return {
    current_mrr: currentMRR,
    target_mrr: targetMRR,
    gap,
    monthly_growth_rate: monthlyGrowthRate,
    estimated_months: Math.ceil(estimatedMonths),
    estimated_weeks: Math.ceil(estimatedWeeks),
    estimated_date: estimatedDate.toISOString(),
    confidence,
  }
}

// ============================================
// 30-DAY RETENTION
// ============================================

/**
 * Calculate 30-day retention rate
 * Formula: (users who returned after 30 days) / (total users created 30+ days ago)
 */
export async function calculate30DayRetention(): Promise<RetentionMetrics> {
  const supabase = getSupabaseClient()

  try {
    // Get date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get total users created 30+ days ago
    const { data: oldUsers, error: oldUsersError } = await supabase
      .from('users')
      .select('id, created_at, last_login_at')
      .lte('created_at', thirtyDaysAgo.toISOString())

    if (oldUsersError) {
      console.error('Error fetching old users:', oldUsersError)
      throw oldUsersError
    }

    // Get users who have logged in after their 30-day mark
    const returnedUsers = (oldUsers || []).filter((user) => {
      if (!user.last_login_at) return false

      const createdDate = new Date(user.created_at)
      const lastLoginDate = new Date(user.last_login_at)
      const thirtyDaysAfterCreation = new Date(createdDate)
      thirtyDaysAfterCreation.setDate(thirtyDaysAfterCreation.getDate() + 30)

      // Check if they logged in after 30 days from creation
      return lastLoginDate >= thirtyDaysAfterCreation
    })

    // Get new users in last 30 days
    const { count: newUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const totalOldUsers = oldUsers?.length || 0
    const returnedUsersCount = returnedUsers.length
    const retentionRate = totalOldUsers > 0 ? (returnedUsersCount / totalOldUsers) * 100 : 0

    return {
      thirty_day_retention: retentionRate,
      thirty_day_retention_percentage: `${retentionRate.toFixed(1)}%`,
      total_users_30_days_ago: totalOldUsers,
      returned_users: returnedUsersCount,
      new_users_last_30_days: newUsersCount || 0,
    }
  } catch (error) {
    console.error('Error calculating 30-day retention:', error)

    // Return default values
    return {
      thirty_day_retention: 0,
      thirty_day_retention_percentage: '0%',
      total_users_30_days_ago: 0,
      returned_users: 0,
      new_users_last_30_days: 0,
    }
  }
}

// ============================================
// GROSS MARGIN
// ============================================

/**
 * Calculate gross margin
 * Formula: ((revenue - costs) / revenue) * 100
 */
export async function calculateGrossMargin(
  totalRevenue: number,
  prizePools: number,
  estimatedGasFees: number = 0
): Promise<GrossMarginMetrics> {
  // Calculate total costs
  const totalCosts = prizePools + estimatedGasFees

  // Calculate gross margin
  const grossMargin = totalRevenue > 0 ? totalRevenue - totalCosts : 0
  const grossMarginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0

  return {
    gross_revenue: totalRevenue,
    total_costs: totalCosts,
    gross_margin: grossMargin,
    gross_margin_percentage: `${grossMarginPercentage.toFixed(1)}%`,
    breakdown: {
      prize_pools: prizePools,
      gas_fees: estimatedGasFees,
      platform_fees: grossMargin, // What's left after prizes and gas
    },
  }
}

// ============================================
// AGGREGATE ALL BI METRICS
// ============================================

/**
 * Get all business intelligence metrics at once
 */
export async function getAllBIMetrics(
  currentMRR: number,
  growthRateMoM: number,
  totalRevenue: number,
  prizePools: number
) {
  const [
    growthProjections,
    timeToGoal,
    retention,
    grossMargin,
  ] = await Promise.all([
    calculateGrowthProjections(currentMRR, growthRateMoM),
    calculateTimeToGoal(currentMRR, 10000000, growthRateMoM), // $10K target
    calculate30DayRetention(),
    calculateGrossMargin(totalRevenue, prizePools),
  ])

  return {
    growth_projections: growthProjections,
    time_to_goal: timeToGoal,
    retention: retention,
    gross_margin: grossMargin,
  }
}
