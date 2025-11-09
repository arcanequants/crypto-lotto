'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface PoolData {
  prizePool: number;
  drawId: number;
  endTime: string;
  tickets: number;
  cbbtcAmount: number;
  wethAmount: number;
  tokenAmount: number;
  tokenSymbol: string;
}

export function DualPoolDisplay() {
  const [dailyPool, setDailyPool] = useState<PoolData>({
    prizePool: 0,
    drawId: 0,
    endTime: '',
    tickets: 0,
    cbbtcAmount: 0,
    wethAmount: 0,
    tokenAmount: 0,
    tokenSymbol: 'MATIC'
  });

  const [weeklyPool, setWeeklyPool] = useState<PoolData>({
    prizePool: 0,
    drawId: 0,
    endTime: '',
    tickets: 0,
    cbbtcAmount: 0,
    wethAmount: 0,
    tokenAmount: 0,
    tokenSymbol: 'MATIC'
  });

  const [loading, setLoading] = useState(true);
  const [expandedDaily, setExpandedDaily] = useState(false);
  const [expandedWeekly, setExpandedWeekly] = useState(false);
  const [dailyCountdown, setDailyCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [weeklyCountdown, setWeeklyCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPreviousDrawDaily, setIsPreviousDrawDaily] = useState(false);
  const [isPreviousDrawWeekly, setIsPreviousDrawWeekly] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    fetchPools();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPools, 30000);

    // Listen for online/offline events to auto-reconnect
    const handleOnline = () => {
      console.log('Connection restored, refetching pools...');
      fetchPools();
    };

    const handleOffline = () => {
      console.log('Connection lost');
      setConnectionError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update countdowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (dailyPool.endTime) {
        setDailyCountdown(calculateCountdown(dailyPool.endTime));
      }
      if (weeklyPool.endTime) {
        setWeeklyCountdown(calculateCountdown(weeklyPool.endTime));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyPool.endTime, weeklyPool.endTime]);

  const calculateCountdown = (endTime: string): CountdownTime => {
    const now = new Date().getTime();
    const target = new Date(endTime).getTime();
    const distance = target - now;

    if (distance < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
  };

  const fetchPools = async (attempt: number = 0) => {
    try {
      setConnectionError(false);

      // Get next ACTIVE daily draw (not executed)
      const { data: dailyDraw, error: dailyError } = await supabase
        .from('draws')
        .select('id, draw_id, total_prize_usd, end_time, total_tickets, cbbtc_amount, weth_amount, token_amount, month_token')
        .eq('draw_type', 'daily')
        .eq('executed', false)
        .order('end_time', { ascending: true })
        .limit(1)
        .single();

      // Get next ACTIVE weekly draw (not executed)
      const { data: weeklyDraw, error: weeklyError } = await supabase
        .from('draws')
        .select('id, draw_id, total_prize_usd, end_time, total_tickets, cbbtc_amount, weth_amount, token_amount, month_token')
        .eq('draw_type', 'weekly')
        .eq('executed', false)
        .order('end_time', { ascending: true })
        .limit(1)
        .single();

      // Handle daily draw
      if (dailyDraw) {
        // Active draw found
        setDailyPool({
          prizePool: dailyDraw.total_prize_usd || 0,
          drawId: dailyDraw.draw_id,
          endTime: dailyDraw.end_time,
          tickets: dailyDraw.total_tickets || 0,
          cbbtcAmount: dailyDraw.cbbtc_amount || 0,
          wethAmount: dailyDraw.weth_amount || 0,
          tokenAmount: dailyDraw.token_amount || 0,
          tokenSymbol: dailyDraw.month_token || 'MATIC'
        });
        setIsPreviousDrawDaily(false);
      } else {
        // No active draw - get LAST EXECUTED draw
        const { data: lastDailyDraw } = await supabase
          .from('draws')
          .select('id, draw_id, total_prize_usd, end_time, total_tickets, cbbtc_amount, weth_amount, token_amount, month_token')
          .eq('draw_type', 'daily')
          .eq('executed', true)
          .order('end_time', { ascending: false })
          .limit(1)
          .single();

        if (lastDailyDraw) {
          setDailyPool({
            prizePool: lastDailyDraw.total_prize_usd || 0,
            drawId: lastDailyDraw.draw_id,
            endTime: lastDailyDraw.end_time,
            tickets: lastDailyDraw.total_tickets || 0,
            cbbtcAmount: lastDailyDraw.cbbtc_amount || 0,
            wethAmount: lastDailyDraw.weth_amount || 0,
            tokenAmount: lastDailyDraw.token_amount || 0,
            tokenSymbol: lastDailyDraw.month_token || 'MATIC'
          });
          setIsPreviousDrawDaily(true);
        }
      }

      // Handle weekly draw
      if (weeklyDraw) {
        // Active draw found
        setWeeklyPool({
          prizePool: weeklyDraw.total_prize_usd || 0,
          drawId: weeklyDraw.draw_id,
          endTime: weeklyDraw.end_time,
          tickets: weeklyDraw.total_tickets || 0,
          cbbtcAmount: weeklyDraw.cbbtc_amount || 0,
          wethAmount: weeklyDraw.weth_amount || 0,
          tokenAmount: weeklyDraw.token_amount || 0,
          tokenSymbol: weeklyDraw.month_token || 'MATIC'
        });
        setIsPreviousDrawWeekly(false);
      } else {
        // No active draw - get LAST EXECUTED draw
        const { data: lastWeeklyDraw } = await supabase
          .from('draws')
          .select('id, draw_id, total_prize_usd, end_time, total_tickets, cbbtc_amount, weth_amount, token_amount, month_token')
          .eq('draw_type', 'weekly')
          .eq('executed', true)
          .order('end_time', { ascending: false })
          .limit(1)
          .single();

        if (lastWeeklyDraw) {
          setWeeklyPool({
            prizePool: lastWeeklyDraw.total_prize_usd || 0,
            drawId: lastWeeklyDraw.draw_id,
            endTime: lastWeeklyDraw.end_time,
            tickets: lastWeeklyDraw.total_tickets || 0,
            cbbtcAmount: lastWeeklyDraw.cbbtc_amount || 0,
            wethAmount: lastWeeklyDraw.weth_amount || 0,
            tokenAmount: lastWeeklyDraw.token_amount || 0,
            tokenSymbol: lastWeeklyDraw.month_token || 'MATIC'
          });
          setIsPreviousDrawWeekly(true);
        }
      }

      setLoading(false);
      setRetryCount(0); // Reset retry count on success
      setConnectionError(false);

    } catch (error: any) {
      console.error('Error fetching pools:', error);

      // Check if it's a network error
      const isNetworkError = error.message?.includes('fetch') ||
                            error.message?.includes('network') ||
                            error.message?.includes('timeout') ||
                            !navigator.onLine;

      if (isNetworkError && attempt < 3) {
        // Retry with exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Network error detected. Retrying in ${delay}ms... (Attempt ${attempt + 1}/3)`);

        setConnectionError(true);
        setRetryCount(attempt + 1);

        setTimeout(() => {
          fetchPools(attempt + 1);
        }, delay);
      } else {
        // Max retries reached or non-network error
        console.error('Failed to fetch pools after retries');
        setConnectionError(true);
        setLoading(false);
      }
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          {connectionError ? (
            <>
              <div>⚠️ Connection issue detected</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                {retryCount > 0 ? `Retrying... (Attempt ${retryCount}/3)` : 'Attempting to reconnect...'}
              </div>
            </>
          ) : (
            'Loading prize pools...'
          )}
        </div>
      </div>
    );
  }

  const renderCard = (
    type: 'daily' | 'weekly',
    data: PoolData,
    expanded: boolean,
    setExpanded: (val: boolean) => void,
    countdown: CountdownTime,
    isPreviousDraw: boolean = false
  ) => {
    const isDaily = type === 'daily';
    const borderColor = isDaily ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 215, 0, 0.4)';
    const hoverShadow = isDaily ? '0 15px 40px rgba(0, 240, 255, 0.25)' : '0 15px 40px rgba(255, 215, 0, 0.25)';
    const titleColor = isDaily ? '#00f0ff' : '#ffd700';
    const detailColor = isDaily ? '#00f0ff' : '#ffd700';

    // Calculate crypto USD values (mock prices for now)
    const btcPrice = 108000;
    const ethPrice = 3940;
    const tokenPrice = 1.0;

    const btcUSD = data.cbbtcAmount * btcPrice;
    const ethUSD = data.wethAmount * ethPrice;
    const tokenUSD = data.tokenAmount * tokenPrice;

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
          marginBottom: '15px'
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
                Lottery #{data.drawId}
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
              ${data.prizePool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            {isPreviousDraw ? (
              <div style={{
                padding: '6px 12px',
                background: 'rgba(156, 163, 175, 0.1)',
                border: '1px solid #9ca3af',
                borderRadius: '15px',
                color: '#9ca3af',
                fontWeight: 600,
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '9px',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}>
                ⌛ PREVIOUS DRAW
              </div>
            ) : (
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
            )}
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
              {/* cbBTC */}
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
                }}>cbBTC</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {data.cbbtcAmount.toFixed(8)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  ${btcUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* wETH */}
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
                }}>wETH</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {data.wethAmount.toFixed(8)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  ${ethUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Token of Month */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(130, 71, 229, 0.25)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>💜</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#8247e5',
                }}>{data.tokenSymbol}</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {data.tokenAmount.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  ${tokenUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {new Date(data.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                  {data.tickets.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderCard('daily', dailyPool, expandedDaily, setExpandedDaily, dailyCountdown, isPreviousDrawDaily)}
      {renderCard('weekly', weeklyPool, expandedWeekly, setExpandedWeekly, weeklyCountdown, isPreviousDrawWeekly)}

      {/* Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 215, 0, 0.1))',
        border: '2px solid rgba(0, 240, 255, 0.3)',
        borderRadius: '15px',
        padding: '20px 30px',
        textAlign: 'center',
        marginTop: '20px'
      }}>
        <div style={{
          fontSize: '16px',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00f0ff, var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          🎰 ONE TICKET = TWO CHANCES TO WIN!
        </div>
        <div style={{
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--light)',
          opacity: 0.8,
          lineHeight: 1.6
        }}>
          Every $0.25 ticket automatically enters BOTH the daily draw (frequent wins!)
          and the weekly jackpot (massive prizes!).
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}> Double your chances, same price!</span>
        </div>
      </div>

      {/* Add shimmer and pulse keyframes */}
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
