'use client';

import { useState, useEffect } from 'react';

interface PrizeData {
  drawType: 'daily' | 'weekly';
  totalUSD: number;
  composition: {
    btc: { amount: number; usd: number; percentage: number };
    eth: { amount: number; usd: number; percentage: number };
    token: { amount: number; usd: number; symbol: string; percentage: number };
  };
  totalTickets: number;
  lastUpdate: number;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function LivePrizePoolUltraCompact() {
  const [dailyData, setDailyData] = useState<PrizeData | null>(null);
  const [weeklyData, setWeeklyData] = useState<PrizeData | null>(null);
  const [expandedDaily, setExpandedDaily] = useState(false);
  const [expandedWeekly, setExpandedWeekly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyCountdown, setDailyCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [weeklyCountdown, setWeeklyCountdown] = useState<CountdownTime>({ days: 5, hours: 23, minutes: 5, seconds: 15 });

  const fetchPrizeData = async (type: 'daily' | 'weekly') => {
    try {
      const res = await fetch(`/api/prizes/live?type=${type}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${type} prize:`, error);
      return null;
    }
  };

  const fetchAllData = async () => {
    const [daily, weekly] = await Promise.all([
      fetchPrizeData('daily'),
      fetchPrizeData('weekly'),
    ]);

    if (daily) setDailyData(daily);
    if (weekly) setWeeklyData(weekly);
    setLoading(false);
  };

  // Simulate countdown (en producción, calcular basado en draw_date real)
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });

      setWeeklyCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh prize data every 10 seconds
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !dailyData || !weeklyData) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div style={{ textAlign: 'center', opacity: 0.6 }}>Loading prize pools...</div>
      </div>
    );
  }

  const renderCard = (
    type: 'daily' | 'weekly',
    data: PrizeData,
    expanded: boolean,
    setExpanded: (val: boolean) => void,
    countdown: CountdownTime
  ) => {
    const isDaily = type === 'daily';
    const borderColor = isDaily ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 215, 0, 0.4)';
    const hoverShadow = isDaily ? '0 15px 40px rgba(0, 240, 255, 0.25)' : '0 15px 40px rgba(255, 215, 0, 0.25)';
    const titleColor = isDaily ? '#00f0ff' : '#ffd700';
    const detailColor = isDaily ? '#00f0ff' : '#ffd700';

    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(5, 8, 17, 0.9))',
          borderRadius: '20px',
          padding: expanded ? '20px 25px 25px' : '20px 25px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          border: `1px solid ${borderColor}`,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = hoverShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Shimmer effect */}
        <div style={{
          content: '',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.02), transparent)',
          animation: 'shimmer 3s infinite',
          pointerEvents: 'none',
        }} />

        {/* Main card content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto',
          gap: '25px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
            <div style={{ fontSize: '28px' }}>{isDaily ? '🎯' : '🏆'}</div>
            <div>
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '3px',
                color: titleColor,
              }}>
                {isDaily ? 'DAILY JACKPOT' : 'WEEKLY JACKPOT'}
              </h3>
              <div style={{
                fontSize: '10px',
                opacity: 0.6,
                fontFamily: "'Orbitron', sans-serif",
              }}>
                Lottery #001
              </div>
            </div>
          </div>

          {/* Prize Display */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '36px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ffd700, #fff, #ffd700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}>
              ${data.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div style={{
              fontSize: '10px',
              opacity: 0.5,
              textTransform: 'uppercase',
              marginTop: '4px',
            }}>
              Total Prize
            </div>
          </div>

          {/* Countdown */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00f0ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}>
                {String(countdown.days).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>D</div>
            </div>
            <span style={{ fontSize: '20px', opacity: 0.3, margin: '0 -6px' }}>:</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00f0ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}>
                {String(countdown.hours).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>H</div>
            </div>
            <span style={{ fontSize: '20px', opacity: 0.3, margin: '0 -6px' }}>:</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00f0ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}>
                {String(countdown.minutes).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>M</div>
            </div>
            <span style={{ fontSize: '20px', opacity: 0.3, margin: '0 -6px' }}>:</span>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00f0ff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}>
                {String(countdown.seconds).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>S</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              padding: '6px 12px',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid #4ade80',
              borderRadius: '15px',
              color: '#4ade80',
              fontWeight: 600,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '9px',
              animation: 'pulse 2s ease-in-out infinite',
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
            }}>
              ● LIVE
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '8px 12px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                fontFamily: "'Orbitron', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Details {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Expandable Details */}
        <div style={{
          maxHeight: expanded ? '300px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          position: 'relative',
          zIndex: 1,
          marginTop: expanded ? '20px' : '0',
        }}>
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            margin: '15px 0',
          }} />

          <div style={{ padding: '15px 0' }}>
            {/* Crypto Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {/* BTC */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(247, 147, 26, 0.25)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🟠</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#f7931a',
                }}>BTC</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {data.composition.btc.amount.toFixed(4)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  ${data.composition.btc.usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* ETH */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(98, 126, 234, 0.25)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🔷</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#627eea',
                }}>ETH</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {data.composition.eth.amount.toFixed(4)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  ${data.composition.eth.usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>

              {/* SOL */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(0, 255, 163, 0.25)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>⚡</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#00ffa3',
                }}>SOL</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {data.composition.token.amount.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  ${data.composition.token.usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <div style={{ fontSize: '11px' }}>
                <div style={{ opacity: 0.6, marginBottom: '3px' }}>Next Draw</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: '13px',
                  color: detailColor,
                }}>
                  {isDaily ? 'Today 8:00 PM' : 'Oct 26, 8:00 PM'}
                </div>
              </div>
              <div style={{ fontSize: '11px' }}>
                <div style={{ opacity: 0.6, marginBottom: '3px' }}>Tickets Sold</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: '13px',
                  color: detailColor,
                }}>
                  {data.totalTickets.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '11px' }}>
                <div style={{ opacity: 0.6, marginBottom: '3px' }}>Last Updated</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: '13px',
                  color: detailColor,
                }}>
                  {new Date(data.lastUpdate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button
                style={{
                  padding: '10px 25px',
                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                  border: 'none',
                  borderRadius: '12px',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#000',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 215, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🏆 View Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {renderCard('daily', dailyData, expandedDaily, setExpandedDaily, dailyCountdown)}
      {renderCard('weekly', weeklyData, expandedWeekly, setExpandedWeekly, weeklyCountdown)}

      {/* Add shimmer keyframes */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
