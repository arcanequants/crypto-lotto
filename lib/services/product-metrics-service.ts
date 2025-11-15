// PRODUCT METRICS SERVICE
// Track performance of each platform product
// Powers the Platform Products and Revenue Streams sections

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
export interface Product {
  id: string
  name: string
  slug: string
  status: 'live' | 'coming_soon' | 'deprecated'
  description: string | null
  launch_date: string | null
  icon: string | null
  order_index: number
}

export interface ProductMetrics {
  product_id: string
  product_name: string
  product_slug: string
  status: 'live' | 'coming_soon' | 'deprecated'

  // Today's metrics
  daily_users: number
  revenue_24h: number
  revenue_24h_formatted: string
  transactions_24h: number

  // Monthly metrics
  revenue_30d: number
  revenue_30d_formatted: string
  margin_percentage: number

  // Growth
  mom_growth: number
  mom_growth_formatted: string
  wow_growth: number

  // Next action
  next_action: string
}

export interface ProductComparison {
  products: ProductMetrics[]
  total_revenue: number
  total_users: number
  best_performer: ProductMetrics | null
  worst_performer: ProductMetrics | null
}

// ============================================
// PRODUCT MANAGEMENT
// ============================================

/**
 * Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

/**
 * Get active (live) products only
 */
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'live')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching active products:', error)
    return []
  }

  return data || []
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

// ============================================
// METRICS TRACKING
// ============================================

/**
 * Record daily metrics for a product
 */
export async function recordProductMetrics(
  productId: string,
  date: string,
  metrics: {
    daily_users: number
    revenue_usdc: number
    transactions: number
    costs_usdc?: number
  }
): Promise<boolean> {
  const supabase = getSupabaseClient()

  const marginUsdc = metrics.revenue_usdc - (metrics.costs_usdc || 0)
  const marginPercentage = metrics.revenue_usdc > 0
    ? (marginUsdc / metrics.revenue_usdc) * 100
    : 0

  const { error } = await supabase
    .from('product_metrics_daily')
    .upsert({
      product_id: productId,
      date,
      daily_users: metrics.daily_users,
      revenue_usdc: metrics.revenue_usdc,
      transactions: metrics.transactions,
      costs_usdc: metrics.costs_usdc || 0,
      margin_usdc: marginUsdc,
      margin_percentage: marginPercentage,
    })

  if (error) {
    console.error('Error recording product metrics:', error)
    return false
  }

  return true
}

/**
 * Get metrics for a specific product
 */
export async function getProductMetrics(productId: string): Promise<ProductMetrics | null> {
  const supabase = getSupabaseClient()

  // Get product info
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) return null

  // Get today's date
  const today = new Date().toISOString().split('T')[0]

  // Get yesterday's date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Get 30 days ago
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  // Get 60 days ago (for MoM comparison)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0]

  // Get metrics
  const { data: todayMetrics } = await supabase
    .from('product_metrics_daily')
    .select('*')
    .eq('product_id', productId)
    .eq('date', today)
    .single()

  const { data: last30Days } = await supabase
    .from('product_metrics_daily')
    .select('revenue_usdc, margin_percentage')
    .eq('product_id', productId)
    .gte('date', thirtyDaysAgoStr)

  const { data: previous30Days } = await supabase
    .from('product_metrics_daily')
    .select('revenue_usdc')
    .eq('product_id', productId)
    .gte('date', sixtyDaysAgoStr)
    .lt('date', thirtyDaysAgoStr)

  // Calculate metrics
  const dailyUsers = todayMetrics?.daily_users || 0
  const revenue24h = Number(todayMetrics?.revenue_usdc || 0)
  const transactions24h = todayMetrics?.transactions || 0

  const revenue30d = last30Days?.reduce((sum, m) => sum + Number(m.revenue_usdc || 0), 0) || 0
  const avgMargin = last30Days && last30Days.length > 0
    ? last30Days.reduce((sum, m) => sum + Number(m.margin_percentage || 0), 0) / last30Days.length
    : 0

  const revenuePrevious30d = previous30Days?.reduce((sum, m) => sum + Number(m.revenue_usdc || 0), 0) || 0
  const momGrowth = revenuePrevious30d > 0
    ? ((revenue30d - revenuePrevious30d) / revenuePrevious30d) * 100
    : revenue30d > 0 ? 100 : 0

  // Determine next action
  let nextAction = 'Monitor performance'
  if (product.status === 'coming_soon') {
    nextAction = 'Launch in Q2 2025'
  } else if (product.status === 'live') {
    if (momGrowth < -10) {
      nextAction = 'Investigate decline'
    } else if (momGrowth > 50) {
      nextAction = 'Scale marketing'
    } else if (revenue30d === 0) {
      nextAction = 'Drive initial sales'
    }
  }

  return {
    product_id: productId,
    product_name: product.name,
    product_slug: product.slug,
    status: product.status,
    daily_users: dailyUsers,
    revenue_24h: revenue24h,
    revenue_24h_formatted: `$${(revenue24h / 1e6).toFixed(2)}`,
    transactions_24h: transactions24h,
    revenue_30d: revenue30d,
    revenue_30d_formatted: `$${(revenue30d / 1e6).toFixed(2)}`,
    margin_percentage: avgMargin,
    mom_growth: momGrowth,
    mom_growth_formatted: `${momGrowth > 0 ? '+' : ''}${momGrowth.toFixed(1)}%`,
    wow_growth: 0, // Would need weekly data
    next_action: nextAction,
  }
}

