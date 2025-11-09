'use client';

import { useState, useEffect } from 'react';
import { LoginButton } from '@/components/LoginButton';
import { PrizeBalance } from '@/components/PrizeBalance';
import { WalletBalanceDropdown } from '@/components/WalletBalanceDropdown';
import { WinningNumbersSkeleton } from '@/components/Skeleton';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import './results.css';

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
    inputs: [{ name: '', type: 'uint256' }],
    name: 'hourlyDraws',
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'totalPrize', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'claimed', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'dailyDraws',
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'totalPrize', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'claimed', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface DrawResults {
  drawType: 'hourly' | 'daily';
  drawId: number;
  drawTime: number;
  winningNumber: number;
  totalPrize: bigint;
  winner: string;
  claimed: boolean;
}

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [hourlyDraws, setHourlyDraws] = useState<DrawResults[]>([]);
  const [dailyDraws, setDailyDraws] = useState<DrawResults[]>([]);
  const [selectedTab, setSelectedTab] = useState<'hourly' | 'daily'>('hourly');

  const contractAddress = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}`;

  useEffect(() => {
    loadDrawResults();
  }, []);

  const loadDrawResults = async () => {
    try {
      setLoading(true);

      const publicClient = createPublicClient({
        chain: base,
        transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
      });

      // Get current draw IDs
      const currentHourlyDrawId = await publicClient.readContract({
        address: contractAddress,
        abi: LOTTERY_ABI,
        functionName: 'currentHourlyDrawId'
      });

      const currentDailyDrawId = await publicClient.readContract({
        address: contractAddress,
        abi: LOTTERY_ABI,
        functionName: 'currentDailyDrawId'
      });

      // Load last 10 hourly draws (current draw might not have results yet, so we go backwards)
      const hourlyResults: DrawResults[] = [];
      const lastCompletedHourly = currentHourlyDrawId > 0n ? currentHourlyDrawId - 1n : 0n;
      const hourlyStart = lastCompletedHourly > 9n ? lastCompletedHourly - 9n : 1n;
      for (let i = lastCompletedHourly; i >= hourlyStart && i >= 1n; i--) {
        try {
          const draw = await publicClient.readContract({
            address: contractAddress,
            abi: LOTTERY_ABI,
            functionName: 'hourlyDraws',
            args: [i]
          });

          // Only show draws with valid data (winningNumber > 0, drawTime > 0, winningNumber <= 100)
          if (draw.winningNumber > 0 && draw.winningNumber <= 100 && draw.drawTime > 0n) {
            hourlyResults.push({
              drawType: 'hourly',
              drawId: Number(draw.drawId),
              drawTime: Number(draw.drawTime),
              winningNumber: Number(draw.winningNumber),
              totalPrize: draw.totalPrize,
              winner: draw.winner,
              claimed: draw.claimed
            });
          }
        } catch (error) {
          console.error(`Error loading hourly draw ${i}:`, error);
        }
      }

      // Load last 10 daily draws (current draw might not have results yet, so we go backwards)
      const dailyResults: DrawResults[] = [];
      const lastCompletedDaily = currentDailyDrawId > 0n ? currentDailyDrawId - 1n : 0n;
      const dailyStart = lastCompletedDaily > 9n ? lastCompletedDaily - 9n : 1n;
      for (let i = lastCompletedDaily; i >= dailyStart && i >= 1n; i--) {
        try {
          const draw = await publicClient.readContract({
            address: contractAddress,
            abi: LOTTERY_ABI,
            functionName: 'dailyDraws',
            args: [i]
          });

          // Only show draws with valid data (winningNumber > 0, drawTime > 0, winningNumber <= 100)
          if (draw.winningNumber > 0 && draw.winningNumber <= 100 && draw.drawTime > 0n) {
            dailyResults.push({
              drawType: 'daily',
              drawId: Number(draw.drawId),
              drawTime: Number(draw.drawTime),
              winningNumber: Number(draw.winningNumber),
              totalPrize: draw.totalPrize,
              winner: draw.winner,
              claimed: draw.claimed
            });
          }
        } catch (error) {
          console.error(`Error loading daily draw ${i}:`, error);
        }
      }

      setHourlyDraws(hourlyResults);
      setDailyDraws(dailyResults);
      setLoading(false);
    } catch (error) {
      console.error('Error loading draw results:', error);
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrize = (prize: bigint) => {
    // Convert from wei to ETH and format
    const ethValue = Number(prize) / 1e18;
    return ethValue.toFixed(6);
  };

  const renderDrawCard = (draw: DrawResults) => {
    const isHourly = draw.drawType === 'hourly';
    const borderColor = isHourly ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 215, 0, 0.4)';
    const titleColor = isHourly ? 'var(--primary)' : 'var(--accent)';

    return (
      <div
        key={`${draw.drawType}-${draw.drawId}`}
        style={{
          background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
          border: `2px solid ${borderColor}`,
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = `0 15px 40px ${borderColor.replace('0.4', '0.3')}`;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          paddingBottom: '20px',
          borderBottom: `1px solid ${borderColor.replace('0.4', '0.2')}`
        }}>
          <div>
            <div style={{
              fontSize: '12px',
              fontFamily: "'Orbitron', sans-serif",
              color: titleColor,
              marginBottom: '5px',
              opacity: 0.8
            }}>
              {isHourly ? '⏰ HOURLY DRAW' : '🌙 DAILY DRAW'}
            </div>
            <div style={{
              fontSize: '24px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 900,
              color: 'white'
            }}>
              Draw #{draw.drawId}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '11px',
              fontFamily: "'Inter', sans-serif",
              color: 'var(--light)',
              opacity: 0.6,
              marginBottom: '5px'
            }}>
              Draw Time
            </div>
            <div style={{
              fontSize: '13px',
              fontFamily: "'Orbitron', sans-serif",
              color: titleColor
            }}>
              {formatDate(draw.drawTime)}
            </div>
          </div>
        </div>

        {/* Winning Number */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{
            fontSize: '12px',
            fontFamily: "'Orbitron', sans-serif",
            color: titleColor,
            marginBottom: '15px',
            letterSpacing: '2px'
          }}>
            WINNING NUMBER
          </div>
          <div
            className={`number ${isHourly ? 'hourly' : 'daily'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${titleColor}, ${isHourly ? 'var(--secondary)' : '#ffa500'})`,
              fontSize: '36px',
              fontWeight: 'bold',
              fontFamily: "'Orbitron', sans-serif",
              color: isHourly ? 'white' : 'var(--darker)',
              boxShadow: `0 10px 30px ${borderColor.replace('0.4', '0.5')}`,
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            {draw.winningNumber.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Prize and Winner Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <div style={{
            background: borderColor.replace('0.4', '0.05'),
            border: `1px solid ${borderColor.replace('0.4', '0.2')}`,
            borderRadius: '12px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              fontFamily: "'Inter', sans-serif",
              color: 'var(--light)',
              opacity: 0.6,
              marginBottom: '8px'
            }}>
              Total Prize
            </div>
            <div style={{
              fontSize: '20px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              background: `linear-gradient(135deg, ${titleColor}, var(--light))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {formatPrize(draw.totalPrize)} ETH
            </div>
          </div>

          <div style={{
            background: borderColor.replace('0.4', '0.05'),
            border: `1px solid ${borderColor.replace('0.4', '0.2')}`,
            borderRadius: '12px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              fontFamily: "'Inter', sans-serif",
              color: 'var(--light)',
              opacity: 0.6,
              marginBottom: '8px'
            }}>
              Status
            </div>
            <div style={{
              fontSize: '14px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              color: draw.claimed ? '#4ade80' : '#fbbf24'
            }}>
              {draw.claimed ? '✅ CLAIMED' : '⏳ UNCLAIMED'}
            </div>
          </div>
        </div>

        {/* Winner Address */}
        {draw.winner !== '0x0000000000000000000000000000000000000000' && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: borderColor.replace('0.4', '0.05'),
            border: `1px solid ${borderColor.replace('0.4', '0.2')}`,
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '11px',
              fontFamily: "'Inter', sans-serif",
              color: 'var(--light)',
              opacity: 0.6,
              marginBottom: '8px'
            }}>
              Winner
            </div>
            <div style={{
              fontSize: '14px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 600,
              color: titleColor,
              wordBreak: 'break-all'
            }}>
              {draw.winner}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="grid-bg"></div>

      {/* Header */}
      <header>
        <nav className="container">
          <Link href="/" className="logo" style={{ cursor: 'pointer', textDecoration: 'none' }}>
            CryptoLotto
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link
              href="/"
              style={{
                color: 'var(--light)',
                textDecoration: 'none',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                opacity: 0.8,
                transition: 'opacity 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              BUY TICKETS
            </Link>
            <Link
              href="/my-tickets"
              style={{
                color: 'var(--light)',
                textDecoration: 'none',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                opacity: 0.8,
                transition: 'opacity 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              MY TICKETS
            </Link>
            <Link
              href="/prizes"
              style={{
                color: 'var(--light)',
                textDecoration: 'none',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                opacity: 0.8,
                transition: 'opacity 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              PRIZES
            </Link>
            <WalletBalanceDropdown />
            <PrizeBalance />
            <LoginButton />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        <div className="container">
          <h1 className="hero-title" style={{ fontSize: '48px' }}>Draw Results</h1>
          <p className="hero-subtitle">View past winning numbers from the blockchain</p>
        </div>
      </section>

      {/* Tab Selector */}
      <section className="container" style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <button
            onClick={() => setSelectedTab('hourly')}
            style={{
              padding: '15px 40px',
              background: selectedTab === 'hourly'
                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                : 'rgba(0, 240, 255, 0.1)',
              border: selectedTab === 'hourly'
                ? '2px solid var(--primary)'
                : '2px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '12px',
              color: selectedTab === 'hourly' ? 'white' : 'var(--primary)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => {
              if (selectedTab !== 'hourly') {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedTab !== 'hourly') {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
              }
            }}
          >
            ⏰ Hourly Draws
          </button>
          <button
            onClick={() => setSelectedTab('daily')}
            style={{
              padding: '15px 40px',
              background: selectedTab === 'daily'
                ? 'linear-gradient(135deg, var(--accent), #ffa500)'
                : 'rgba(255, 215, 0, 0.1)',
              border: selectedTab === 'daily'
                ? '2px solid var(--accent)'
                : '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px',
              color: selectedTab === 'daily' ? 'var(--darker)' : 'var(--accent)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => {
              if (selectedTab !== 'daily') {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedTab !== 'daily') {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              }
            }}
          >
            🌙 Daily Draws
          </button>
        </div>
      </section>

      {/* Results Content */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        {loading ? (
          <WinningNumbersSkeleton />
        ) : (
          <>
            {selectedTab === 'hourly' && (
              <>
                {hourlyDraws.length > 0 ? (
                  <div>
                    <h2 style={{
                      textAlign: 'center',
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '28px',
                      background: 'linear-gradient(135deg, var(--primary), var(--light))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '40px',
                      letterSpacing: '3px'
                    }}>
                      ⏰ RECENT HOURLY DRAWS
                    </h2>
                    {hourlyDraws.map(draw => renderDrawCard(draw))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 40px',
                    background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
                    border: '2px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '20px'
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏰</div>
                    <h3 style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '24px',
                      color: 'var(--primary)',
                      marginBottom: '15px'
                    }}>
                      No Completed Hourly Draws Yet
                    </h3>
                    <p style={{
                      color: 'var(--light)',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      lineHeight: 1.6,
                      maxWidth: '500px',
                      margin: '0 auto'
                    }}>
                      The first hourly draw hasn't been executed yet. Hourly draws happen automatically every hour on the hour. Buy tickets to enter the current draw!
                    </p>
                  </div>
                )}
              </>
            )}

            {selectedTab === 'daily' && (
              <>
                {dailyDraws.length > 0 ? (
                  <div>
                    <h2 style={{
                      textAlign: 'center',
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '28px',
                      background: 'linear-gradient(135deg, var(--accent), var(--light))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '40px',
                      letterSpacing: '3px'
                    }}>
                      🌙 RECENT DAILY DRAWS
                    </h2>
                    {dailyDraws.map(draw => renderDrawCard(draw))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 40px',
                    background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '20px'
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌙</div>
                    <h3 style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '24px',
                      color: 'var(--accent)',
                      marginBottom: '15px'
                    }}>
                      No Completed Daily Draws Yet
                    </h3>
                    <p style={{
                      color: 'var(--light)',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      lineHeight: 1.6,
                      maxWidth: '500px',
                      margin: '0 auto'
                    }}>
                      The first daily draw hasn't been executed yet. Daily draws happen automatically every day at 8 PM Central Time. Buy tickets to enter the current draw!
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* Animation for pulse */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </ErrorBoundary>
  );
}
