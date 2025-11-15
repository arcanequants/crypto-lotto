// AUTOMATION METRICS SERVICE
// Track what percentage of the platform is automated vs manual
// Powers the Automation tab in admin dashboard

import { getCronSystemHealth } from './cron-monitoring-service'

// ============================================
// AUTOMATION TRACKING
// ============================================

/**
 * Define all processes in the system and their automation status
 */
interface ProcessStatus {
  id: string
  name: string
  category: 'lottery' | 'payments' | 'monitoring' | 'operations' | 'marketing'
  status: 'automated' | 'manual' | 'semi-automated'
  automation_percentage: number // 0-100
  description: string
  frequency: string // How often it runs
  last_automated_run?: string
  manual_steps_required?: string[]
}

const SYSTEM_PROCESSES: ProcessStatus[] = [
  // LOTTERY OPERATIONS
  {
    id: 'hourly-draw-close',
    name: 'Hourly Draw Closing',
    category: 'lottery',
    status: 'automated',
    automation_percentage: 100,
    description: 'Closes hourly draw sales automatically',
    frequency: 'Every hour at :00',
  },
  {
    id: 'hourly-draw-execute',
    name: 'Hourly Draw Execution',
    category: 'lottery',
    status: 'automated',
    automation_percentage: 100,
    description: 'Executes hourly draw and selects winner',
    frequency: 'Every hour at :05',
  },
  {
    id: 'daily-draw-close',
    name: 'Daily Draw Closing',
    category: 'lottery',
    status: 'automated',
    automation_percentage: 100,
    description: 'Closes daily draw sales automatically',
    frequency: 'Daily at midnight UTC',
  },
  {
    id: 'daily-draw-execute',
    name: 'Daily Draw Execution',
    category: 'lottery',
    status: 'automated',
    automation_percentage: 100,
    description: 'Executes daily draw and selects winner',
    frequency: 'Daily at 00:05 UTC',
  },

  // PAYMENTS
  {
    id: 'prize-distribution',
    name: 'Prize Distribution',
    category: 'payments',
    status: 'automated',
    automation_percentage: 90,
    description: 'Distributes prizes to winners',
    frequency: 'Immediately after draw',
    manual_steps_required: ['Manual verification for large prizes (>$10k)'],
  },
  {
    id: 'refunds',
    name: 'Ticket Refunds',
    category: 'payments',
    status: 'manual',
    automation_percentage: 0,
    description: 'Process refund requests',
    frequency: 'As needed',
    manual_steps_required: ['Review refund request', 'Approve/deny', 'Process transaction'],
  },

  // MONITORING
  {
    id: 'health-monitoring',
    name: 'System Health Monitoring',
    category: 'monitoring',
    status: 'automated',
    automation_percentage: 100,
    description: 'Monitors system health and alerts on issues',
    frequency: 'Every 5 minutes',
  },
  {
    id: 'blockchain-sync',
    name: 'Blockchain Data Sync',
    category: 'monitoring',
    status: 'automated',
    automation_percentage: 100,
    description: 'Syncs blockchain data to database',
    frequency: 'Every 5 minutes',
  },
  {
    id: 'metrics-collection',
    name: 'Metrics Collection',
    category: 'monitoring',
    status: 'automated',
    automation_percentage: 100,
    description: 'Collects and aggregates platform metrics',
    frequency: 'Every 5 minutes',
  },
  {
    id: 'error-alerting',
    name: 'Error Alerting',
    category: 'monitoring',
    status: 'automated',
    automation_percentage: 100,
    description: 'Sends alerts for critical errors',
    frequency: 'Real-time',
  },

  // OPERATIONS
  {
    id: 'user-onboarding',
    name: 'User Onboarding',
    category: 'operations',
    status: 'automated',
    automation_percentage: 100,
    description: 'New user registration and setup',
    frequency: 'On signup',
  },
  {
    id: 'kyc-verification',
    name: 'KYC Verification',
    category: 'operations',
    status: 'semi-automated',
    automation_percentage: 50,
    description: 'Verify user identity',
    frequency: 'On request',
    manual_steps_required: ['Manual review for flagged accounts'],
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    category: 'operations',
    status: 'manual',
    automation_percentage: 20,
    description: 'Handle customer inquiries',
    frequency: 'As needed',
    manual_steps_required: ['Read ticket', 'Research issue', 'Respond to user'],
  },
  {
    id: 'fraud-detection',
    name: 'Fraud Detection',
    category: 'operations',
    status: 'semi-automated',
    automation_percentage: 70,
    description: 'Detect and prevent fraudulent activity',
    frequency: 'Real-time',
    manual_steps_required: ['Review flagged transactions', 'Take action on suspicious accounts'],
  },

  // MARKETING
  {
    id: 'email-campaigns',
    name: 'Email Marketing',
    category: 'marketing',
    status: 'semi-automated',
    automation_percentage: 40,
    description: 'Send marketing emails',
    frequency: 'Weekly',
    manual_steps_required: ['Design campaign', 'Write copy', 'Schedule send'],
  },
  {
    id: 'social-media',
    name: 'Social Media Posts',
    category: 'marketing',
    status: 'manual',
    automation_percentage: 0,
    description: 'Post on social media',
    frequency: 'Daily',
    manual_steps_required: ['Create content', 'Design graphics', 'Post manually'],
  },
  {
    id: 'analytics-reporting',
    name: 'Analytics Reporting',
    category: 'marketing',
    status: 'automated',
    automation_percentage: 100,
    description: 'Generate analytics reports',
    frequency: 'Daily',
  },
]

