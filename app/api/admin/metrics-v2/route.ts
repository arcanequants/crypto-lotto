// ADMIN METRICS V2 - Enhanced with full data collection
// This endpoint uses the new data collector for comprehensive metrics

import { NextResponse } from 'next/server'
import { aggregateAllMetrics } from '@/lib/services/data-collector'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const metrics = await aggregateAllMetrics()

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
