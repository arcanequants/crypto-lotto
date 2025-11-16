'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle2, XCircle, RefreshCw, Activity, Database, Zap, Wallet } from 'lucide-react'

interface HealthData {
  timestamp: string
  overall_status: string
  metrics: any
  crons: any
  system: any
  environment: any
  events: any
  alerts: any[]
}

export default function AdminHealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealthData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/health')
      if (!response.ok) throw new Error('Failed to fetch health data')
      const data = await response.json()
      setHealthData(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchHealthData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [autoRefresh])

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading health data...</p>
        </div>
      </div>
    )
  }

  if (error && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              Error Loading Health Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchHealthData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!healthData) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Report</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(healthData.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchHealthData} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={getStatusColor(healthData.overall_status)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthData.overall_status)}
            Overall System Status: {healthData.overall_status.toUpperCase()}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {healthData.alerts && healthData.alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Active Alerts</h2>
          {healthData.alerts.map((alert: any, idx: number) => (
            <Card key={idx} className={getAlertColor(alert.severity)}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {alert.title}
                </CardTitle>
                <CardDescription>{alert.message}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crons">Cron Jobs</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.metrics.revenue.totalFormatted}</div>
                <p className="text-xs text-muted-foreground">Platform + Prizes</p>
              </CardContent>
            </Card>

            {/* Users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.metrics.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  Active: {healthData.metrics.users.active}
                </p>
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.metrics.tickets.total}</div>
                <p className="text-xs text-muted-foreground">
                  H: {healthData.metrics.tickets.hourly} | D: {healthData.metrics.tickets.daily}
                </p>
              </CardContent>
            </Card>

            {/* Executor Balance */}
            <Card className={healthData.system.executor.low_balance_warning ? 'border-red-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Executor Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.system.executor.balance_formatted}</div>
                <p className="text-xs text-muted-foreground">
                  {healthData.system.executor.low_balance_warning ? 'LOW BALANCE!' : 'OK'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cron Jobs Tab */}
        <TabsContent value="crons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cron Jobs Status</CardTitle>
              <CardDescription>
                {healthData.crons.healthy} healthy, {healthData.crons.degraded} degraded, {healthData.crons.down} down
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {healthData.crons.jobs.map((job: any) => (
                  <div key={job.job_name} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{job.job_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last: {job.last_execution ? new Date(job.last_execution).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getJobStatusVariant(job.status)}>{job.status}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        Uptime: {job.uptime_percentage}% ({job.total_executions} runs)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Failures */}
          {healthData.crons.recent_failures && healthData.crons.recent_failures.length > 0 && (
            <Card className="border-red-500">
              <CardHeader>
                <CardTitle className="text-red-500">Recent Failures (Last 24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {healthData.crons.recent_failures.map((failure: any) => (
                    <div key={failure.id} className="p-3 border border-red-200 rounded">
                      <div className="font-medium">{failure.job_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(failure.execution_time).toLocaleString()}
                      </div>
                      {failure.error_message && (
                        <div className="text-sm text-red-500 mt-1">{failure.error_message}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge variant={healthData.system.database.status === 'healthy' ? 'default' : 'destructive'}>
                      {healthData.system.database.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Configured</span>
                    <span>{healthData.environment.supabase_configured ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RPC */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Base RPC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge variant={healthData.system.rpc.status === 'healthy' ? 'default' : 'destructive'}>
                      {healthData.system.rpc.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Block Number</span>
                    <span>{healthData.system.rpc.block_number.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract */}
            <Card>
              <CardHeader>
                <CardTitle>Smart Contract</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <Badge>{healthData.system.contract.status}</Badge>
                  </div>
                  <div className="text-sm break-all">
                    <span className="text-muted-foreground">Address:</span><br />
                    <code className="text-xs">{healthData.system.contract.address}</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Environment */}
            <Card>
              <CardHeader>
                <CardTitle>Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Environment</span>
                    <Badge variant="outline">{healthData.environment.vercel_env}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Region</span>
                    <span>{healthData.environment.vercel_region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Node Version</span>
                    <span>{healthData.environment.node_version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Last 50 system events | Unresolved: {healthData.events.total_unresolved}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthData.events.recent && healthData.events.recent.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {healthData.events.recent.map((event: any) => (
                    <div key={event.id} className="p-3 border rounded">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(event.created_at).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant={getSeverityVariant(event.severity)}>{event.severity}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No events logged yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw JSON Data</CardTitle>
              <CardDescription>Complete health report for debugging</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-[600px] overflow-y-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'healthy':
      return 'border-green-500 bg-green-50'
    case 'degraded':
      return 'border-yellow-500 bg-yellow-50'
    case 'warning':
      return 'border-orange-500 bg-orange-50'
    case 'critical':
      return 'border-red-500 bg-red-50'
    default:
      return 'border-gray-500 bg-gray-50'
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'healthy':
      return <CheckCircle2 className="w-6 h-6 text-green-500" />
    case 'degraded':
    case 'warning':
      return <AlertCircle className="w-6 h-6 text-yellow-500" />
    case 'critical':
      return <XCircle className="w-6 h-6 text-red-500" />
    default:
      return <AlertCircle className="w-6 h-6 text-gray-500" />
  }
}

function getAlertColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'border-red-500 bg-red-50'
    case 'warning':
      return 'border-yellow-500 bg-yellow-50'
    case 'info':
      return 'border-blue-500 bg-blue-50'
    default:
      return 'border-gray-500 bg-gray-50'
  }
}

function getJobStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status.toLowerCase()) {
    case 'healthy':
      return 'default'
    case 'degraded':
      return 'secondary'
    case 'down':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function getSeverityVariant(severity: string): 'default' | 'destructive' | 'secondary' {
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'error':
      return 'destructive'
    case 'warning':
      return 'secondary'
    default:
      return 'default'
  }
}