/**
 * Get overall automation percentage
 */
export async function getAutomationPercentage() {
  // Calculate weighted average based on process automation percentages
  const totalAutomation = SYSTEM_PROCESSES.reduce((sum, p) => sum + p.automation_percentage, 0)
  const avgAutomation = totalAutomation / SYSTEM_PROCESSES.length

  return {
    overall_percentage: Math.round(avgAutomation),
    total_processes: SYSTEM_PROCESSES.length,
    fully_automated: SYSTEM_PROCESSES.filter(p => p.automation_percentage === 100).length,
    semi_automated: SYSTEM_PROCESSES.filter(p => p.automation_percentage > 0 && p.automation_percentage < 100).length,
    manual: SYSTEM_PROCESSES.filter(p => p.automation_percentage === 0).length,
  }
}

/**
 * Get automation breakdown by category
 */
export async function getAutomationByCategory() {
  const categories = ['lottery', 'payments', 'monitoring', 'operations', 'marketing'] as const

  const breakdown = categories.map(category => {
    const processes = SYSTEM_PROCESSES.filter(p => p.category === category)
    const totalAutomation = processes.reduce((sum, p) => sum + p.automation_percentage, 0)
    const avgAutomation = processes.length > 0 ? totalAutomation / processes.length : 0

    return {
      category,
      automation_percentage: Math.round(avgAutomation),
      total_processes: processes.length,
      automated: processes.filter(p => p.automation_percentage === 100).length,
      manual: processes.filter(p => p.automation_percentage === 0).length,
    }
  })

  return breakdown
}

/**
 * Get list of all processes with their status
 */
export async function getAllProcesses() {
  return SYSTEM_PROCESSES
}

/**
 * Get processes that need improvement (semi-automated or manual)
 */
export async function getProcessesNeedingAutomation() {
  const needsImprovement = SYSTEM_PROCESSES.filter(p => p.automation_percentage < 100)

  // Sort by automation percentage (lowest first = highest priority)
  needsImprovement.sort((a, b) => a.automation_percentage - b.automation_percentage)

  return needsImprovement.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    current_automation: p.automation_percentage,
    potential_savings: estimateTimeSavings(p),
    priority: calculatePriority(p),
    manual_steps: p.manual_steps_required || [],
  }))
}

function estimateTimeSavings(process: ProcessStatus): string {
  // Rough estimates based on process type and frequency
  const frequencyMap: Record<string, number> = {
    'Real-time': 0,
    'Every 5 minutes': 288, // 24h / 5min
    'Every hour at :00': 24,
    'Every hour at :05': 24,
    'Daily at midnight UTC': 1,
    'Daily at 00:05 UTC': 1,
    'Daily': 1,
    'Weekly': 0.14,
    'As needed': 2, // Estimate ~2 times per day
    'On signup': 5, // Estimate ~5 signups per day
    'On request': 1,
    'Immediately after draw': 25, // ~25 draws per day
  }

  const timesPerDay = frequencyMap[process.frequency] || 1
  const minutesPerExecution = process.category === 'marketing' ? 30 :
                               process.category === 'operations' ? 15 :
                               process.category === 'payments' ? 10 : 5

  const currentManualMinutes = (minutesPerExecution * timesPerDay * (100 - process.automation_percentage)) / 100
  const potentialSavings = Math.round(currentManualMinutes)

  if (potentialSavings > 60) {
    return `${Math.round(potentialSavings / 60)} hours/day`
  }
  return `${potentialSavings} minutes/day`
}