/**
 * Get metrics for all products
 */
export async function getAllProductsMetrics(): Promise<ProductMetrics[]> {
  const products = await getAllProducts()

  const metrics = await Promise.all(
    products.map(p => getProductMetrics(p.id))
  )

  return metrics.filter(Boolean) as ProductMetrics[]
}

/**
 * Get product performance comparison
 */
export async function getProductComparison(): Promise<ProductComparison> {
  const metrics = await getAllProductsMetrics()

  const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue_30d, 0)
  const totalUsers = metrics.reduce((sum, m) => sum + m.daily_users, 0)

  // Find best and worst performers (among live products only)
  const liveProducts = metrics.filter(m => m.status === 'live')
  const sortedByRevenue = [...liveProducts].sort((a, b) => b.revenue_30d - a.revenue_30d)

  return {
    products: metrics,
    total_revenue: totalRevenue,
    total_users: totalUsers,
    best_performer: sortedByRevenue[0] || null,
    worst_performer: sortedByRevenue[sortedByRevenue.length - 1] || null,
  }
}

// ============================================
// SPECIALIZED CALCULATIONS
// ============================================

/**
 * Calculate total revenue from Dual Lottery specifically
 * This reads from tickets table since we have real data
 */
export async function getDualLotteryRevenue(days: number = 30): Promise<number> {
  const supabase = getSupabaseClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: tickets } = await supabase
    .from('tickets')
    .select('price_usdc')
    .gte('created_at', startDate.toISOString())

  const totalRevenue = tickets?.reduce((sum, t) => sum + Number(t.price_usdc || 0), 0) || 0

  return totalRevenue
}

/**
 * Sync Dual Lottery metrics from tickets table
 * This should be called daily to update product_metrics_daily
 */
export async function syncDualLotteryMetrics(date?: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const targetDate = date || new Date().toISOString().split('T')[0]

  // Get Dual Lottery product
  const product = await getProductBySlug('dual-lottery')
  if (!product) return false

  // Get tickets for this date
  const { data: tickets } = await supabase
    .from('tickets')
    .select('user_id, price_usdc, created_at')
    .gte('created_at', `${targetDate}T00:00:00.000Z`)
    .lt('created_at', `${targetDate}T23:59:59.999Z`)

  const dailyUsers = new Set(tickets?.map(t => t.user_id) || []).size
  const revenue = tickets?.reduce((sum, t) => sum + Number(t.price_usdc || 0), 0) || 0
  const transactions = tickets?.length || 0

  // Record metrics
  return recordProductMetrics(product.id, targetDate, {
    daily_users: dailyUsers,
    revenue_usdc: revenue,
    transactions,
    costs_usdc: 0, // No direct costs for lottery
  })
}
