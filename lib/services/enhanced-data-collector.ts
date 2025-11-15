// ENHANCED DATA COLLECTOR
// Extends the original data-collector with growth metrics and new features
// This is the UPGRADED version with historical tracking

import { collectBlockchainData, collectDatabaseData, collectSystemHealth } from './data-collector'
import { getAllGrowthMetrics, getMetricsSummary } from './historical-metrics-service'
import { getCronSystemHealth } from './cron-monitoring-service'
import { getRecentAlerts, getActiveIssues } from './event-log-service'
import { getAllProductsMetrics } from './product-metrics-service'

// ============================================
// ENHANCED AGGREGATION
// ============================================

/**
 * Enhanced version of aggregateAllMetrics with growth tracking
 */
export async function aggregateAllMetricsEnhanced() {
  try {
    console.log('📊 Collecting enhanced metrics...')

    // Collect all data in parallel
    const [
      blockchain,
      database,
      health,
      growthMetrics,
      metricsSummary,
      cronHealth,
      recentAlerts,
      activeIssues,
      productMetrics,
    ] = await Promise.all([
      collectBlockchainData(),
      collectDatabaseData(),
      collectSystemHealth(),
      getAllGrowthMetrics().catch(() => ({ revenue: null, users: null, tickets: null })),
      getMetricsSummary().catch(() => null),
      getCronSystemHealth().catch(() => null),
      getRecentAlerts(10).catch(() => []),
      getActiveIssues().catch(() => []),
      getAllProductsMetrics().catch(() => []),
    ])

    // Calculate derived metrics
    const totalRevenue = database.revenue.total
    const hourlyPrizePool = blockchain.vaults.hourly.usdc / 1e6
    const dailyPrizePool = blockchain.vaults.daily.usdc / 1e6
    const platformFee = totalRevenue - hourlyPrizePool - dailyPrizePool

    // Calculate MRR (use summary if available, otherwise fallback)
    const mrr = metricsSummary?.revenue.mrr || totalRevenue * 30

    // Calculate automation percentage (this is still manual for now)
    const automationPercentage = 65

    return {
      timestamp: new Date().toISOString(),

      // Top-level KPIs
      kpis: {
        totalRevenue: database.revenue.totalFormatted,
        totalUsers: database.users.total,
        activeProducts: productMetrics.filter(p => p.status === 'live').length,
        automationPercentage,
      },

      // Revenue with growth
      revenue: {
        total: totalRevenue,
        totalFormatted: database.revenue.totalFormatted,
        hourly: hourlyPrizePool,
        daily: dailyPrizePool,
        platformFee,
        mrr,
        mrrFormatted: `$${(mrr / 1e6).toFixed(2)}`,

        // Growth metrics
        momGrowth: growthMetrics.revenue?.growth_percentage || '+0%',
        momGrowthValue: growthMetrics.revenue?.growth || 0,

        // From summary
        ...(metricsSummary?.revenue || {}),
      },

      // User metrics with growth
      users: {
        ...database.users,
        momGrowth: growthMetrics.users?.growth_percentage || '+0%',
        momGrowthValue: growthMetrics.users?.growth || 0,
      },

      // Draw information
      draws: {
        currentHourlyId: blockchain.currentHourlyDrawId,
        currentDailyId: blockchain.currentDailyDrawId,
        hourlyTickets: blockchain.hourlyDraw.ticketCount,
        dailyTickets: blockchain.dailyDraw.ticketCount,
        hourlyPrizePool: hourlyPrizePool.toFixed(2),
        dailyPrizePool: dailyPrizePool.toFixed(2),
        successRate: 100, // Will be calculated from cron health
        hourlyDraw: blockchain.hourlyDraw,
        dailyDraw: blockchain.dailyDraw,
      },

      // Vault balances
      vaults: blockchain.vaults,

      // Enhanced system health with CRON monitoring
      health: {
        ...health,
        crons: cronHealth || health.crons,
      },

      // Winners
      winners: database.winners,

      // Blockchain sync
      blockchain: {
        latestBlock: health.rpc.blockNumber,
        syncStatus: 'synced',
      },

      // NEW: Growth metrics
      growth: growthMetrics,

      // NEW: Recent alerts
      alerts: {
        recent: recentAlerts.slice(0, 5),
        active_issues: activeIssues,
        total_alerts: recentAlerts.length,
        critical_count: activeIssues.filter(i => i.severity === 'critical').length,
      },

      // NEW: Product metrics
      products: {
        all: productMetrics,
        live: productMetrics.filter(p => p.status === 'live'),
        coming_soon: productMetrics.filter(p => p.status === 'coming_soon'),
      },
    }
  } catch (error) {
    console.error('Error aggregating enhanced metrics:', error)
    throw error
  }
}

/**
 * Lightweight version for frequent updates (every 30s)
 * Only fetches critical real-time data
 */
export async function aggregateRealTimeMetrics() {
  const [blockchain, database] = await Promise.all([
    collectBlockchainData(),
    collectDatabaseData(),
  ])

  return {
    timestamp: new Date().toISOString(),
    draws: {
      currentHourlyId: blockchain.currentHourlyDrawId,
      currentDailyId: blockchain.currentDailyDrawId,
      hourlyTickets: blockchain.hourlyDraw.ticketCount,
      dailyTickets: blockchain.dailyDraw.ticketCount,
    },
    users: {
      total: database.users.total,
      active: database.users.active,
    },
    revenue: {
      totalFormatted: database.revenue.totalFormatted,
    },
  }
}