function calculatePriority(process: ProcessStatus): 'high' | 'medium' | 'low' {
  // High priority: manual processes that run frequently
  if (process.automation_percentage === 0 && ['Real-time', 'Every 5 minutes', 'Every hour at :00', 'Daily'].includes(process.frequency)) {
    return 'high'
  }

  // Medium priority: semi-automated or infrequent manual
  if (process.automation_percentage < 50) {
    return 'medium'
  }

  // Low priority: mostly automated
  return 'low'
}

/**
 * Get CRON job success rate (key indicator of automation health)
 */
export async function getCronJobSuccessRate() {
  try {
    const cronHealth = await getCronSystemHealth()

    if (!cronHealth) {
      return {
        success_rate: 100,
        total_jobs: 0,
        successful: 0,
        failed: 0,
        status: 'unknown' as const,
      }
    }

    // Calculate success rate from job health status
    const totalJobs = cronHealth.total_jobs || 0
    const healthyJobs = cronHealth.healthy || 0
    const successRate = totalJobs > 0 ? (healthyJobs / totalJobs) * 100 : 100

    return {
      success_rate: Number(successRate.toFixed(2)),
      total_jobs: totalJobs,
      successful: healthyJobs,
      failed: (cronHealth.degraded || 0) + (cronHealth.down || 0),
      status: successRate >= 99 ? 'healthy' as const :
              successRate >= 95 ? 'warning' as const : 'critical' as const,
    }
  } catch (error) {
    console.error('Error getting CRON success rate:', error)
    return {
      success_rate: 100,
      total_jobs: 0,
      successful: 0,
      failed: 0,
      status: 'unknown' as const,
    }
  }
}

/**
 * Get comprehensive automation metrics
 */
export async function getAutomationMetrics() {
  const [
    overallAutomation,
    categoryBreakdown,
    allProcesses,
    needsImprovement,
    cronSuccessRate,
  ] = await Promise.all([
    getAutomationPercentage(),
    getAutomationByCategory(),
    getAllProcesses(),
    getProcessesNeedingAutomation(),
    getCronJobSuccessRate(),
  ])

  return {
    overview: {
      overall_automation_percentage: overallAutomation.overall_percentage,
      total_processes: overallAutomation.total_processes,
      fully_automated: overallAutomation.fully_automated,
      semi_automated: overallAutomation.semi_automated,
      manual: overallAutomation.manual,
      status: overallAutomation.overall_percentage >= 70 ? 'excellent' :
              overallAutomation.overall_percentage >= 50 ? 'good' : 'needs_improvement',
    },
    by_category: categoryBreakdown,
    processes: {
      all: allProcesses,
      needs_improvement: needsImprovement,
      top_priority: needsImprovement.slice(0, 5),
    },
    cron_jobs: cronSuccessRate,
    recommendations: generateRecommendations(overallAutomation, categoryBreakdown, needsImprovement),
    timestamp: new Date().toISOString(),
  }
}

function generateRecommendations(
  overall: Awaited<ReturnType<typeof getAutomationPercentage>>,
  categories: Awaited<ReturnType<typeof getAutomationByCategory>>,
  needsImprovement: Awaited<ReturnType<typeof getProcessesNeedingAutomation>>
) {
  const recommendations: string[] = []

  // Overall recommendations
  if (overall.overall_percentage < 50) {
    recommendations.push('Focus on automating core processes to reduce manual work')
  }

  // Category-specific recommendations
  categories.forEach(cat => {
    if (cat.automation_percentage < 50) {
      recommendations.push(`Improve automation in ${cat.category} (currently ${cat.automation_percentage}%)`)
    }
  })

  // Process-specific recommendations
  const highPriority = needsImprovement.filter(p => p.priority === 'high')
  if (highPriority.length > 0) {
    recommendations.push(`Automate ${highPriority[0].name} to save ${highPriority[0].potential_savings}`)
  }

  // If already highly automated
  if (overall.overall_percentage >= 80) {
    recommendations.push('Excellent automation! Focus on monitoring and optimization')
  }

  return recommendations
}

/**
 * Get automation metrics summary for dashboard
 */
export async function getAutomationMetricsSummary() {
  const metrics = await getAutomationMetrics()

  return {
    automation_percentage: `${metrics.overview.overall_automation_percentage}%`,
    automation_status: metrics.overview.status,
    fully_automated: metrics.overview.fully_automated,
    needs_improvement: metrics.processes.needs_improvement.length,
    cron_success_rate: `${metrics.cron_jobs.success_rate}%`,
    top_recommendation: metrics.recommendations[0] || 'All systems optimized',
  }
}
