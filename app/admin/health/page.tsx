'use client'

import { useEffect, useState } from 'react'

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
  const [activeTab, setActiveTab] = useState('overview')

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⟳</div>
          <p>Loading health data...</p>
        </div>
      </div>
    )
  }

  if (error && !healthData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          backgroundColor: '#fff'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>⚠ Error Loading Health Data</h2>
          <p style={{ marginBottom: '16px', color: '#666' }}>{error}</p>
          <button
            onClick={fetchHealthData}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!healthData) return null

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy': return '#22c55e'
      case 'degraded': return '#eab308'
      case 'warning': return '#f97316'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusBgColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy': return '#f0fdf4'
      case 'degraded': return '#fefce8'
      case 'warning': return '#fff7ed'
      case 'critical': return '#fef2f2'
      default: return '#f9fafb'
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '8px' }}>System Health Report</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Last updated: {new Date(healthData.timestamp).toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {autoRefresh ? '✓ Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchHealthData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? '⟳ ' : '↻ '}Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div style={{
        border: `2px solid ${getStatusColor(healthData.overall_status)}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        backgroundColor: getStatusBgColor(healthData.overall_status)
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
          Overall System Status: {healthData.overall_status.toUpperCase()}
        </h2>
      </div>

      {/* Alerts */}
      {healthData.alerts && healthData.alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '16px' }}>Active Alerts</h2>
          {healthData.alerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              style={{
                border: `1px solid ${alert.severity === 'critical' ? '#ef4444' : '#eab308'}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '8px',
                backgroundColor: alert.severity === 'critical' ? '#fef2f2' : '#fefce8'
              }}
            >
              <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>⚠ {alert.title}</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb' }}>
          {['overview', 'crons', 'system', 'events', 'raw'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === tab ? '#f3f4f6' : 'transparent',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '600' : '400',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {/* Revenue */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>💰 Total Revenue</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{healthData.metrics.revenue.totalFormatted}</div>
              <p style={{ fontSize: '12px', color: '#999' }}>Platform + Prizes</p>
            </div>

            {/* Users */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>👥 Total Users</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{healthData.metrics.users.total}</div>
              <p style={{ fontSize: '12px', color: '#999' }}>Active: {healthData.metrics.users.active}</p>
            </div>

            {/* Tickets */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>🎫 Total Tickets</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{healthData.metrics.tickets.total}</div>
              <p style={{ fontSize: '12px', color: '#999' }}>
                H: {healthData.metrics.tickets.hourly} | D: {healthData.metrics.tickets.daily}
              </p>
            </div>

            {/* Executor Balance */}
            <div style={{
              border: `1px solid ${healthData.system.executor.low_balance_warning ? '#ef4444' : '#e5e7eb'}`,
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: healthData.system.executor.low_balance_warning ? '#fef2f2' : 'white'
            }}>
              <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>👛 Executor Balance</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{healthData.system.executor.balance_formatted}</div>
              <p style={{ fontSize: '12px', color: healthData.system.executor.low_balance_warning ? '#ef4444' : '#999' }}>
                {healthData.system.executor.low_balance_warning ? 'LOW BALANCE!' : 'OK'}
              </p>
            </div>
          </div>
        )}

        {/* Cron Jobs Tab */}
        {activeTab === 'crons' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Cron Jobs Status</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {healthData.crons.healthy} healthy, {healthData.crons.degraded} degraded, {healthData.crons.down} down
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {healthData.crons.jobs.map((job: any) => (
                <div key={job.job_name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{job.job_name}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Last: {job.last_execution ? new Date(job.last_execution).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: job.status === 'healthy' ? '#dcfce7' : job.status === 'degraded' ? '#fef3c7' : '#fee2e2',
                      color: job.status === 'healthy' ? '#166534' : job.status === 'degraded' ? '#854d0e' : '#991b1b'
                    }}>
                      {job.status}
                    </span>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      Uptime: {job.uptime_percentage}% ({job.total_executions} runs)
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Failures */}
            {healthData.crons.recent_failures && healthData.crons.recent_failures.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#ef4444' }}>
                  Recent Failures (Last 24h)
                </h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {healthData.crons.recent_failures.map((failure: any) => (
                    <div key={failure.id} style={{
                      padding: '12px',
                      border: '1px solid #fca5a5',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      backgroundColor: '#fef2f2'
                    }}>
                      <div style={{ fontWeight: '600' }}>{failure.job_name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {new Date(failure.execution_time).toLocaleString()}
                      </div>
                      {failure.error_message && (
                        <div style={{ fontSize: '14px', color: '#ef4444', marginTop: '4px' }}>
                          {failure.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Database */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>🗄️ Database</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Status</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: healthData.system.database.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                  color: healthData.system.database.status === 'healthy' ? '#166534' : '#991b1b'
                }}>
                  {healthData.system.database.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Configured</span>
                <span>{healthData.environment.supabase_configured ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* RPC */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>⚡ Base RPC</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Status</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: healthData.system.rpc.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                  color: healthData.system.rpc.status === 'healthy' ? '#166534' : '#991b1b'
                }}>
                  {healthData.system.rpc.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Block Number</span>
                <span>{healthData.system.rpc.block_number.toLocaleString()}</span>
              </div>
            </div>

            {/* Contract */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>📜 Smart Contract</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Status</span>
                <span>{healthData.system.contract.status}</span>
              </div>
              <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                <span style={{ color: '#666' }}>Address:</span><br />
                <code style={{ fontSize: '10px' }}>{healthData.system.contract.address}</code>
              </div>
            </div>

            {/* Environment */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>🌍 Environment</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Environment</span>
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {healthData.environment.vercel_env}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Region</span>
                <span>{healthData.environment.vercel_region}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Node Version</span>
                <span>{healthData.environment.node_version}</span>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Recent Events</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Last 50 system events | Unresolved: {healthData.events.total_unresolved}
              </p>
            </div>

            {healthData.events.recent && healthData.events.recent.length > 0 ? (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {healthData.events.recent.map((event: any) => (
                  <div key={event.id} style={{
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{event.title}</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>{event.description}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          {new Date(event.created_at).toLocaleString()}
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: event.severity === 'critical' || event.severity === 'error' ? '#fee2e2' : event.severity === 'warning' ? '#fef3c7' : '#dbeafe',
                        color: event.severity === 'critical' || event.severity === 'error' ? '#991b1b' : event.severity === 'warning' ? '#854d0e' : '#1e40af'
                      }}>
                        {event.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '48px 0' }}>No events logged yet</p>
            )}
          </div>
        )}

        {/* Raw Data Tab */}
        {activeTab === 'raw' && (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Raw JSON Data</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Complete health report for debugging
            </p>
            <pre style={{
              fontSize: '12px',
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              maxHeight: '600px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb'
            }}>
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
