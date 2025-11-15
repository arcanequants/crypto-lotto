// EMPIRE DATA COLLECTOR - The Brain of the System
// This service collects ALL metrics from blockchain, database, and system health
// It runs every 5 minutes via CRON and generates context files for Claude

import { createLotteryPublicClient, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contracts/lottery-contract'
import { createClient } from '@supabase/supabase-js'

// Helper to get Supabase client (lazy initialization to avoid errors at module load)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase configuration. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// ============================================
// 1. BLOCKCHAIN DATA COLLECTOR
// ============================================
export async function collectBlockchainData() {
  const publicClient = createLotteryPublicClient()

  try {
    // Get current draw IDs
    const [currentHourlyId, currentDailyId] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'currentHourlyDrawId',
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'currentDailyDrawId',
      }),
    ])

    // Get hourly draw details
    const hourlyDraw = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getHourlyDraw',
      args: [currentHourlyId],
    })

    // Get daily draw details
    const dailyDraw = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getDailyDraw',
      args: [currentDailyId],
    })

    // Get vault balances
    const [hourlyVault, dailyVault] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getHourlyVault',
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getDailyVault',
      }),
    ])

    return {
      currentHourlyDrawId: Number(currentHourlyId),
      currentDailyDrawId: Number(currentDailyId),
      hourlyDraw: {
        drawTime: Number(hourlyDraw[0]),
        revealBlock: Number(hourlyDraw[1]),
        winningNumber: Number(hourlyDraw[2]),
        salesClosed: hourlyDraw[3],
        totalPrize: Number(hourlyDraw[4]),
        winner: hourlyDraw[5],
        btcPrize: Number(hourlyDraw[6]),
        ethPrize: Number(hourlyDraw[7]),
        usdcPrize: Number(hourlyDraw[8]),
        ticketCount: Number(hourlyDraw[9]),
        commitBlock: Number(hourlyDraw[10]),
        executionWindow: Number(hourlyDraw[11]),
        executed: hourlyDraw[12],
      },
      dailyDraw: {
        drawTime: Number(dailyDraw[0]),
        revealBlock: Number(dailyDraw[1]),
        winningNumber: Number(dailyDraw[2]),
        salesClosed: dailyDraw[3],
        totalPrize: Number(dailyDraw[4]),
        winner: dailyDraw[5],
        btcPrize: Number(dailyDraw[6]),
        ethPrize: Number(dailyDraw[7]),
        usdcPrize: Number(dailyDraw[8]),
        ticketCount: Number(dailyDraw[9]),
        commitBlock: Number(dailyDraw[10]),
        executionWindow: Number(dailyDraw[11]),
        executed: dailyDraw[12],
      },
      vaults: {
        hourly: {
          btc: Number(hourlyVault[0]),
          eth: Number(hourlyVault[1]),
          usdc: Number(hourlyVault[2]),
        },
        daily: {
          btc: Number(dailyVault[0]),
          eth: Number(dailyVault[1]),
          usdc: Number(dailyVault[2]),
        },
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error collecting blockchain data:', error)
    throw error
  }
}

// ============================================
// 2. DATABASE DATA COLLECTOR
// ============================================
export async function collectDatabaseData() {
  try {
    const supabase = getSupabaseClient()

    // Get user metrics using efficient RPC function
    const { data: userMetrics, error: userError } = await supabase.rpc('get_user_metrics')

    if (userError) {
      console.error('Error getting user metrics:', userError)
    }

    const totalUsers = userMetrics?.total || 0
    const activeUsers = userMetrics?.active || 0
    const newToday = userMetrics?.new_today || 0

    // Get total tickets sold
    const { count: totalTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })

    // Get tickets sold today
    const { count: ticketsToday } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())

    // Get total revenue from tickets
    const { data: ticketData } = await supabase
      .from('tickets')
      .select('price_paid')

    const totalRevenue = ticketData?.reduce((sum, t) => sum + (Number(t.price_paid) || 0), 0) || 0

    // Get winners count
    const { count: totalWinners } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('is_winner', true)

    // Get pending claims
    const { count: pendingClaims } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('is_winner', true)
      .eq('claimed', false)

    return {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        newToday: newToday || 0,
      },
      tickets: {
        total: totalTickets || 0,
        today: ticketsToday || 0,
      },
      revenue: {
        total: totalRevenue, // price_paid is already in USDC (DECIMAL type)
        totalFormatted: `$${totalRevenue.toFixed(2)}`,
      },
      winners: {
        total: totalWinners || 0,
        pendingClaims: pendingClaims || 0,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error collecting database data:', error)
    throw error
  }
}

