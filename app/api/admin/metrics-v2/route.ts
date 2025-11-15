// ADMIN METRICS V2 - Enhanced with full data collection
// This endpoint uses the new enhanced data collector with growth metrics

import { NextResponse } from 'next/server'
import { aggregateAllMetricsEnhanced } from '@/lib/services/enhanced-data-collector'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const metrics = await aggregateAllMetricsEnhanced()

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
