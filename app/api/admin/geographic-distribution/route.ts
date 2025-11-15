// GEOGRAPHIC DISTRIBUTION API ENDPOINT
// Returns user distribution by region and country

import { NextResponse } from 'next/server'
import { getGeographicDistribution } from '@/lib/services/geographic-distribution-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const distribution = await getGeographicDistribution()

    return NextResponse.json(
      {
        success: true,
        distribution,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching geographic distribution:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch geographic distribution',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
