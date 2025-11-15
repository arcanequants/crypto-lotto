// CONTEXT UPDATE CRON - Runs every 5 minutes
// Generates fresh context files for Claude to read

import { NextResponse } from 'next/server'
import { generateAllContext } from '@/lib/services/context-generator'
import { withCronMonitoring } from '@/lib/services/cron-monitoring-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Verify CRON secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('⏰ CRON: Updating Claude context files...')

    // Run with monitoring
    await withCronMonitoring('update-context', async () => {
      const result = await generateAllContext()

      if (!result) {
        throw new Error('Context generation failed')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Context files updated successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error updating context:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update context',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggers
export async function POST(request: Request) {
  return GET(request)
}
