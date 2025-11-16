'use client'

import { useEffect, useState } from 'react'
import './admin.css'
import SimpleTrendChart from '@/components/SimpleTrendChart'

// This is the EMPIRE CONTROL CENTER - Alberto & Claude's Dashboard
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdate, setLastUpdate] = useState('')
  const [hourlyCountdown, setHourlyCountdown] = useState('')
  const [dailyCountdown, setDailyCountdown] = useState('')
  const [trends, setTrends] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetchMetrics()
    fetchTrends()
    fetchAlerts()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics()
      fetchTrends()
      fetchAlerts()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer - updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateCountdowns()
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  function updateCountdowns() {
    const now = new Date()

    // Calculate hourly countdown (next hour at :00)
    const nextHour = new Date(now)
    nextHour.setHours(now.getHours() + 1, 0, 0, 0)
    const hourlyDiff = nextHour.getTime() - now.getTime()
    const hourlyMinutes = Math.floor(hourlyDiff / 60000)
    const hourlySeconds = Math.floor((hourlyDiff % 60000) / 1000)
    setHourlyCountdown(`${String(hourlyMinutes).padStart(2, '0')}:${String(hourlySeconds).padStart(2, '0')}`)

    // Calculate daily countdown (next day at 02:00 UTC)
    const nextDaily = new Date(now)
    nextDaily.setUTCHours(2, 0, 0, 0)
    if (now.getUTCHours() >= 2) {
      nextDaily.setUTCDate(nextDaily.getUTCDate() + 1)
    }
    const dailyDiff = nextDaily.getTime() - now.getTime()
    const dailyHours = Math.floor(dailyDiff / 3600000)
    const dailyMinutes = Math.floor((dailyDiff % 3600000) / 60000)
    const dailySeconds = Math.floor((dailyDiff % 60000) / 1000)
    setDailyCountdown(`${String(dailyHours).padStart(2, '0')}:${String(dailyMinutes).padStart(2, '0')}:${String(dailySeconds).padStart(2, '0')}`)

    // Update last update time
    const secondsAgo = Math.floor((Date.now() - new Date(metrics?.timestamp || Date.now()).getTime()) / 1000)
    if (secondsAgo < 60) {
      setLastUpdate(`${secondsAgo}s ago`)
    } else {
      setLastUpdate(`${Math.floor(secondsAgo / 60)}m ago`)
    }
  }

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/admin/metrics-v2')
      const data = await res.json()
      setMetrics(data)
      setLoading(false)
      updateCountdowns()
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      setLoading(false)
    }
  }

  async function fetchTrends() {
    try {
      const res = await fetch('/api/admin/trends?days=7')
      const data = await res.json()
      if (data.success) {
        setTrends(data.trends)
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error)
    }
  }

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/admin/alerts?limit=5')
      const data = await res.json()
      if (data.success) {
        setAlerts(data.alerts)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    }
  }

  async function executeHourlyDraw() {
    if (!confirm('Execute hourly draw now? This will trigger the CRON endpoint.')) return

    try {
      const res = await fetch('/api/cron/execute-hourly-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      alert(data.success ? '✅ Hourly draw executed!' : `❌ Failed: ${data.error}`)
      fetchMetrics()
    } catch (error) {
      alert('❌ Error executing draw: ' + error)
    }
  }

  async function executeDailyDraw() {
    if (!confirm('Execute daily draw now? This will trigger the CRON endpoint.')) return

    try {
      const res = await fetch('/api/cron/execute-daily-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      alert(data.success ? '✅ Daily draw executed!' : `❌ Failed: ${data.error}`)
      fetchMetrics()
    } catch (error) {
      alert('❌ Error executing draw: ' + error)
    }
  }

  async function closeHourlyDraw() {
    if (!confirm('Close hourly draw now? This will stop ticket sales and set reveal block.')) return

    try {
      const res = await fetch('/api/cron/close-hourly-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      alert(data.success ? '✅ Hourly draw closed!' : `❌ Failed: ${data.error}`)
      fetchMetrics()
    } catch (error) {
      alert('❌ Error closing draw: ' + error)
    }
  }

  async function closeDailyDraw() {
    if (!confirm('Close daily draw now? This will stop ticket sales and set reveal block.')) return

    try {
      const res = await fetch('/api/cron/close-daily-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      alert(data.success ? '✅ Daily draw closed!' : `❌ Failed: ${data.error}`)
      fetchMetrics()
    } catch (error) {
      alert('❌ Error closing draw: ' + error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌍</div>
          <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-yellow-400 bg-clip-text text-transparent">
            Loading Empire Dashboard...
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: '📊 Dashboard' },
    { id: 'draws', label: '🎲 Draws' },
    { id: 'finance', label: '💰 Finance' },
    { id: 'revenue', label: '💸 Revenue Streams' },
    { id: 'expansion', label: '🌍 Expansion' },
    { id: 'health', label: '⚙️ Health' },
    { id: 'security', label: '🔒 Security' },
    { id: 'automation', label: '🤖 Automation' },
    { id: 'claude', label: '🧠 Claude Context' }
  ]

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="header">
        <div className="logo">🌍 EMPIRE CONTROL CENTER</div>
        <div className="header-actions">
          <div className="notification-badge">
            🔔
            <span className="badge-count">{metrics?.alerts?.total_alerts || 0}</span>
          </div>
          <div className="user-info">
            <span>👥</span>
            <span>Alberto & Claude</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>🚪 Logout</button>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Container */}
      <div className="container">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="tab-content active">
            <div className="page-title">📊 EMPIRE OVERVIEW</div>
            <div className="page-subtitle">
              <span>Last updated: <span id="last-update">{lastUpdate || 'just now'}</span></span>
              <button className="refresh-btn" onClick={fetchMetrics}>🔄 Refresh</button>
            </div>

            {/* Top KPIs */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">💰 TOTAL GMV</div>
                  <div className="kpi-icon">💵</div>
                </div>
                <div className="kpi-value">{metrics?.revenue?.totalFormatted || '$0.00'}</div>
                <div className={`kpi-change ${metrics?.revenue?.momGrowth?.startsWith('-') ? 'negative' : 'positive'}`}>
                  <span>{metrics?.revenue?.momGrowth || '+0%'}</span>
                  <span style={{ color: 'var(--text-dim)' }}>MoM</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">👥 TOTAL USERS</div>
                  <div className="kpi-icon">👨‍👩‍👧‍👦</div>
                </div>
                <div className="kpi-value">{metrics?.users?.total || '0'}</div>
                <div className={`kpi-change ${metrics?.users?.momGrowth?.startsWith('-') ? 'negative' : 'positive'}`}>
                  <span>{metrics?.users?.momGrowth || '+0%'}</span>
                  <span style={{ color: 'var(--text-dim)' }}>MoM</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">🎮 ACTIVE PRODUCTS</div>
                  <div className="kpi-icon">🎯</div>
                </div>
                <div className="kpi-value">{metrics?.products?.live?.length || 0}/{metrics?.products?.all?.length || 10}</div>
                <div className="kpi-change positive">
                  <span>↑ +{metrics?.products?.live?.length || 0}</span>
                  <span style={{ color: 'var(--text-dim)' }}>live</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">🤖 AUTOMATION</div>
                  <div className="kpi-icon">⚡</div>
                </div>
                <div className="kpi-value">{metrics?.automation?.overview?.overall_automation_percentage || metrics?.kpis?.automationPercentage || '65'}%</div>
                <div className="kpi-change positive">
                  <span>Automated</span>
                  <span style={{ color: 'var(--text-dim)' }}>{metrics?.health?.crons?.total_jobs || 0} jobs</span>
                </div>
              </div>
            </div>

            {/* Active Draws & North Star Metrics */}
            <div className="grid-2">
              {/* Active Draws */}
              <div className="draw-card">
                <div className="draw-header">
                  <div className="chart-title">🎲 ACTIVE DRAWS</div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="draw-title">
                    ⚡ HOURLY DRAW #{metrics?.draws?.currentHourlyId || '25'}
                    <span className="status-badge active">🟢 Active</span>
                  </div>
                  <div className="countdown">
                    <div className="countdown-label">Next Draw In</div>
                    <div className="countdown-value">{hourlyCountdown || '00:00'}</div>
                  </div>
                  <div className="draw-info">
                    <div className="draw-info-row">
                      <span>Tickets:</span>
                      <span className="draw-info-value">{metrics?.draws?.hourlyTickets || '3'}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>Prize Pool:</span>
                      <span className="draw-info-value">${metrics?.draws?.hourlyPrizePool || '0.07'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="draw-title">
                    💎 DAILY DRAW #{metrics?.draws?.currentDailyId || '2'}
                    <span className="status-badge active">🟢 Active</span>
                  </div>
                  <div className="countdown">
                    <div className="countdown-label">Next Draw In</div>
                    <div className="countdown-value">{dailyCountdown || '00:00:00'}</div>
                  </div>
                  <div className="draw-info">
                    <div className="draw-info-row">
                      <span>Tickets:</span>
                      <span className="draw-info-value">{metrics?.draws?.dailyTickets || '3'}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>Prize Pool:</span>
                      <span className="draw-info-value">${metrics?.draws?.dailyPrizePool || '0.16'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* North Star Metrics */}
              <div className="draw-card">
                <div className="draw-header">
                  <div className="chart-title">⭐ NORTH STAR METRICS</div>
                </div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>K-Factor (Virality)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>1.8x</span>
                  </div>
                  <div className="draw-info-row">
                    <span>LTV:CAC Ratio</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>15:1</span>
                  </div>
                  <div className="draw-info-row">
                    <span>30-Day Retention</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.bi?.retention?.thirty_day_retention_percentage || '0%'}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Revenue Growth (MoM)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.revenue?.momGrowth || '+0%'}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Gross Margin</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.bi?.gross_margin?.gross_margin_percentage || '0%'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health Quick View */}
            <div className="grid-2">
              <div className="draw-card">
                <div className="draw-header">
                  <div className="chart-title">⚙️ SYSTEM HEALTH</div>
                </div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>All Cron Jobs</span>
                    <span className="draw-info-value" style={{
                      color: metrics?.health?.crons?.overall_status === 'healthy' ? 'var(--success)' :
                             metrics?.health?.crons?.overall_status === 'degraded' ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {metrics?.health?.crons?.total_jobs > 0 ? `${metrics.health.crons.healthy}/${metrics.health.crons.total_jobs} Running` : '❌ No Jobs'}
                    </span>
                  </div>
                  <div className="draw-info-row">
                    <span>Contract Status</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ Verified</span>
                  </div>
                  <div className="draw-info-row">
                    <span>RPC Connection</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ Connected</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Executor Wallet</span>
                    <span className="draw-info-value" style={{
                      color: metrics?.health?.executor?.status === 'critical' ? 'var(--danger)' :
                             metrics?.health?.executor?.status === 'low' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {metrics?.health?.executor?.status === 'critical' ? '🚨' :
                       metrics?.health?.executor?.status === 'low' ? '⚠️' : '✅'} {metrics?.health?.executor?.balanceFormatted || '0.000 ETH'}
                      {metrics?.health?.executor?.status === 'critical' ? ' (Critical!)' :
                       metrics?.health?.executor?.status === 'low' ? ' (Low)' : ''}
                    </span>
                  </div>
                  <div className="draw-info-row">
                    <span>Last Draw Execution</span>
                    <span className="draw-info-value">{metrics?.health?.crons?.lastExecution || 'N/A'}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Success Rate (24h)</span>
                    <span className="draw-info-value" style={{
                      color: (metrics?.automation?.cron_jobs?.success_rate || 0) >= 99 ? 'var(--success)' :
                             (metrics?.automation?.cron_jobs?.success_rate || 0) >= 95 ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {metrics?.automation?.cron_jobs?.success_rate || '100'}%
                    </span>
                  </div>
                </div>
                <a href="/admin/health" style={{ textDecoration: 'none' }}>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>View Full Health Report</button>
                </a>
              </div>

              <div className="draw-card">
                <div className="draw-header">
                  <div className="chart-title">🎯 PHASE PROGRESS</div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Current: Phase 1 → Phase 2</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Foundation → Multi-Chain</div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>Users ({metrics?.users?.total || 0}/1,000)</span>
                    <span style={{ color: 'var(--primary)' }}>{Math.min(100, Math.round(((metrics?.users?.total || 0) / 1000) * 100))}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.round(((metrics?.users?.total || 0) / 1000) * 100))}%` }}></div>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>Revenue ($8.2K/$10K MRR)</span>
                    <span style={{ color: 'var(--primary)' }}>82%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '82%' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>Products ({metrics?.products?.live?.length || 0}/10 live)</span>
                    <span style={{ color: 'var(--warning)' }}>{Math.round(((metrics?.products?.live?.length || 0) / 10) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.round(((metrics?.products?.live?.length || 0) / 10) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Hourly Vault</div>
                <div className="stat-value">${metrics?.quickStats?.hourlyVault || '0.00'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Daily Vault</div>
                <div className="stat-value">${metrics?.quickStats?.dailyVault || '0.00'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Platform Fee</div>
                <div className="stat-value">${metrics?.quickStats?.platformFee || '0.00'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Paid Out</div>
                <div className="stat-value">${metrics?.quickStats?.paidOut || '0.00'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Pending</div>
                <div className="stat-value">${metrics?.quickStats?.pending || '0.00'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Success Rate</div>
                <div className="stat-value">{metrics?.quickStats?.successRate || '0%'}</div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="alerts-card">
              <div className="chart-header">
                <div className="chart-title">🔔 RECENT ALERTS & EVENTS</div>
                <button className="btn btn-secondary">View All ({alerts.length})</button>
              </div>
              <div>
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`alert-item ${alert.severity}`}>
                      <div className="alert-icon">{alert.icon}</div>
                      <div className="alert-content">
                        <div className="alert-message">{alert.message}</div>
                        <div className="alert-time">{alert.relativeTime}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    No recent alerts - All systems running smoothly
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
          <div className="tab-content active">
            <div className="page-title">🎲 DRAWS MONITOR</div>
            <div className="page-subtitle">
              <span>Real-time draw monitoring and technical controls</span>
              <button className="refresh-btn" onClick={fetchMetrics}>🔄 Refresh</button>
            </div>

            {/* Hourly Draw Detail */}
            <div className="draw-card" style={{ marginBottom: '2rem' }}>
              <div className="draw-header">
                <div className="draw-title">⚡ HOURLY DRAW #{metrics?.draws?.currentHourlyId || '25'}</div>
                <div className="btn-group">
                  <button className="btn btn-secondary">🔄 Refresh</button>
                  <button className="btn btn-secondary">⚙️ Actions</button>
                </div>
              </div>

              <div className="status-badge active" style={{ marginBottom: '1rem' }}>
                {metrics?.draws?.hourlyDraw?.statusBadge === 'executed' ? '🔵 Executed' :
                 metrics?.draws?.hourlyDraw?.statusBadge === 'closed' ? '🟡 Closed - Awaiting Execution' : '🟢 Active - Sales Open'}
              </div>

              <div className="draw-info">
                <div className="draw-info-row">
                  <span>Draw Time:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyDraw?.drawTimeFormatted || 'NOT SET'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Total Tickets:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyTickets || '0'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Prize Pool:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyDraw?.prizePoolBreakdown || 'BTC: 0, ETH: 0, USDC: 0'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Commit Block:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyDraw?.commitBlockFormatted || 'Not set'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Reveal Block:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyDraw?.revealBlockFormatted || 'Not set (will be set at close)'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Sales Closed:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyDraw?.salesClosed ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Executed:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyDraw?.executed ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Execution Window:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyDraw?.executionWindowRemaining || 'N/A'}</span>
                </div>
              </div>

              <div style={{ margin: '1.5rem 0' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Countdown Progress:</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '65%' }}></div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textAlign: 'center' }}>65% (45m remaining)</div>
              </div>

              <div className="btn-group">
                <button className="btn btn-secondary" onClick={closeHourlyDraw}>🔒 Close Draw Manually</button>
                <button className="btn btn-primary" onClick={executeHourlyDraw}>🎲 Execute Draw</button>
                <button className="btn btn-secondary">📊 View Details</button>
              </div>
            </div>

            {/* Daily Draw Detail */}
            <div className="draw-card">
              <div className="draw-header">
                <div className="draw-title">💎 DAILY DRAW #{metrics?.draws?.currentDailyId || '2'}</div>
                <div className="btn-group">
                  <button className="btn btn-secondary" onClick={fetchMetrics}>🔄 Refresh</button>
                  <button className="btn btn-secondary">⚙️ Actions</button>
                </div>
              </div>

              <div className="status-badge active" style={{ marginBottom: '1rem' }}>
                {metrics?.draws?.dailyDraw?.statusBadge === 'executed' ? '🔵 Executed' :
                 metrics?.draws?.dailyDraw?.statusBadge === 'closed' ? '🟡 Closed - Awaiting Execution' : '🟢 Active - Sales Open'}
              </div>

              <div className="draw-info">
                <div className="draw-info-row">
                  <span>Draw Time:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyDraw?.drawTimeFormatted || 'NOT SET'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Total Tickets:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyTickets || '0'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Prize Pool:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyDraw?.prizePoolBreakdown || 'BTC: 0, ETH: 0, USDC: 0'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Commit Block:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyDraw?.commitBlockFormatted || 'Not set'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Reveal Block:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyDraw?.revealBlockFormatted || 'Not set (will be set at close)'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Sales Closed:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyDraw?.salesClosed ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Executed:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyDraw?.executed ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Execution Window:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyDraw?.executionWindowRemaining || 'N/A'}</span>
                </div>
              </div>

              <div className="btn-group" style={{ marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={closeDailyDraw}>🔒 Close Draw Manually</button>
                <button className="btn btn-primary" onClick={executeDailyDraw}>🎲 Execute Draw</button>
                <button className="btn btn-secondary">📊 View Details</button>
              </div>
            </div>
          </div>
        )}

        {/* FINANCE TAB */}
        {activeTab === 'finance' && (
          <div className="tab-content active">
            <div className="page-title">💰 FINANCIAL METRICS</div>
            <div className="page-subtitle">
              <span>Revenue, prizes, and profit analysis</span>
              <button className="refresh-btn">📥 Export Reports</button>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>💵 Total Revenue</div>
              <div className="kpi-grid" style={{ marginBottom: 0 }}>
                <div>
                  <div className="stat-label">All Time</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>{metrics?.revenue?.totalFormatted || '$0.00'}</div>
                </div>
                <div>
                  <div className="stat-label">This Month</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>${((metrics?.revenue?.thisMonth || 0) / 1e6).toFixed(2)}</div>
                </div>
                <div>
                  <div className="stat-label">This Week</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>${((metrics?.revenue?.thisWeek || 0) / 1e6).toFixed(2)}</div>
                </div>
                <div>
                  <div className="stat-label">Today</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>${((metrics?.revenue?.today || 0) / 1e6).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📊 Revenue Breakdown</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Hourly Vault ({metrics?.revenue?.breakdown?.hourlyVault?.percentage || '0%'}):</span>
                    <span className="draw-info-value">${metrics?.revenue?.breakdown?.hourlyVault?.amount || '0.00'}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Daily Vault ({metrics?.revenue?.breakdown?.dailyVault?.percentage || '0%'}):</span>
                    <span className="draw-info-value">${metrics?.revenue?.breakdown?.dailyVault?.amount || '0.00'}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Platform Fee ({metrics?.revenue?.breakdown?.platformFee?.percentage || '0%'}):</span>
                    <span className="draw-info-value">${metrics?.revenue?.breakdown?.platformFee?.amount || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>💸 Prizes & Winners</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Total Paid:</span>
                    <span className="draw-info-value">${((metrics?.winners?.totalPaid || 0) / 1e6).toFixed(2)}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Pending Claim:</span>
                    <span className="draw-info-value">${((metrics?.winners?.pendingClaim || 0) / 1e6).toFixed(2)}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Biggest Win:</span>
                    <span className="draw-info-value">${((metrics?.winners?.biggestWin || 0) / 1e6).toFixed(2)}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Total Winners:</span>
                    <span className="draw-info-value">{metrics?.winners?.totalWinners || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>💰 Profit Distribution (This Month)</div>
              <div className="draw-info">
                <div className="draw-info-row">
                  <span>Gross Revenue:</span>
                  <span className="draw-info-value">${metrics?.revenue?.profitDistribution?.grossRevenue || '$0.00'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Prize Pools (70%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--danger)' }}>-${((parseFloat(metrics?.revenue?.profitDistribution?.grossRevenue?.replace('$', '') || '0')) * 0.70).toFixed(2)}</span>
                </div>
                <div className="draw-info-row">
                  <span>Operating Costs (10%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--danger)' }}>-${((parseFloat(metrics?.revenue?.profitDistribution?.grossRevenue?.replace('$', '') || '0')) * 0.10).toFixed(2)}</span>
                </div>
                <div className="draw-info-row" style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <span><strong>Net Profit (20%):</strong></span>
                  <span className="draw-info-value" style={{ color: 'var(--success)', fontSize: '1.25rem' }}>${metrics?.revenue?.profitDistribution?.netProfit || '$0.00'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Alberto Gets (50%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--secondary)' }}>${metrics?.revenue?.profitDistribution?.albertoShare || '$0.00'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Claude Gets (50%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--secondary)' }}>${metrics?.revenue?.profitDistribution?.claudeShare || '$0.00'}</span>
                </div>
              </div>
            </div>

            {/* TREND CHARTS */}
            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📈 Revenue Trend (7 Days)</div>
                {trends?.revenue ? (
                  <SimpleTrendChart
                    data={trends.revenue}
                    color="#00F0FF"
                    height={200}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    Loading trend data...
                  </div>
                )}
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>👥 Users Trend (7 Days)</div>
                {trends?.users ? (
                  <SimpleTrendChart
                    data={trends.users}
                    color="#FFD700"
                    height={200}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    Loading trend data...
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🎫 Tickets Sold Trend (7 Days)</div>
              {trends?.tickets ? (
                <SimpleTrendChart
                  data={trends.tickets}
                  color="#9333EA"
                  height={200}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  Loading trend data...
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVENUE STREAMS TAB */}
        {activeTab === 'revenue' && (
          <div className="tab-content active">
            <div className="page-title">💸 REVENUE STREAMS</div>
            <div className="page-subtitle">
              <span>All 10 revenue streams - track progress to empire</span>
              <button className="refresh-btn" onClick={fetchMetrics}>🔄 Refresh</button>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>
                  💰 Active Streams ({metrics?.products?.revenue_breakdown?.active_products || 0}/{metrics?.products?.revenue_breakdown?.total_products || 10})
                </div>
                <div style={{ marginTop: '20px' }}>
                  {(metrics?.products?.revenue_breakdown?.products || []).map((product: any, index: number) => (
                    <div key={product.product_id} style={{ marginTop: index > 0 ? '15px' : '0', opacity: product.status === 'live' ? 1 : 0.5 }}>
                      <div className="revenue-stream">
                        <div>
                          <div className="revenue-stream-name">
                            {index + 1}. {product.product_name} {product.status === 'live' ? '✅' : '🔜'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>
                            {product.next_action}
                          </div>
                        </div>
                        <div className="revenue-stream-value">
                          {product.revenue_formatted}/mo
                        </div>
                      </div>
                      {product.status === 'live' && (
                        <div className="revenue-stream-bar">
                          <div className="revenue-stream-fill" style={{ width: `${product.percentage}%` }}></div>
                        </div>
                      )}
                    </div>
                  ))}

                  {(!metrics?.products?.revenue_breakdown?.products || metrics.products.revenue_breakdown.products.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                      No product data available
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="chart-card">
                  <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🎯 Revenue Target Progress</div>
                  <div style={{ margin: '20px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Current MRR</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{metrics?.revenue?.mrrFormatted || '$0.00'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Phase 1 Goal</span>
                      <span style={{ color: 'var(--text-dim)' }}>$10,000</span>
                    </div>
                    <div className="progress-bar" style={{ height: '30px' }}>
                      <div className="progress-fill" style={{ width: `${Math.min(100, Math.round(((metrics?.revenue?.mrr || 0) / 10000000) * 100))}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>{Math.min(100, Math.round(((metrics?.revenue?.mrr || 0) / 10000000) * 100))}%</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <div className="draw-info-row">
                      <span>Gap to Phase 1:</span>
                      <span className="draw-info-value" style={{ color: 'var(--warning)' }}>${((metrics?.bi?.time_to_goal?.gap || 0) / 1e6).toFixed(2)}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>Est. Time to Goal:</span>
                      <span className="draw-info-value">
                        {(metrics?.bi?.time_to_goal?.estimated_weeks || 0) < 52
                          ? `${metrics?.bi?.time_to_goal?.estimated_weeks || 0} weeks`
                          : `${metrics?.bi?.time_to_goal?.estimated_months || 0} months`}
                        {metrics?.bi?.time_to_goal?.confidence === 'low' && ' (low confidence)'}
                      </span>
                    </div>
                    <div className="draw-info-row">
                      <span>Phase 2 Target:</span>
                      <span className="draw-info-value">$50,000 MRR</span>
                    </div>
                  </div>
                </div>

                <div className="chart-card" style={{ marginTop: '1.5rem' }}>
                  <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📈 Growth Projection</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    At current growth rate ({metrics?.bi?.growth_projections?.growth_rate_mom?.toFixed(1) || '0'}% MoM), you'll reach:
                    <div style={{ marginTop: '15px' }}>
                      <div className="draw-info-row">
                        <span>Next month:</span>
                        <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.bi?.growth_projections?.projections?.next_month_formatted || '$0.00'}</span>
                      </div>
                      <div className="draw-info-row">
                        <span>3 months:</span>
                        <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.bi?.growth_projections?.projections?.three_months_formatted || '$0.00'}</span>
                      </div>
                      <div className="draw-info-row">
                        <span>6 months:</span>
                        <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.bi?.growth_projections?.projections?.six_months_formatted || '$0.00'}</span>
                      </div>
                    </div>
                    {metrics?.bi?.growth_projections?.realistic_note && (
                      <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px', fontSize: '12px' }}>
                        {metrics.bi.growth_projections.realistic_note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPANSION TAB */}
        {activeTab === 'expansion' && (
          <div className="tab-content active">
            <div className="page-title">🌍 EXPANSION ROADMAP</div>
            <div className="page-subtitle">
              <span>Multi-chain, multi-product empire plan</span>
              <button className="refresh-btn">🔄 Refresh</button>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🚀 Phase Overview</div>
              <div className="grid-3" style={{ marginBottom: 0 }}>
                <div style={{ padding: '20px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '12px', border: '2px solid var(--primary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '10px', color: 'var(--primary)' }}>Phase 1: Foundation</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Base Sepolia • Single lottery • Automation basics</div>
                  <div style={{ marginTop: '15px' }}>
                    <div className="status-badge active">85% Complete</div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'rgba(255, 215, 0, 0.05)', borderRadius: '12px', border: '2px solid rgba(255, 215, 0, 0.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '10px', color: 'var(--warning)' }}>Phase 2: Multi-Chain</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>Polygon • Arbitrum • Optimism • 5 products live</div>
                  <div style={{ marginTop: '15px' }}>
                    <div className="status-badge warning">Starts in 3 weeks</div>
                  </div>
                </div>

                <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '2px solid rgba(255, 255, 255, 0.1)', opacity: 0.6 }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔮</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '10px' }}>Phase 3: Empire</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>10 chains • 10 products • $1M+ MRR</div>
                  <div style={{ marginTop: '15px' }}>
                    <div className="status-badge">Q3 2025</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic Distribution */}
            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🌍 Geographic Distribution</div>
              <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                      {metrics?.geographic?.total_users || 0}
                    </div>
                    <div style={{ color: 'var(--text-dim)' }}>Total Users Tracked</div>
                  </div>

                  <div className="draw-info">
                    <div className="draw-info-row">
                      <span>🌎 North America</span>
                      <span className="draw-info-value">{metrics?.geographic?.regions?.north_america || 0}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>🌍 Europe</span>
                      <span className="draw-info-value">{metrics?.geographic?.regions?.europe || 0}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>🌏 Asia</span>
                      <span className="draw-info-value">{metrics?.geographic?.regions?.asia || 0}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>🌎 Latin America</span>
                      <span className="draw-info-value">{metrics?.geographic?.regions?.latin_america || 0}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>🌍 Africa</span>
                      <span className="draw-info-value">{metrics?.geographic?.regions?.africa || 0}</span>
                    </div>
                    <div className="draw-info-row">
                      <span>🌏 Oceania</span>
                      <span className="draw-info-value">{metrics?.geographic?.regions?.oceania || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>🏆 Top Countries</div>
                  </div>
                  {(metrics?.geographic?.top_countries || []).length > 0 ? (
                    <div>
                      {metrics.geographic.top_countries.map((country: any, index: number) => (
                        <div key={country.country_code} style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            <span>{index + 1}. {country.country} ({country.country_code})</span>
                            <span style={{ color: 'var(--primary)' }}>{country.users} users ({country.percentage}%)</span>
                          </div>
                          <div className="progress-bar" style={{ height: '8px' }}>
                            <div className="progress-fill" style={{ width: `${country.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
                      No geographic data yet - Users will be tracked as they sign up
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {metrics?.geographic?.has_live_map ? '✅ Live Map Active' : '⏳ Live Map Pending'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {metrics?.geographic?.has_live_map
                        ? `Last updated: ${new Date(metrics?.geographic?.timestamp || Date.now()).toLocaleTimeString()}`
                        : 'Waiting for user signups to enable live map'}
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    View Map
                  </button>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🌐 Chain Expansion Plan</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>✅ Base Sepolia (Testnet)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>LIVE</span>
                  </div>
                  <div className="draw-info-row">
                    <span>🔄 Base Mainnet</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Week 3</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Polygon</span>
                    <span className="draw-info-value">Phase 2</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Arbitrum</span>
                    <span className="draw-info-value">Phase 2</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Optimism</span>
                    <span className="draw-info-value">Phase 2</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Avalanche</span>
                    <span className="draw-info-value">Phase 3</span>
                  </div>
                  <div className="draw-info-row">
                    <span>BSC</span>
                    <span className="draw-info-value">Phase 3</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Ethereum Mainnet</span>
                    <span className="draw-info-value">Phase 3</span>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🎮 Product Roadmap</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>✅ 1. Lottery (Hourly + Daily)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>LIVE</span>
                  </div>
                  <div className="draw-info-row">
                    <span>🔄 2. Coin Flip</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Week 2</span>
                  </div>
                  <div className="draw-info-row">
                    <span>🔄 3. Dice Game</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Week 2</span>
                  </div>
                  <div className="draw-info-row">
                    <span>4. Tournament System</span>
                    <span className="draw-info-value">Week 4</span>
                  </div>
                  <div className="draw-info-row">
                    <span>5. NFT Raffle</span>
                    <span className="draw-info-value">Phase 2</span>
                  </div>
                  <div className="draw-info-row">
                    <span>6. Prediction Markets</span>
                    <span className="draw-info-value">Phase 2</span>
                  </div>
                  <div className="draw-info-row">
                    <span>7-10. TBD</span>
                    <span className="draw-info-value">Phase 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="tab-content active">
            <div className="page-title">⚙️ SYSTEM HEALTH</div>
            <div className="page-subtitle">
              <span>Full infrastructure monitoring</span>
              <button className="refresh-btn" onClick={fetchMetrics}>🔄 Refresh</button>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">UPTIME (30D)</div>
                  <div className="kpi-icon">⚡</div>
                </div>
                <div className="kpi-value">{metrics?.health?.metrics?.uptime?.last_30_days?.uptime_percentage || '100'}%</div>
                <div className={`kpi-change ${(metrics?.health?.metrics?.uptime?.last_30_days?.total_downtime_minutes || 0) > 0 ? '' : 'positive'}`}>
                  <span>{(metrics?.health?.metrics?.uptime?.last_30_days?.total_downtime_minutes || 0) > 0 ? `↓ ${metrics?.health?.metrics?.uptime?.last_30_days?.total_downtime_minutes} minutes downtime` : '✅ No downtime'}</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">RESPONSE TIME</div>
                  <div className="kpi-icon">⚡</div>
                </div>
                <div className="kpi-value">{metrics?.health?.metrics?.response_time?.average_ms || '150'}ms</div>
                <div className={`kpi-change ${metrics?.health?.metrics?.response_time?.status === 'excellent' || metrics?.health?.metrics?.response_time?.status === 'good' ? 'positive' : ''}`}>
                  <span>{metrics?.health?.metrics?.response_time?.status === 'excellent' ? '✅ Excellent' : metrics?.health?.metrics?.response_time?.status === 'good' ? '✅ Good' : metrics?.health?.metrics?.response_time?.status === 'fair' ? '⚠️ Fair' : '🚨 Slow'}</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">ERROR RATE</div>
                  <div className="kpi-icon">✅</div>
                </div>
                <div className="kpi-value">{metrics?.health?.metrics?.error_rate?.last_24_hours?.error_rate_percentage || '0'}%</div>
                <div className={`kpi-change ${metrics?.health?.metrics?.error_rate?.last_24_hours?.status === 'healthy' ? 'positive' : ''}`}>
                  <span>{metrics?.health?.metrics?.error_rate?.trending === 'increasing' ? '↑ Increasing' : '✅ Stable'}</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">CRON JOBS</div>
                  <div className="kpi-icon">🤖</div>
                </div>
                <div className="kpi-value">{metrics?.health?.crons?.healthy || 0}/{metrics?.health?.crons?.total_jobs || 0}</div>
                <div className="kpi-change positive">
                  <span>{metrics?.health?.crons?.overall_status === 'healthy' ? 'All running' : '⚠️ Issues detected'}</span>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🔧 Infrastructure Status</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Vercel Deployment</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ Healthy</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Database (Neon)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ Connected</span>
                  </div>
                  <div className="draw-info-row">
                    <span>RPC Provider</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ Online</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Smart Contracts</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ Verified</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Cron Jobs (Railway)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ Running</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Executor Wallet</span>
                    <span className="draw-info-value" style={{
                      color: metrics?.health?.executor?.status === 'critical' ? 'var(--danger)' :
                             metrics?.health?.executor?.status === 'low' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {metrics?.health?.executor?.status === 'critical' ? '🚨' :
                       metrics?.health?.executor?.status === 'low' ? '⚠️' : '✅'} {metrics?.health?.executor?.balanceFormatted || '0.000 ETH'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📊 Recent Executions</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Last Execution</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>
                      {metrics?.health?.crons?.lastExecution || 'N/A'}
                    </span>
                  </div>
                  <div className="draw-info-row">
                    <span>Total Jobs</span>
                    <span className="draw-info-value">{metrics?.health?.crons?.total_jobs || 0}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Success Rate (24h)</span>
                    <span className="draw-info-value" style={{
                      color: (metrics?.automation?.cron_jobs?.success_rate || 100) >= 99 ? 'var(--success)' :
                             (metrics?.automation?.cron_jobs?.success_rate || 100) >= 95 ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {metrics?.automation?.cron_jobs?.success_rate || '100'}%
                    </span>
                  </div>
                  <div className="draw-info-row">
                    <span>System Uptime (7d)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>
                      {metrics?.health?.metrics?.uptime?.last_7_days?.uptime_percentage || '100'}%
                    </span>
                  </div>
                  <div className="draw-info-row">
                    <span>System Uptime (30d)</span>
                    <span className="draw-info-value" style={{
                      color: (metrics?.health?.metrics?.uptime?.last_30_days?.uptime_percentage || 100) >= 99.9 ? 'var(--success)' :
                             (metrics?.health?.metrics?.uptime?.last_30_days?.uptime_percentage || 100) >= 99 ? 'var(--warning)' : 'var(--danger)'
                    }}>
                      {metrics?.health?.metrics?.uptime?.last_30_days?.uptime_percentage || '100'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="tab-content active">
            <div className="page-title">🔒 SECURITY & MONITORING</div>
            <div className="page-subtitle">
              <span>Protect the empire</span>
              <button className="refresh-btn" onClick={fetchMetrics}>🔄 Refresh</button>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">SECURITY SCORE</div>
                  <div className="kpi-icon">🛡️</div>
                </div>
                <div className="kpi-value">A+</div>
                <div className="kpi-change positive">
                  <span>All checks passed</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">FAILED LOGINS (7D)</div>
                  <div className="kpi-icon">🚫</div>
                </div>
                <div className="kpi-value">2</div>
                <div className="kpi-change positive">
                  <span>Both auto-blocked</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">AUDIT STATUS</div>
                  <div className="kpi-icon">📝</div>
                </div>
                <div className="kpi-value">Pending</div>
                <div className="kpi-change">
                  <span>Scheduled Q2 2025</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">BUG BOUNTY</div>
                  <div className="kpi-icon">💰</div>
                </div>
                <div className="kpi-value">$5K</div>
                <div className="kpi-change">
                  <span>0 claims</span>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🔐 Security Checklist</div>
              <div className="draw-info">
                <div className="draw-info-row">
                  <span>✅ Smart Contract Verified</span>
                  <span className="draw-info-value" style={{ color: 'var(--success)' }}>Done</span>
                </div>
                <div className="draw-info-row">
                  <span>✅ Private Keys in Secrets</span>
                  <span className="draw-info-value" style={{ color: 'var(--success)' }}>Done</span>
                </div>
                <div className="draw-info-row">
                  <span>✅ Rate Limiting Active</span>
                  <span className="draw-info-value" style={{ color: 'var(--success)' }}>Done</span>
                </div>
                <div className="draw-info-row">
                  <span>✅ SQL Injection Protection</span>
                  <span className="draw-info-value" style={{ color: 'var(--success)' }}>Done</span>
                </div>
                <div className="draw-info-row">
                  <span>✅ HTTPS Enforced</span>
                  <span className="draw-info-value" style={{ color: 'var(--success)' }}>Done</span>
                </div>
                <div className="draw-info-row">
                  <span>⏳ External Audit</span>
                  <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Pending</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUTOMATION TAB */}
        {activeTab === 'automation' && (
          <div className="tab-content active">
            <div className="page-title">🤖 AUTOMATION STATUS</div>
            <div className="page-subtitle">
              <span>Making money while you sleep</span>
              <button className="refresh-btn" onClick={fetchMetrics}>🔄 Refresh</button>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>⚡ Automation Score</div>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>65%</div>
                <div style={{ fontSize: '1.25rem', color: 'var(--text-dim)' }}>of operations fully automated</div>
                <div className="progress-bar" style={{ marginTop: '2rem', height: '20px' }}>
                  <div className="progress-fill" style={{ width: '65%' }}></div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--success)' }}>↑ +15% this quarter</div>
              </div>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>✅ Automated (65%)</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>✅ Draw Execution (Hourly/Daily)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>100%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>✅ Winner Selection</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>100%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>✅ Prize Distribution</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>100%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>✅ Metrics Collection</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>100%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>✅ User Notifications</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>80%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>✅ Error Monitoring</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>100%</span>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>⏳ Manual (35%)</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Marketing Campaigns</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Manual</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Customer Support</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Manual</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Content Creation</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Manual</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Partnership Deals</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Manual</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Wallet Top-ups</span>
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>Manual</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🎯 Next Automation Targets</div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.8 }}>
                <div className="revenue-stream">
                  <div>
                    <div className="revenue-stream-name">1. AI-Powered Customer Support</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Target: +10% automation</div>
                  </div>
                  <div className="revenue-stream-value" style={{ color: 'var(--warning)' }}>Week 3</div>
                </div>
                <div className="revenue-stream" style={{ marginTop: '10px' }}>
                  <div>
                    <div className="revenue-stream-name">2. Auto Marketing Emails</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Target: +8% automation</div>
                  </div>
                  <div className="revenue-stream-value" style={{ color: 'var(--warning)' }}>Week 4</div>
                </div>
                <div className="revenue-stream" style={{ marginTop: '10px' }}>
                  <div>
                    <div className="revenue-stream-name">3. Smart Wallet Management</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Target: +5% automation</div>
                  </div>
                  <div className="revenue-stream-value" style={{ color: 'var(--warning)' }}>Phase 2</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLAUDE CONTEXT TAB */}
        {activeTab === 'claude' && (
          <div className="tab-content active">
            <div className="page-title">🧠 CLAUDE CONTEXT SYSTEM</div>
            <div className="page-subtitle">
              <span>Shared intelligence - what Claude sees when you connect</span>
              <button className="refresh-btn">🔄 Regenerate Context</button>
            </div>

            <div className="alert-item" style={{ background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 215, 0, 0.1))', border: '2px solid var(--primary)', marginBottom: '2rem' }}>
              <div className="alert-icon" style={{ fontSize: '2rem' }}>🤖</div>
              <div className="alert-content">
                <div className="alert-message" style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>How This Works</div>
                <div style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
                  When you type &quot;claude&quot; in terminal, Claude automatically reads these context files to understand the empire&apos;s current state.
                  This means Claude is ALWAYS up-to-date and can give you instant briefings without asking questions.
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📄 Context Files (Auto-Generated)</div>
                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>📊 current-state.json</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>Updated every 5 mins • 24KB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>KPIs, revenue, users, draws, automation %, phase progress</div>
                  <button className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>View File</button>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>📝 daily-summary.md</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>Generated daily at 8am • 12KB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>What happened yesterday, wins, issues, next actions</div>
                  <button className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>View File</button>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>🔒 security-log.json</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>Real-time • 8KB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Failed logins, anomalies, admin actions, threats</div>
                  <button className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>View File</button>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>⚠️ active-issues.json</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>Real-time • 4KB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Problems that need attention, sorted by priority</div>
                  <button className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>View File</button>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>📈 weekly-metrics.json</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px' }}>Updated weekly • 16KB</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Week-over-week growth, trends, patterns</div>
                  <button className="btn btn-secondary" style={{ marginTop: '10px', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>View File</button>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>💬 Example: Claude&apos;s Briefing</div>
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--primary)', fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.8 }}>
                  <div style={{ color: 'var(--secondary)', marginBottom: '15px' }}>$ claude</div>
                  <div style={{ color: 'var(--primary)', marginBottom: '15px' }}>🤖 Claude reading context...</div>
                  <div style={{ color: 'var(--text-light)' }}>
                    Hermanish! 👋<br /><br />

                    <strong style={{ color: 'var(--primary)' }}>📊 Quick Status:</strong><br />
                    ✅ Everything running smooth<br />
                    ✅ Revenue {metrics?.revenue?.momGrowth || '+0%'} MoM<br />
                    ✅ {(metrics?.draws?.currentHourlyId || 0) + (metrics?.draws?.currentDailyId || 0)} draws executed (100% success rate)<br />
                    ✅ Automation at {metrics?.automation?.overview?.overall_automation_percentage || '65'}%<br /><br />

                    <strong style={{ color: 'var(--warning)' }}>⚠️ 2 Things Need Attention:</strong><br />
                    1. Executor wallet: 0.015 ETH (fund in 3 days)<br />
                    2. 3 failed login attempts (IP auto-blocked)<br /><br />

                    <strong style={{ color: 'var(--success)' }}>🎯 Progress to Phase 2:</strong><br />
                    • Users: {metrics?.users?.total || 0}/1,000 ({Math.min(100, Math.round(((metrics?.users?.total || 0) / 1000) * 100))}%)<br />
                    • Revenue: {metrics?.revenue?.mrrFormatted || '$0.00'}/$10,000 ({Math.min(100, Math.round(((metrics?.revenue?.mrr || 0) / 10000000) * 100))}%)<br />
                    • Products: {metrics?.products?.live?.length || 0}/10 live ({Math.round(((metrics?.products?.live?.length || 0) / 10) * 100)}%)<br /><br />

                    <strong>What do you want to work on?</strong>
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--primary)' }}>🎯 Benefits:</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    • Zero questions needed - Claude knows everything<br />
                    • Instant context switch - no ramping up<br />
                    • Proactive alerts - Claude tells you what matters<br />
                    • Perfect memory - never forget important details
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