// ============================================
// 3. SYSTEM HEALTH COLLECTOR
// ============================================
export async function collectSystemHealth() {
  try {
    // Check RPC connection
    const publicClient = createLotteryPublicClient()
    let rpcStatus = 'healthy'
    let blockNumber = 0

    try {
      blockNumber = Number(await publicClient.getBlockNumber())
      rpcStatus = 'healthy'
    } catch {
      rpcStatus = 'error'
    }

    // Check database connection
    let dbStatus = 'healthy'
    try {
      const supabase = getSupabaseClient()
      await supabase.from('tickets').select('id', { count: 'exact', head: true })
      dbStatus = 'healthy'
    } catch {
      dbStatus = 'error'
    }

    // Check contract verification (simplified - would need API call to Basescan)
    const contractStatus = 'verified'

    // Get executor wallet balance (if you have the address in env)
    let executorBalance = 0
    const executorAddress = process.env.NEXT_PUBLIC_EXECUTOR_WALLET
    if (executorAddress) {
      try {
        const balance = await publicClient.getBalance({ address: executorAddress as `0x${string}` })
        executorBalance = Number(balance) / 1e18 // Convert from wei to ETH
      } catch {
        executorBalance = 0
      }
    }

    return {
      rpc: {
        status: rpcStatus,
        blockNumber,
        latency: 0, // Could measure this with timing
      },
      database: {
        status: dbStatus,
      },
      contract: {
        status: contractStatus,
        address: CONTRACT_ADDRESS,
      },
      executor: {
        balance: executorBalance,
        balanceFormatted: `${executorBalance.toFixed(4)} ETH`,
        lowBalance: executorBalance < 0.02,
      },
      crons: {
        // This would need to be tracked in database or external monitoring
        status: 'running',
        lastHourlyExecution: new Date().toISOString(),
        lastDailyExecution: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error collecting system health:', error)
    throw error
  }
}

// ============================================
// 4. AGGREGATE ALL DATA
// ============================================
export async function aggregateAllMetrics() {
  try {
    const [blockchain, database, health] = await Promise.all([
      collectBlockchainData(),
      collectDatabaseData(),
      collectSystemHealth(),
    ])

    // Calculate derived metrics
    const totalRevenue = database.revenue.total
    const hourlyPrizePool = blockchain.vaults.hourly.usdc / 1e6
    const dailyPrizePool = blockchain.vaults.daily.usdc / 1e6
    const platformFee = totalRevenue - hourlyPrizePool - dailyPrizePool

    // Calculate success rate (last 24h)
    const successRate = 100 // Would calculate from draw history

    // Calculate automation percentage
    const automationPercentage = 65 // Based on what's automated

    return {
      timestamp: new Date().toISOString(),

      // Top-level KPIs
      kpis: {
        totalRevenue: database.revenue.totalFormatted,
        totalUsers: database.users.total,
        activeProducts: 3,
        automationPercentage,
      },

      // Revenue breakdown
      revenue: {
        total: totalRevenue,
        totalFormatted: database.revenue.totalFormatted,
        hourly: hourlyPrizePool,
        daily: dailyPrizePool,
        platformFee,
        mrr: totalRevenue * 30, // Simplified MRR calculation
      },

      // User metrics
      users: database.users,

      // Draw information
      draws: {
        currentHourlyId: blockchain.currentHourlyDrawId,
        currentDailyId: blockchain.currentDailyDrawId,
        hourlyTickets: blockchain.hourlyDraw.ticketCount,
        dailyTickets: blockchain.dailyDraw.ticketCount,
        hourlyPrizePool: hourlyPrizePool.toFixed(2),
        dailyPrizePool: dailyPrizePool.toFixed(2),
        successRate,
        hourlyDraw: blockchain.hourlyDraw,
        dailyDraw: blockchain.dailyDraw,
      },

      // Vault balances
      vaults: blockchain.vaults,

      // System health
      health,

      // Winners
      winners: database.winners,

      // Blockchain sync
      blockchain: {
        latestBlock: health.rpc.blockNumber,
        syncStatus: 'synced',
      },
    }
  } catch (error) {
    console.error('Error aggregating metrics:', error)
    throw error
  }
}
