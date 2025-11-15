// HEALTH CHECK CRON JOB
// Runs every 15 minutes to check system health and create alerts
// Schedule: */15 * * * * (every 15 minutes)

import { NextRequest, NextResponse } from 'next/server'
import { runHealthChecks } from '@/lib/services/alert-service'
import { withCronMonitoring } from '@/lib/services/cron-monitoring-service'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  // Verify CRON secret
  const authHeader = request.headers.get('authorization')

  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('🔍 [CRON] Health check job started...')

  try {
    // Run with monitoring
    await withCronMonitoring('health-check', async () => {
      await runHealthChecks()
    })

    return NextResponse.json({
      success: true,
      message: 'Health checks completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [CRON] Health check failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const testMode = searchParams.get('test')

  if (!testMode) {
    return NextResponse.json(
      {
        error:
          'This endpoint requires POST with CRON_SECRET or GET with ?test=true',
      },
      { status: 400 }
    )
  }

  console.log('🧪 [TEST] Manual health check triggered...')

  try {
    await runHealthChecks()

    return NextResponse.json({
      success: true,
      message: 'Health checks completed',
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
