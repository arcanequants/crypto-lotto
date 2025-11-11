'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}`;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// ABI for LotteryDualCrypto
const LOTTERY_ABI = [
  {
    inputs: [],
    name: 'currentHourlyDrawId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'currentDailyDrawId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'drawId', type: 'uint256' }],
    name: 'getHourlyDraw',
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'executed', type: 'bool' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'totalWinners', type: 'uint256' },
      { name: 'btcPrizeSnapshot', type: 'uint256' },
      { name: 'ethPrizeSnapshot', type: 'uint256' },
      { name: 'usdcPrizeSnapshot', type: 'uint256' },
      { name: 'commitBlock', type: 'uint256' },
      { name: 'revealBlock', type: 'uint256' },
      { name: 'salesClosed', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'drawId', type: 'uint256' }],
    name: 'getDailyDraw',
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'executed', type: 'bool' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'totalWinners', type: 'uint256' },
      { name: 'btcPrizeSnapshot', type: 'uint256' },
      { name: 'ethPrizeSnapshot', type: 'uint256' },
      { name: 'usdcPrizeSnapshot', type: 'uint256' },
      { name: 'commitBlock', type: 'uint256' },
      { name: 'revealBlock', type: 'uint256' },
      { name: 'salesClosed', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getHourlyVault',
    outputs: [
      { name: 'btc', type: 'uint256' },
      { name: 'eth', type: 'uint256' },
      { name: 'usdc', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getDailyVault',
    outputs: [
      { name: 'btc', type: 'uint256' },
      { name: 'eth', type: 'uint256' },
      { name: 'usdc', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface PoolData {
  prizePool: number;
  drawId: number;
  drawTime: number;
  executed: boolean;
  winningNumber: number;
  tickets: number;
  cbbtcAmount: number;
  wethAmount: number;
  usdcAmount: number;
}

export function DualCryptoPoolDisplay() {
  const [hourlyPool, setHourlyPool] = useState<PoolData>({
    prizePool: 0,
    drawId: 0,
    drawTime: 0,
    executed: false,
    winningNumber: 0,
    tickets: 0,
    cbbtcAmount: 0,
    wethAmount: 0,
    usdcAmount: 0
  });

  const [dailyPool, setDailyPool] = useState<PoolData>({
    prizePool: 0,
    drawId: 0,
    drawTime: 0,
    executed: false,
    winningNumber: 0,
    tickets: 0,
    cbbtcAmount: 0,
    wethAmount: 0,
    usdcAmount: 0
  });

  const [loading, setLoading] = useState(true);
  const [expandedHourly, setExpandedHourly] = useState(false);
  const [expandedDaily, setExpandedDaily] = useState(false);
  const [hourlyCountdown, setHourlyCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [dailyCountdown, setDailyCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchPools();
    const interval = setInterval(fetchPools, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update countdowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (hourlyPool.drawTime) {
        setHourlyCountdown(calculateCountdown(hourlyPool.drawTime));
      }
      if (dailyPool.drawTime) {
        setDailyCountdown(calculateCountdown(dailyPool.drawTime));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hourlyPool.drawTime, dailyPool.drawTime]);

  const calculateCountdown = (endTimeUnix: number): CountdownTime => {
    const now = Math.floor(Date.now() / 1000);
    let targetTime = endTimeUnix;

    // If draw time is 0 or in the past, calculate next hourly draw
    if (endTimeUnix === 0 || endTimeUnix <= now) {
      // For hourly: next hour on the hour
      const nowDate = new Date();
      const nextHour = new Date(nowDate);
      nextHour.setHours(nowDate.getHours() + 1, 0, 0, 0);
      targetTime = Math.floor(nextHour.getTime() / 1000);
    }

    const distance = targetTime - now;

    if (distance < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(distance / (60 * 60 * 24)),
      hours: Math.floor((distance % (60 * 60 * 24)) / (60 * 60)),
      minutes: Math.floor((distance % (60 * 60)) / 60),
      seconds: distance % 60
    };
  };

  const fetchPools = async () => {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(ALCHEMY_RPC_URL)
      });

      // Get current draw IDs
      const hourlyDrawId = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'currentHourlyDrawId'
      }) as bigint;

      const dailyDrawId = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'currentDailyDrawId'
      }) as bigint;

      // Get draw details
      const hourlyDrawResult = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'getHourlyDraw',
        args: [hourlyDrawId]
      }) as any;

      const dailyDrawResult = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'getDailyDraw',
        args: [dailyDrawId]
      }) as any;

      // Get vault balances
      const hourlyVaultResult = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'getHourlyVault'
      }) as [bigint, bigint, bigint];

      const dailyVaultResult = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'getDailyVault'
      }) as [bigint, bigint, bigint];

      // Fetch REAL-TIME prices from CoinGecko
      const pricesResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
      const pricesData = await pricesResponse.json();
      const btcPrice = pricesData.bitcoin?.usd || 108000; // Fallback to 108k if API fails
      const ethPrice = pricesData.ethereum?.usd || 3940; // Fallback to 3940 if API fails

      const hourlyBtc = parseFloat(formatUnits(hourlyVaultResult[0], 8));
      const hourlyEth = parseFloat(formatUnits(hourlyVaultResult[1], 18));
      const hourlyUsdc = parseFloat(formatUnits(hourlyVaultResult[2], 6));
      const hourlyPrize = (hourlyBtc * btcPrice) + (hourlyEth * ethPrice) + hourlyUsdc;

      setHourlyPool({
        prizePool: hourlyPrize,
        drawId: Number(hourlyDrawResult[0]),
        drawTime: Number(hourlyDrawResult[1]),
        executed: hourlyDrawResult[3],
        winningNumber: Number(hourlyDrawResult[2]),
        tickets: Number(hourlyDrawResult[4]),
        cbbtcAmount: hourlyBtc,
        wethAmount: hourlyEth,
        usdcAmount: hourlyUsdc
      });

      // Process daily pool
      const dailyBtc = parseFloat(formatUnits(dailyVaultResult[0], 8));
      const dailyEth = parseFloat(formatUnits(dailyVaultResult[1], 18));
      const dailyUsdc = parseFloat(formatUnits(dailyVaultResult[2], 6));
      const dailyPrize = (dailyBtc * btcPrice) + (dailyEth * ethPrice) + dailyUsdc;

      setDailyPool({
        prizePool: dailyPrize,
        drawId: Number(dailyDrawResult[0]),
        drawTime: Number(dailyDrawResult[1]),
        executed: dailyDrawResult[3],
        winningNumber: Number(dailyDrawResult[2]),
        tickets: Number(dailyDrawResult[4]),
        cbbtcAmount: dailyBtc,
        wethAmount: dailyEth,
        usdcAmount: dailyUsdc
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching pools:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          Loading prize pools from blockchain...
        </div>
      </div>
    );
  }

  const renderCard = (
    type: 'hourly' | 'daily',
    data: PoolData,
    expanded: boolean,
    setExpanded: (val: boolean) => void,
    countdown: CountdownTime
  ) => {
    const isHourly = type === 'hourly';
    const borderColor = isHourly ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 215, 0, 0.4)';
    const hoverShadow = isHourly ? '0 15px 40px rgba(0, 240, 255, 0.25)' : '0 15px 40px rgba(255, 215, 0, 0.25)';
    const titleColor = isHourly ? '#00f0ff' : '#ffd700';
    const detailColor = isHourly ? '#00f0ff' : '#ffd700';

    // Calculate crypto USD values (prizePool already includes correct prices)
    const btcUSD = data.cbbtcAmount * (data.prizePool / (data.cbbtcAmount + data.wethAmount + data.usdcAmount) || 0);
    const ethUSD = data.wethAmount * (data.prizePool / (data.cbbtcAmount + data.wethAmount + data.usdcAmount) || 0);

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
            <div style={{ fontSize: '28px' }}>{isHourly ? '⚡' : '💎'}</div>
            <div>
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '3px',
                color: titleColor,
              }}>
                {isHourly ? 'HOURLY LOTTERY' : 'DAILY LOTTERY'}
              </h3>
              <div style={{
                fontSize: '10px',
                opacity: 0.6,
                fontFamily: "'Orbitron', sans-serif",
              }}>
                Draw #{data.drawId} • {isHourly ? 'Every Hour' : '8PM Central'}
              </div>
              {/* Show winning number if draw is executed and winningNumber > 0 */}
              {data.executed && data.winningNumber > 0 && (
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    opacity: 0.8,
                    fontFamily: "'Orbitron', sans-serif",
                  }}>
                    Winning Number:
                  </span>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                    color: '#000',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '14px',
                    fontWeight: 900,
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.5)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    {String(data.winningNumber).padStart(2, '0')}
                  </div>
                </div>
              )}
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
            {countdown.days > 0 && (
              <>
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
              </>
            )}
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
            {data.executed ? (
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
                ✅ DRAWN
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

              {/* USDC */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>💎</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#00f0ff',
                }}>USDC</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '3px',
                }}>
                  {data.usdcAmount.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#ffd700',
                  fontWeight: 700,
                  fontFamily: "'Orbitron', sans-serif",
                }}>
                  ${data.usdcAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {new Date(data.drawTime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
      {renderCard('hourly', hourlyPool, expandedHourly, setExpandedHourly, hourlyCountdown)}
      {renderCard('daily', dailyPool, expandedDaily, setExpandedDaily, dailyCountdown)}

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
          Every $0.10 ticket automatically enters BOTH the hourly draw (frequent wins!)
          and the daily jackpot (8PM Central = 2AM UTC).
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}> Win crypto: 70% BTC + 20% ETH + 10% USDC!</span>
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
