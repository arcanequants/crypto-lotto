// API ENDPOINT: Get trend data for charts
// GET /api/admin/trends?days=7

import { NextRequest, NextResponse } from 'next/server'
import { getAllTrends } from '@/lib/services/trend-data-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7', 10)

    // Limit to reasonable range
    const limitedDays = Math.min(Math.max(days, 1), 90)

    const trends = await getAllTrends(limitedDays)

    return NextResponse.json({
      success: true,
      days: limitedDays,
      trends,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error fetching trends:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
