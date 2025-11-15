// DAILY SNAPSHOT SERVICE
// Creates daily snapshots of all metrics for historical tracking
// This runs every day at midnight via CRON

import { createClient } from '@supabase/supabase-js'
import { collectBlockchainData, collectDatabaseData } from './data-collector'
import { syncDualLotteryMetrics } from './product-metrics-service'

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
// MAIN SNAPSHOT FUNCTION
// ============================================

/**
 * Create daily snapshot of all metrics
 * This should be called by a CRON job every day at midnight
 */
export async function createDailySnapshot(date?: string): Promise<boolean> {
  const targetDate = date || new Date().toISOString().split('T')[0]

  console.log(`📸 Creating daily snapshot for ${targetDate}...`)

  try {
    // Collect all data
    const [blockchainData, databaseData, dailyRevenue, newUsers, activeUsers] = await Promise.all([
      collectBlockchainData(),
      collectDatabaseData(),
      calculateDailyRevenue(targetDate),
      calculateDailyNewUsers(targetDate),
      calculateDailyActiveUsers(targetDate),
    ])

    // Calculate draws executed today
    const drawsExecuted = await calculateDrawsExecuted(targetDate)

    // Calculate winners and prizes
    const { winnersCount, prizesClaimed, prizesPending } = await calculatePrizesData(targetDate)

    // Get vault balances
    const hourlyVaultUsdc = blockchainData.vaults.hourly.usdc
    const dailyVaultUsdc = blockchainData.vaults.daily.usdc
    const platformFeeUsdc = dailyRevenue - hourlyVaultUsdc - dailyVaultUsdc

    // Insert into daily_metrics
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('daily_metrics')
      .upsert({
        date: targetDate,
        revenue_usdc: dailyRevenue,
        hourly_vault_usdc: hourlyVaultUsdc,
        daily_vault_usdc: dailyVaultUsdc,
        platform_fee_usdc: platformFeeUsdc,
        new_users: newUsers,
        active_users: activeUsers,
        total_users: databaseData.users.total,
        tickets_sold: databaseData.tickets.total,
        hourly_draws_executed: drawsExecuted.hourly,
        daily_draws_executed: drawsExecuted.daily,
        draws_failed: drawsExecuted.failed,
        winners_count: winnersCount,
        prizes_claimed_usdc: prizesClaimed,
        prizes_pending_usdc: prizesPending,
      })

    if (error) {
      console.error('❌ Error saving daily snapshot:', error)
      return false
    }

    console.log('✅ Daily snapshot created successfully!')

    // Also sync product metrics
    await syncDualLotteryMetrics(targetDate)

    return true
  } catch (error) {
    console.error('❌ Error creating daily snapshot:', error)
    return false
  }
}

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate total revenue for a specific day
 */
async function calculateDailyRevenue(date: string): Promise<number> {
  const supabase = getSupabaseClient()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('price_usdc')
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`)

  const revenue = tickets?.reduce((sum, t) => sum + Number(t.price_usdc || 0), 0) || 0

  return revenue
}

/**
 * Calculate new users for a specific day
 */
async function calculateDailyNewUsers(date: string): Promise<number> {
  const supabase = getSupabaseClient()

  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`)

  return count || 0
}

/**
 * Calculate active users for a specific day
 * (users who bought tickets or logged in that day)
 */
async function calculateDailyActiveUsers(date: string): Promise<number> {
  const supabase = getSupabaseClient()

  // Get unique users who bought tickets that day
  const { data: tickets } = await supabase
    .from('tickets')
    .select('user_id')
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`)

  const activeUsers = new Set(tickets?.map(t => t.user_id) || [])

  return activeUsers.size
}

/**
 * Calculate draws executed for a specific day
 */
async function calculateDrawsExecuted(date: string): Promise<{
  hourly: number
  daily: number
  failed: number
}> {
  const supabase = getSupabaseClient()

  // Check CRON executions for that day
  const { data: cronExecutions } = await supabase
    .from('cron_executions')
    .select('job_name, status')
    .gte('execution_time', `${date}T00:00:00.000Z`)
    .lt('execution_time', `${date}T23:59:59.999Z`)
    .in('job_name', ['execute-hourly-draw', 'execute-daily-draw'])

  if (!cronExecutions) {
    return { hourly: 0, daily: 0, failed: 0 }
  }

  const hourlySuccess = cronExecutions.filter(
    e => e.job_name === 'execute-hourly-draw' && e.status === 'success'
  ).length

  const dailySuccess = cronExecutions.filter(
    e => e.job_name === 'execute-daily-draw' && e.status === 'success'
  ).length

  const failed = cronExecutions.filter(e => e.status === 'failed').length

  return {
    hourly: hourlySuccess,
    daily: dailySuccess,
    failed,
  }
}

/**
 * Calculate prizes data for a specific day
 */
async function calculatePrizesData(date: string): Promise<{
  winnersCount: number
  prizesClaimed: number
  prizesPending: number
}> {
  const supabase = getSupabaseClient()

  // Get all winning tickets for that day
  const { data: winners } = await supabase
    .from('tickets')
    .select('is_winner, claimed, price_usdc')
    .eq('is_winner', true)
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`)

  if (!winners || winners.length === 0) {
    return { winnersCount: 0, prizesClaimed: 0, prizesPending: 0 }
  }

  const winnersCount = winners.length

  const claimed = winners.filter(w => w.claimed)
  const pending = winners.filter(w => !w.claimed)

  const prizesClaimed = claimed.reduce((sum, w) => sum + Number(w.price_usdc || 0), 0)
  const prizesPending = pending.reduce((sum, w) => sum + Number(w.price_usdc || 0), 0)

  return {
    winnersCount,
    prizesClaimed,
    prizesPending,
  }
}

// ============================================
// BACKFILL FUNCTIONS
// ============================================

/**
 * Backfill historical data for past days
 * Use this once to populate daily_metrics with existing data
 */
export async function backfillHistoricalData(startDate: string, endDate: string): Promise<number> {
  console.log(`📊 Backfilling data from ${startDate} to ${endDate}...`)

  const start = new Date(startDate)
  const end = new Date(endDate)

  let successCount = 0
  let currentDate = new Date(start)

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0]

    console.log(`  Processing ${dateStr}...`)

    const success = await createDailySnapshot(dateStr)

    if (success) {
      successCount++
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  console.log(`✅ Backfill complete! ${successCount} days processed.`)

  return successCount
}

/**
 * Backfill last N days
 */
export async function backfillLastNDays(days: number = 30): Promise<number> {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - 1) // Yesterday

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - days)

  return backfillHistoricalData(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  )
}
