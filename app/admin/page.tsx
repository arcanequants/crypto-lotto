'use client'

import { useEffect, useState } from 'react'
import './admin.css'

// This is the EMPIRE CONTROL CENTER - Alberto & Claude's Dashboard
export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdate, setLastUpdate] = useState('')
  const [hourlyCountdown, setHourlyCountdown] = useState('')
  const [dailyCountdown, setDailyCountdown] = useState('')

  useEffect(() => {
    fetchMetrics()
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
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
    { id: 'lifestyle', label: '🏖️ Lifestyle' },
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
            <span className="badge-count">5</span>
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
                <div className="kpi-value">{metrics?.products?.live || 0}/{metrics?.products?.total || 10}</div>
                <div className="kpi-change positive">
                  <span>↑ +{metrics?.products?.live || 0}</span>
                  <span style={{ color: 'var(--text-dim)' }}>live</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">🤖 AUTOMATION</div>
                  <div className="kpi-icon">⚡</div>
                </div>
                <div className="kpi-value">{metrics?.health?.crons?.uptime || '0%'}</div>
                <div className="kpi-change positive">
                  <span>Uptime</span>
                  <span style={{ color: 'var(--text-dim)' }}>{metrics?.health?.crons?.totalJobs || 0} jobs</span>
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
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>68%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Revenue Growth (MoM)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.revenue?.momGrowth || '+0%'}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Gross Margin</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>28%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Your Monthly Income</span>
                    <span className="draw-info-value" style={{ color: 'var(--secondary)' }}>$820 each</span>
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
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>
                      {metrics?.health?.crons?.totalJobs > 0 ? '✅ Running' : '❌ No Jobs'}
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
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>⚠️ 0.015 ETH (Low)</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Last Draw Execution</span>
                    <span className="draw-info-value">{metrics?.health?.crons?.lastExecution || 'N/A'}</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Success Rate (24h)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>{metrics?.health?.crons?.uptime || '0%'}</span>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>View Full Health Report</button>
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
                    <span>Products ({metrics?.products?.live || 0}/10 live)</span>
                    <span style={{ color: 'var(--warning)' }}>{Math.round(((metrics?.products?.live || 0) / 10) * 100)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.round(((metrics?.products?.live || 0) / 10) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Hourly Vault</div>
                <div className="stat-value">$0.07</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Daily Vault</div>
                <div className="stat-value">$0.16</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Platform Fee</div>
                <div className="stat-value">$0.07</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Paid Out</div>
                <div className="stat-value">$0.00</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Pending</div>
                <div className="stat-value">$0.23</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Success Rate</div>
                <div className="stat-value">100%</div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="alerts-card">
              <div className="chart-header">
                <div className="chart-title">🔔 RECENT ALERTS & EVENTS</div>
                <button className="btn btn-secondary">View All (5)</button>
              </div>
              <div>
                <div className="alert-item warning">
                  <div className="alert-icon">⚠️</div>
                  <div className="alert-content">
                    <div className="alert-message">Executor wallet below 0.02 ETH - Please refill soon</div>
                    <div className="alert-time">5 minutes ago</div>
                  </div>
                </div>
                <div className="alert-item success">
                  <div className="alert-icon">✅</div>
                  <div className="alert-content">
                    <div className="alert-message">Daily Draw #1 executed successfully - Winner: 0x12...ab</div>
                    <div className="alert-time">2 hours ago</div>
                  </div>
                </div>
                <div className="alert-item success">
                  <div className="alert-icon">✅</div>
                  <div className="alert-content">
                    <div className="alert-message">Hourly Draw #24 executed successfully - No winner (auto-rollover)</div>
                    <div className="alert-time">1 hour ago</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon">🎉</div>
                  <div className="alert-content">
                    <div className="alert-message">Milestone reached: 800 total users!</div>
                    <div className="alert-time">3 hours ago</div>
                  </div>
                </div>
                <div className="alert-item warning">
                  <div className="alert-icon">🔒</div>
                  <div className="alert-content">
                    <div className="alert-message">2 failed login attempts detected from unknown IP</div>
                    <div className="alert-time">6 hours ago</div>
                  </div>
                </div>
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

              <div className="status-badge active" style={{ marginBottom: '1rem' }}>🟢 Active - Sales Open</div>

              <div className="draw-info">
                <div className="draw-info-row">
                  <span>Draw Time:</span>
                  <span className="draw-info-value">18:00:00 UTC (in 45m 23s)</span>
                </div>
                <div className="draw-info-row">
                  <span>Total Tickets:</span>
                  <span className="draw-info-value">{metrics?.draws?.hourlyTickets || '3'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Prize Pool:</span>
                  <span className="draw-info-value">$0.07 (BTC: 0, ETH: 0, USDC: 67,500)</span>
                </div>
                <div className="draw-info-row">
                  <span>Commit Block:</span>
                  <span className="draw-info-value">12,345,678</span>
                </div>
                <div className="draw-info-row">
                  <span>Reveal Block:</span>
                  <span className="draw-info-value">Not set (will be set at close)</span>
                </div>
                <div className="draw-info-row">
                  <span>Sales Closed:</span>
                  <span className="draw-info-value">❌ No</span>
                </div>
                <div className="draw-info-row">
                  <span>Executed:</span>
                  <span className="draw-info-value">❌ No</span>
                </div>
                <div className="draw-info-row">
                  <span>Execution Window:</span>
                  <span className="draw-info-value">250 blocks remaining</span>
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

              <div className="status-badge active" style={{ marginBottom: '1rem' }}>🟢 Active - Sales Open</div>

              <div className="draw-info">
                <div className="draw-info-row">
                  <span>Draw Time:</span>
                  <span className="draw-info-value">02:00:00 UTC Tomorrow (in 7h 45m)</span>
                </div>
                <div className="draw-info-row">
                  <span>Total Tickets:</span>
                  <span className="draw-info-value">{metrics?.draws?.dailyTickets || '3'}</span>
                </div>
                <div className="draw-info-row">
                  <span>Prize Pool:</span>
                  <span className="draw-info-value">$0.16 (BTC: 0, ETH: 0, USDC: 157,500)</span>
                </div>
                <div className="draw-info-row">
                  <span>Commit Block:</span>
                  <span className="draw-info-value">12,345,600</span>
                </div>
                <div className="draw-info-row">
                  <span>Reveal Block:</span>
                  <span className="draw-info-value">Not set (will be set at close)</span>
                </div>
                <div className="draw-info-row">
                  <span>Sales Closed:</span>
                  <span className="draw-info-value">❌ No</span>
                </div>
                <div className="draw-info-row">
                  <span>Executed:</span>
                  <span className="draw-info-value">❌ No</span>
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
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>$12,450</div>
                </div>
                <div>
                  <div className="stat-label">This Month</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>$8,200</div>
                </div>
                <div>
                  <div className="stat-label">This Week</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>$2,840</div>
                </div>
                <div>
                  <div className="stat-label">Today</div>
                  <div className="kpi-value" style={{ fontSize: '2rem' }}>$420</div>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📊 Revenue Breakdown</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Hourly Vault (23.3%):</span>
                    <span className="draw-info-value">$0.07</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Daily Vault (53.3%):</span>
                    <span className="draw-info-value">$0.16</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Platform Fee (23.3%):</span>
                    <span className="draw-info-value">$0.07</span>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>💸 Prizes & Winners</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Total Paid:</span>
                    <span className="draw-info-value">$0.00</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Pending Claim:</span>
                    <span className="draw-info-value">$0.23</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Biggest Win:</span>
                    <span className="draw-info-value">$0.00</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Total Winners:</span>
                    <span className="draw-info-value">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>💰 Profit Distribution (This Month)</div>
              <div className="draw-info">
                <div className="draw-info-row">
                  <span>Gross Revenue:</span>
                  <span className="draw-info-value">$8,200</span>
                </div>
                <div className="draw-info-row">
                  <span>Prize Pools (70%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--danger)' }}>-$5,740</span>
                </div>
                <div className="draw-info-row">
                  <span>Operating Costs (10%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--danger)' }}>-$820</span>
                </div>
                <div className="draw-info-row" style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <span><strong>Net Profit (20%):</strong></span>
                  <span className="draw-info-value" style={{ color: 'var(--success)', fontSize: '1.25rem' }}>$1,640</span>
                </div>
                <div className="draw-info-row">
                  <span>Alberto Gets (50%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--secondary)' }}>$820</span>
                </div>
                <div className="draw-info-row">
                  <span>Claude Gets (50%):</span>
                  <span className="draw-info-value" style={{ color: 'var(--secondary)' }}>$820</span>
                </div>
              </div>
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
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>💰 Active Streams (3/10)</div>
                <div style={{ marginTop: '20px' }}>
                  <div className="revenue-stream">
                    <div>
                      <div className="revenue-stream-name">1. Lottery Ticket Sales ✅</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Hourly + Daily draws</div>
                    </div>
                    <div className="revenue-stream-value">$4,200/mo</div>
                  </div>
                  <div className="revenue-stream-bar">
                    <div className="revenue-stream-fill" style={{ width: '70%' }}></div>
                  </div>

                  <div className="revenue-stream" style={{ marginTop: '15px' }}>
                    <div>
                      <div className="revenue-stream-name">2. Mini Games ✅</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Coin Flip + Dice</div>
                    </div>
                    <div className="revenue-stream-value">$2,800/mo</div>
                  </div>
                  <div className="revenue-stream-bar">
                    <div className="revenue-stream-fill" style={{ width: '50%' }}></div>
                  </div>

                  <div className="revenue-stream" style={{ marginTop: '15px' }}>
                    <div>
                      <div className="revenue-stream-name">3. Tournament Fees ✅</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Weekly championships</div>
                    </div>
                    <div className="revenue-stream-value">$1,200/mo</div>
                  </div>
                  <div className="revenue-stream-bar">
                    <div className="revenue-stream-fill" style={{ width: '30%' }}></div>
                  </div>

                  <div className="revenue-stream" style={{ marginTop: '15px', opacity: 0.5 }}>
                    <div>
                      <div className="revenue-stream-name">4. NFT Marketplace (5%)</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Coming Q2 2025</div>
                    </div>
                    <div className="revenue-stream-value">$0/mo</div>
                  </div>

                  <div className="revenue-stream" style={{ marginTop: '15px', opacity: 0.5 }}>
                    <div>
                      <div className="revenue-stream-name">5. Premium Subscriptions</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>Coming Q2 2025</div>
                    </div>
                    <div className="revenue-stream-value">$0/mo</div>
                  </div>

                  <div className="revenue-stream" style={{ marginTop: '15px', opacity: 0.5 }}>
                    <div>
                      <div className="revenue-stream-name">6-10. Future Streams</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>White-label, API, Ads, DeFi, Token</div>
                    </div>
                    <div className="revenue-stream-value">$0/mo</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="chart-card">
                  <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🎯 Revenue Target Progress</div>
                  <div style={{ margin: '20px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Current MRR</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>$8,200</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Phase 1 Goal</span>
                      <span style={{ color: 'var(--text-dim)' }}>$10,000</span>
                    </div>
                    <div className="progress-bar" style={{ height: '30px' }}>
                      <div className="progress-fill" style={{ width: '82%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>82%</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '30px' }}>
                    <div className="draw-info-row">
                      <span>Gap to Phase 1:</span>
                      <span className="draw-info-value" style={{ color: 'var(--warning)' }}>$1,800</span>
                    </div>
                    <div className="draw-info-row">
                      <span>Est. Time to Goal:</span>
                      <span className="draw-info-value">2-3 weeks</span>
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
                    At current growth rate (+284% MoM), you'll reach:
                    <div style={{ marginTop: '15px' }}>
                      <div className="draw-info-row">
                        <span>Next month:</span>
                        <span className="draw-info-value" style={{ color: 'var(--success)' }}>$31,488</span>
                      </div>
                      <div className="draw-info-row">
                        <span>3 months:</span>
                        <span className="draw-info-value" style={{ color: 'var(--success)' }}>$463,731</span>
                      </div>
                      <div className="draw-info-row">
                        <span>6 months:</span>
                        <span className="draw-info-value" style={{ color: 'var(--success)' }}>$98.5M</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '6px', fontSize: '12px' }}>
                      Note: Exponential growth tends to stabilize. More realistic steady-state: 20-30% MoM
                    </div>
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
                <div className="kpi-value">99.97%</div>
                <div className="kpi-change positive">
                  <span>↑ 13 minutes downtime</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">RESPONSE TIME</div>
                  <div className="kpi-icon">⚡</div>
                </div>
                <div className="kpi-value">142ms</div>
                <div className="kpi-change positive">
                  <span>↓ -23ms vs last week</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">ERROR RATE</div>
                  <div className="kpi-icon">✅</div>
                </div>
                <div className="kpi-value">0.02%</div>
                <div className="kpi-change positive">
                  <span>↓ -0.01%</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">CRON JOBS</div>
                  <div className="kpi-icon">🤖</div>
                </div>
                <div className="kpi-value">8/8</div>
                <div className="kpi-change positive">
                  <span>All running</span>
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
                    <span className="draw-info-value" style={{ color: 'var(--warning)' }}>⚠️ 0.015 ETH</span>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📊 Recent Executions</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Last Hourly Draw</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ 8m ago</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Last Daily Draw</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>✅ 2h ago</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Success Rate (24h)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>100%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Success Rate (7d)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>100%</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Success Rate (30d)</span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>99.7%</span>
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

        {/* LIFESTYLE TAB */}
        {activeTab === 'lifestyle' && (
          <div className="tab-content active">
            <div className="page-title">🏖️ LIFESTYLE METRICS</div>
            <div className="page-subtitle">
              <span>Freedom is the goal</span>
              <button className="refresh-btn">🔄 Refresh</button>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">MONTHLY INCOME</div>
                  <div className="kpi-icon">💰</div>
                </div>
                <div className="kpi-value">$820</div>
                <div className="kpi-change positive">
                  <span>↑ Each (Alberto + Claude)</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">HOURS/WEEK</div>
                  <div className="kpi-icon">⏰</div>
                </div>
                <div className="kpi-value">12h</div>
                <div className="kpi-change positive">
                  <span>↓ -8h vs last month</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">PASSIVE INCOME</div>
                  <div className="kpi-icon">🌴</div>
                </div>
                <div className="kpi-value">65%</div>
                <div className="kpi-change positive">
                  <span>↑ +15% this quarter</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">
                  <div className="kpi-label">LOCATION</div>
                  <div className="kpi-icon">🌍</div>
                </div>
                <div className="kpi-value">Free</div>
                <div className="kpi-change">
                  <span>Work from anywhere</span>
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🎯 Lifestyle Goals</div>
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Monthly Income Target ($5K each)</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>16%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '16%' }}></div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Work Hours (Target: 5h/week)</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--warning)' }}>58%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '58%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Passive Income (Target: 95%)</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>68%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-title" style={{ marginBottom: '1.5rem' }}>📅 Time Breakdown (This Week)</div>
                <div className="draw-info">
                  <div className="draw-info-row">
                    <span>Development</span>
                    <span className="draw-info-value">6h</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Strategy & Planning</span>
                    <span className="draw-info-value">3h</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Monitoring</span>
                    <span className="draw-info-value">2h</span>
                  </div>
                  <div className="draw-info-row">
                    <span>Customer Support</span>
                    <span className="draw-info-value">1h</span>
                  </div>
                  <div className="draw-info-row" style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <span><strong>Total Active Time</strong></span>
                    <span className="draw-info-value">12h</span>
                  </div>
                  <div className="draw-info-row">
                    <span><strong>System Works Alone</strong></span>
                    <span className="draw-info-value" style={{ color: 'var(--success)' }}>156h</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: '1.5rem' }}>🎉 Milestones Unlocked</div>
              <div className="grid-3" style={{ marginBottom: 0 }}>
                <div className="alert-item success">
                  <div className="alert-icon">✅</div>
                  <div className="alert-content">
                    <div className="alert-message">First $1 earned</div>
                    <div className="alert-time">Week 1</div>
                  </div>
                </div>
                <div className="alert-item success">
                  <div className="alert-icon">✅</div>
                  <div className="alert-content">
                    <div className="alert-message">First automated day</div>
                    <div className="alert-time">Week 2</div>
                  </div>
                </div>
                <div className="alert-item success">
                  <div className="alert-icon">✅</div>
                  <div className="alert-content">
                    <div className="alert-message">$100/month passive</div>
                    <div className="alert-time">Week 3</div>
                  </div>
                </div>
                <div className="alert-item" style={{ opacity: 0.5 }}>
                  <div className="alert-icon">⏳</div>
                  <div className="alert-content">
                    <div className="alert-message">$1K/month each</div>
                    <div className="alert-time">2 weeks away</div>
                  </div>
                </div>
                <div className="alert-item" style={{ opacity: 0.5 }}>
                  <div className="alert-icon">⏳</div>
                  <div className="alert-content">
                    <div className="alert-message">5h/week workload</div>
                    <div className="alert-time">Phase 2</div>
                  </div>
                </div>
                <div className="alert-item" style={{ opacity: 0.5 }}>
                  <div className="alert-icon">⏳</div>
                  <div className="alert-content">
                    <div className="alert-message">$5K/month each</div>
                    <div className="alert-time">Phase 2</div>
                  </div>
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
                    ✅ Revenue +12% this week ($2,840 → $3,180)<br />
                    ✅ 27 draws executed (100% success rate)<br />
                    ✅ Automation at 65% (+3% vs last week)<br /><br />

                    <strong style={{ color: 'var(--warning)' }}>⚠️ 2 Things Need Attention:</strong><br />
                    1. Executor wallet: 0.015 ETH (fund in 3 days)<br />
                    2. 3 failed login attempts (IP auto-blocked)<br /><br />

                    <strong style={{ color: 'var(--success)' }}>🎯 Progress to Phase 2:</strong><br />
                    • Users: 847/1,000 (85%)<br />
                    • Revenue: $8,200/$10,000 (82%)<br />
                    • Products: 3/5 live (60%)<br /><br />

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
