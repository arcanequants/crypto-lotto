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
  }
] as const;

interface DrawResults {
  drawType: 'hourly' | 'daily';
  drawId: number;
  drawTime: number;
  winningNumber: number;
  totalPrize: bigint;
  winner: string;
  executed: boolean;
  totalTickets: number;
  salesClosed: boolean;
}

export default function ResultsPage() {
  console.log('🎯 ResultsPage component rendering...');

  const [loading, setLoading] = useState(true);
  const [hourlyDraws, setHourlyDraws] = useState<DrawResults[]>([]);
  const [dailyDraws, setDailyDraws] = useState<DrawResults[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'hourly' | 'daily'>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(10);

  const contractAddress = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}`;
  console.log('🎯 Contract address initialized:', contractAddress);

  useEffect(() => {
    console.log('[Results] useEffect triggered');
    console.log('[Results] historyLimit:', historyLimit);
    console.log('[Results] contractAddress:', contractAddress);

    if (!contractAddress) {
      console.error('[Results] ❌ Contract address is undefined!');
      console.error('[Results] env vars:', {
        LOTTERY_CONTRACT: process.env.NEXT_PUBLIC_LOTTERY_CONTRACT,
        CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        LOTTERY_DUAL_CRYPTO: process.env.NEXT_PUBLIC_LOTTERY_DUAL_CRYPTO
      });
      setLoading(false);
      return;
    }

    loadDrawResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLimit]);

  const loadDrawResults = async () => {
    try {
      setLoading(true);
      console.log('[Results] Starting to load draw results...');
      console.log('[Results] Contract address:', contractAddress);
      console.log('[Results] History limit:', historyLimit);

      const publicClient = createPublicClient({
        chain: base,
        transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
      });

      // Get current draw IDs
      console.log('[Results] Fetching current draw IDs...');
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

      console.log('[Results] Current hourly draw ID:', currentHourlyDrawId.toString());
      console.log('[Results] Current daily draw ID:', currentDailyDrawId.toString());

      // Load hourly draws based on historyLimit
      const hourlyResults: DrawResults[] = [];
      const startHourly = currentHourlyDrawId > BigInt(historyLimit) ? currentHourlyDrawId - BigInt(historyLimit) : 1n;
      console.log('[Results] Loading hourly draws from', currentHourlyDrawId.toString(), 'to', startHourly.toString());

      for (let i = currentHourlyDrawId; i >= startHourly && i >= 1n; i--) {
        try {
          const draw = await publicClient.readContract({
            address: contractAddress,
            abi: LOTTERY_ABI,
            functionName: 'getHourlyDraw',
            args: [i]
          });

          console.log(`[Results] Draw #${i}:`, {
            executed: draw.executed,
            drawTime: draw.drawTime.toString(),
            winningNumber: draw.winningNumber,
            totalTickets: draw.totalTickets.toString()
          });

          // Show all executed draws (even with 0 tickets)
          if (draw.executed && draw.drawTime > 0n) {
            // Calculate total prize in USDC (usdcPrizeSnapshot is in wei with 6 decimals)
            const usdcPrize = draw.usdcPrizeSnapshot;

            hourlyResults.push({
              drawType: 'hourly',
              drawId: Number(draw.drawId),
              drawTime: Number(draw.drawTime),
              winningNumber: Number(draw.winningNumber),
              totalPrize: usdcPrize,
              winner: draw.winner,
              executed: draw.executed,
              totalTickets: Number(draw.totalTickets),
              salesClosed: draw.salesClosed
            });
          }
        } catch (error) {
          console.error(`Error loading hourly draw ${i}:`, error);
        }
      }

      // Load daily draws based on historyLimit
      const dailyResults: DrawResults[] = [];
      const startDaily = currentDailyDrawId > BigInt(historyLimit) ? currentDailyDrawId - BigInt(historyLimit) : 1n;
      for (let i = currentDailyDrawId; i >= startDaily && i >= 1n; i--) {
        try {
          const draw = await publicClient.readContract({
            address: contractAddress,
            abi: LOTTERY_ABI,
            functionName: 'getDailyDraw',
            args: [i]
          });

          // Show all executed draws (even with 0 tickets)
          if (draw.executed && draw.drawTime > 0n) {
            // Calculate total prize in USDC (usdcPrizeSnapshot is in wei with 6 decimals)
            const usdcPrize = draw.usdcPrizeSnapshot;

            dailyResults.push({
              drawType: 'daily',
              drawId: Number(draw.drawId),
              drawTime: Number(draw.drawTime),
              winningNumber: Number(draw.winningNumber),
              totalPrize: usdcPrize,
              winner: draw.winner,
              executed: draw.executed,
              totalTickets: Number(draw.totalTickets),
              salesClosed: draw.salesClosed
            });
          }
        } catch (error) {
          console.error(`Error loading daily draw ${i}:`, error);
        }
      }

      console.log('[Results] Total hourly draws found:', hourlyResults.length);
      console.log('[Results] Total daily draws found:', dailyResults.length);

      setHourlyDraws(hourlyResults);
      setDailyDraws(dailyResults);
      setLoading(false);
    } catch (error) {
      console.error('[Results] ❌ Error loading draw results:', error);
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
    // Prize is in USDC with 6 decimals
    const usdcValue = Number(prize) / 1e6;
    return usdcValue.toFixed(2);
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
            {draw.totalTickets === 0 ? 'NO PARTICIPANTS' : 'WINNING NUMBER'}
          </div>
          {draw.totalTickets === 0 ? (
            <div style={{
              fontSize: '16px',
              fontFamily: "'Orbitron', sans-serif",
              color: 'var(--light)',
              opacity: 0.6,
              padding: '20px'
            }}>
              No tickets were sold for this draw
            </div>
          ) : (
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
          )}
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
              ${formatPrize(draw.totalPrize)} USDC
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
              Total Tickets
            </div>
            <div style={{
              fontSize: '20px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              color: draw.totalTickets > 0 ? '#4ade80' : '#ef4444'
            }}>
              {draw.totalTickets}
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
          <h1 className="hero-title" style={{ fontSize: '48px' }}>Draw Results [v2.1.0]</h1>
          <p className="hero-subtitle">View past winning numbers from the blockchain - Updated Nov 13, 2025</p>
        </div>
      </section>

      {/* Tab Selector */}
      <section className="container" style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSelectedTab('all')}
            style={{
              padding: '15px 40px',
              background: selectedTab === 'all'
                ? 'linear-gradient(135deg, #00f0ff, #ffd700)'
                : 'rgba(255, 255, 255, 0.05)',
              border: selectedTab === 'all'
                ? '2px solid rgba(0, 240, 255, 0.6)'
                : '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: selectedTab === 'all' ? 'white' : 'var(--light)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseOver={(e) => {
              if (selectedTab !== 'all') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedTab !== 'all') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
          >
            📊 All Draws
          </button>
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
            ⏰ Hourly
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
            🌙 Daily
          </button>
        </div>

        {/* History Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px',
          marginTop: '25px'
        }}>
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            color: 'var(--light)',
            opacity: 0.8
          }}>
            Show last:
          </span>
          {[5, 10, 25, 50].map(limit => (
            <button
              key={limit}
              onClick={() => setHistoryLimit(limit)}
              style={{
                padding: '8px 20px',
                background: historyLimit === limit
                  ? 'rgba(0, 240, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: historyLimit === limit
                  ? '2px solid var(--primary)'
                  : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: historyLimit === limit ? 'var(--primary)' : 'var(--light)',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {limit}
            </button>
          ))}
          <span style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            color: 'var(--light)',
            opacity: 0.8
          }}>
            draws
          </span>
        </div>
      </section>

      {/* Results Content */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        {loading ? (
          <WinningNumbersSkeleton />
        ) : (
          <>
            {selectedTab === 'all' && (
              <>
                {hourlyDraws.length > 0 || dailyDraws.length > 0 ? (
                  <div>
                    <h2 style={{
                      textAlign: 'center',
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '28px',
                      background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '40px',
                      letterSpacing: '3px'
                    }}>
                      📊 ALL RECENT DRAWS
                    </h2>

                    {/* Combined draws sorted by drawTime */}
                    {[...hourlyDraws, ...dailyDraws]
                      .sort((a, b) => b.drawTime - a.drawTime)
                      .map(draw => renderDrawCard(draw))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 40px',
                    background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
                    border: '2px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '20px'
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎲</div>
                    <h3 style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '24px',
                      color: 'var(--primary)',
                      marginBottom: '15px'
                    }}>
                      No Completed Draws Yet
                    </h3>
                    <p style={{
                      color: 'var(--light)',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '16px',
                      lineHeight: 1.6,
                      maxWidth: '500px',
                      margin: '0 auto'
                    }}>
                      The lottery has just been deployed! Draws will appear here once they're executed. Buy tickets to participate in the next draw!
                    </p>
                  </div>
                )}
              </>
            )}

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
