// DAILY SNAPSHOT CRON JOB
// Runs daily at midnight to create historical snapshots
// Schedule: 0 0 * * * (midnight UTC)

import { NextRequest, NextResponse } from 'next/server'
import { createDailySnapshot } from '@/lib/services/daily-snapshot-service'
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

  console.log('🔄 [CRON] Daily snapshot job started...')

  try {
    // Run with monitoring
    await withCronMonitoring('daily-snapshot', async () => {
      // Create snapshot for yesterday (more accurate than today)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const date = yesterday.toISOString().split('T')[0]

      const success = await createDailySnapshot(date)

      if (!success) {
        throw new Error('Daily snapshot creation failed')
      }

      console.log(`✅ [CRON] Daily snapshot created for ${date}`)
    })

    return NextResponse.json({
      success: true,
      message: 'Daily snapshot created successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [CRON] Daily snapshot failed:', error)

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
  // For manual testing, we'll allow without auth but require a special param
  const searchParams = request.nextUrl.searchParams
  const testMode = searchParams.get('test')

  if (!testMode) {
    return NextResponse.json(
      { error: 'This endpoint requires POST with CRON_SECRET or GET with ?test=true' },
      { status: 400 }
    )
  }

  console.log('🧪 [TEST] Manual daily snapshot triggered...')

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const date = yesterday.toISOString().split('T')[0]

    const success = await createDailySnapshot(date)

    return NextResponse.json({
      success,
      message: success ? 'Snapshot created' : 'Snapshot creation failed',
      date,
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
