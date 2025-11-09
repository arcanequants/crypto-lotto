'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_DUAL_CRYPTO as `0x${string}`;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// ABI for LotteryDualCrypto - we'll use HOURLY draw for the display
const LOTTERY_ABI = [
  {
    inputs: [],
    name: 'currentHourlyDrawId',
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
      { name: 'vrfSequenceNumber', type: 'uint256' },
      { name: 'totalWinners', type: 'uint256' },
      { name: 'btcPrizeSnapshot', type: 'uint256' },
      { name: 'ethPrizeSnapshot', type: 'uint256' },
      { name: 'usdcPrizeSnapshot', type: 'uint256' }
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
  }
] as const;

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function UltraSimplePoolDisplay() {
  const [drawId, setDrawId] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [executed, setExecuted] = useState(false);
  const [winningNumber, setWinningNumber] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [prizePoolUSDC, setPrizePoolUSDC] = useState('0');
  const [prizePoolUSDT, setPrizePoolUSDT] = useState('0');
  const [winnersCount, setWinnersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchDrawData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDrawData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown every second
  useEffect(() => {
    if (endTime === 0) return;

    const interval = setInterval(() => {
      setCountdown(calculateCountdown(endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const calculateCountdown = (endTimeUnix: number): CountdownTime => {
    const now = Math.floor(Date.now() / 1000);
    const distance = endTimeUnix - now;

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

  const fetchDrawData = async () => {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(ALCHEMY_RPC_URL)
      });

      // Get current hourly draw ID
      const hourlyDrawId = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'currentHourlyDrawId'
      }) as bigint;

      // Get hourly draw details
      const drawResult = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'getHourlyDraw',
        args: [hourlyDrawId]
      }) as any;

      // Get hourly vault (prize pool)
      const vaultResult = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'getHourlyVault'
      }) as [bigint, bigint, bigint];

      // drawResult: [drawId, drawTime, winningNumber, executed, totalTickets, winner, vrfSequenceNumber, totalWinners, btcPrizeSnapshot, ethPrizeSnapshot, usdcPrizeSnapshot]
      const drawEndTime = Number(drawResult[1]);

      // Calculate total prize in USD (approximation: BTC + ETH + USDC)
      // For simplicity, we'll just show the USDC amount in the main display
      const usdcAmount = formatUnits(vaultResult[2], 6); // USDC has 6 decimals

      console.log('🎲 Draw data from blockchain:', {
        drawId: Number(drawResult[0]),
        drawTime: drawEndTime,
        drawTimeDate: new Date(drawEndTime * 1000).toLocaleString(),
        executed: drawResult[3],
        totalTickets: Number(drawResult[4]),
        totalWinners: Number(drawResult[7]),
        vault: {
          btc: formatUnits(vaultResult[0], 8),
          eth: formatUnits(vaultResult[1], 18),
          usdc: usdcAmount
        }
      });

      setDrawId(Number(drawResult[0]));
      setEndTime(drawEndTime);
      setExecuted(drawResult[3]);
      setWinningNumber(Number(drawResult[2]));
      setTotalTickets(Number(drawResult[4]));
      setPrizePoolUSDC(usdcAmount); // USDC from vault
      setPrizePoolUSDT('0'); // No USDT in new contract
      setWinnersCount(Number(drawResult[7]));

      // Initialize countdown immediately
      setCountdown(calculateCountdown(drawEndTime));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching draw data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 0' }}>
        <div style={{ textAlign: 'center', opacity: 0.6 }}>
          Loading prize pool from blockchain...
        </div>
      </div>
    );
  }

  const totalPrizeUSD = parseFloat(prizePoolUSDC) + parseFloat(prizePoolUSDT);
  const borderColor = 'rgba(0, 240, 255, 0.4)';
  const hoverShadow = '0 15px 40px rgba(0, 240, 255, 0.25)';
  const titleColor = '#00f0ff';

  return (
    <div>
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
            <div style={{ fontSize: '28px' }}>🎲</div>
            <div>
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '3px',
                color: titleColor,
              }}>
                ULTRA SIMPLE LOTTERY
              </h3>
              <div style={{
                fontSize: '10px',
                opacity: 0.6,
                fontFamily: "'Orbitron', sans-serif",
              }}>
                Draw #{drawId} • Every 30 minutes
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
              ${totalPrizeUSD.toFixed(2)}
            </div>
            <div style={{
              fontSize: '10px',
              opacity: 0.5,
              textTransform: 'uppercase',
              marginTop: '4px',
            }}>
              Total Prize Pool
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
            {executed ? (
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
            {/* Token Split */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
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
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#ffd700',
                }}>
                  ${parseFloat(prizePoolUSDC).toFixed(2)}
                </div>
              </div>

              {/* USDT */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(38, 161, 123, 0.25)',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>💚</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  color: '#26a17b',
                }}>USDT</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#ffd700',
                }}>
                  ${parseFloat(prizePoolUSDT).toFixed(2)}
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
                  color: titleColor,
                }}>
                  {new Date(endTime * 1000).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div style={{ fontSize: '11px' }}>
                <div style={{ opacity: 0.6, marginBottom: '3px' }}>Tickets Sold</div>
                <div style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: '13px',
                  color: titleColor,
                }}>
                  {totalTickets.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Winning Number (if executed) */}
            {executed && winningNumber > 0 && (
              <div style={{
                marginTop: '15px',
                padding: '15px',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '2px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  marginBottom: '8px',
                  fontFamily: "'Orbitron', sans-serif"
                }}>
                  🏆 WINNING NUMBER
                </div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  fontFamily: "'Orbitron', sans-serif",
                  background: 'linear-gradient(135deg, #00f0ff, #ffd700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {winningNumber}
                </div>
                {winnersCount > 0 && (
                  <div style={{
                    fontSize: '11px',
                    marginTop: '8px',
                    color: '#4ade80',
                    fontFamily: "'Orbitron', sans-serif"
                  }}>
                    {winnersCount} winner{winnersCount === 1 ? '' : 's'}!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
          background: 'linear-gradient(135deg, #00f0ff, #ffd700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          🎲 ULTRA SIMPLE - PICK 1 NUMBER (1-10)
        </div>
        <div style={{
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--light)',
          opacity: 0.8,
          lineHeight: 1.6
        }}>
          Only $0.10 per ticket! If your number matches the winning number, you WIN!
          <span style={{ color: '#4ade80', fontWeight: 600 }}> Draws every 30 minutes.</span>
        </div>
      </div>

      {/* Add animations */}
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
