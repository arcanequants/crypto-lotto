// ADMIN ALERTS ENDPOINT
// Returns recent unresolved alerts from event_log

import { NextRequest, NextResponse } from 'next/server'
import { getRecentAlerts } from '@/lib/services/event-log-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    const alerts = await getRecentAlerts(Math.min(limit, 50))

    // Format alerts with relative time
    const formattedAlerts = alerts.map(alert => {
      const createdAt = new Date(alert.created_at)
      const now = new Date()
      const diffMs = now.getTime() - createdAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      let relativeTime = ''
      if (diffMins < 1) {
        relativeTime = 'just now'
      } else if (diffMins < 60) {
        relativeTime = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
      } else if (diffHours < 24) {
        relativeTime = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      } else {
        relativeTime = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      }

      // Map severity to icon
      const iconMap: Record<string, string> = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        critical: '🚨',
      }

      return {
        id: alert.id,
        severity: alert.severity,
        category: alert.category,
        icon: iconMap[alert.severity] || '📌',
        message: alert.title,
        description: alert.description,
        timestamp: alert.created_at,
        relativeTime,
        resolved: alert.resolved,
        metadata: alert.metadata,
      }
    })

    return NextResponse.json(
      {
        success: true,
        alerts: formattedAlerts,
        total: formattedAlerts.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('❌ Error fetching alerts:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
