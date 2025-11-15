// BACKFILL ENDPOINT
// Manually populate historical data for daily_metrics
// Access: /api/admin/backfill?days=30

import { NextRequest, NextResponse } from 'next/server'
import { backfillLastNDays } from '@/lib/services/daily-snapshot-service'

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get('days') || '30')

  if (days > 365) {
    return NextResponse.json(
      { error: 'Cannot backfill more than 365 days at once' },
      { status: 400 }
    )
  }

  console.log(`🔄 Backfilling ${days} days of historical data...`)

  try {
    const processedDays = await backfillLastNDays(days)

    return NextResponse.json({
      success: true,
      message: `Backfilled ${processedDays} days successfully`,
      days_requested: days,
      days_processed: processedDays,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Backfill error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get('days') || '7')

  if (days > 90) {
    return NextResponse.json(
      { error: 'GET method limited to 90 days. Use POST for more.' },
      { status: 400 }
    )
  }

  console.log(`🧪 [TEST] Backfilling ${days} days...`)

  try {
    const processedDays = await backfillLastNDays(days)

    return NextResponse.json({
      success: true,
      message: `Test backfill completed`,
      days_requested: days,
      days_processed: processedDays,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
