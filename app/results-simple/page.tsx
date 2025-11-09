'use client';

import { useState, useEffect } from 'react';
import { LoginButton } from '@/components/LoginButton';
import Link from 'next/link';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}`;
const ALCHEMY_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo';

const LOTTERY_ABI = [
  {
    inputs: [],
    name: 'getCurrentDraw',
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'prizePoolUSDC', type: 'uint256' },
      { name: 'prizePoolUSDT', type: 'uint256' },
      { name: 'winnersCount', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'drawId', type: 'uint256' }],
    name: 'getDraw',
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'prizePoolUSDC', type: 'uint256' },
      { name: 'prizePoolUSDT', type: 'uint256' },
      { name: 'winnersCount', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface DrawData {
  id: number;
  endTime: number;
  executed: boolean;
  winningNumber: number;
  totalTickets: number;
  prizePoolUSDC: string;
  prizePoolUSDT: string;
  winnersCount: number;
}

export default function ResultsSimplePage() {
  const [currentDraw, setCurrentDraw] = useState<DrawData | null>(null);
  const [previousDraw, setPreviousDraw] = useState<DrawData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(ALCHEMY_RPC_URL)
      });

      // Get current draw
      const currentResult = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'getCurrentDraw'
      });

      const current: DrawData = {
        id: Number(currentResult[0]),
        endTime: Number(currentResult[1]),
        executed: currentResult[2],
        winningNumber: Number(currentResult[3]),
        totalTickets: Number(currentResult[4]),
        prizePoolUSDC: formatUnits(currentResult[5], 6),
        prizePoolUSDT: formatUnits(currentResult[6], 6),
        winnersCount: Number(currentResult[7])
      };

      console.log('🎲 Results page - Current draw from blockchain:', {
        drawId: current.id,
        endTime: new Date(current.endTime * 1000).toLocaleString(),
        executed: current.executed,
        winningNumber: current.winningNumber,
        totalTickets: current.totalTickets,
        prizePool: `$${(parseFloat(current.prizePoolUSDC) + parseFloat(current.prizePoolUSDT)).toFixed(2)}`,
        winnersCount: current.winnersCount
      });

      setCurrentDraw(current);

      // If current draw has a winning number, it's been executed - this is the "previous" draw
      // Try to get the draw before it
      if (current.executed && current.id > 1) {
        try {
          const prevResult = await publicClient.readContract({
            address: LOTTERY_CONTRACT,
            abi: LOTTERY_ABI,
            functionName: 'getDraw',
            args: [BigInt(current.id - 1)]
          });

          const prev: DrawData = {
            id: Number(prevResult[0]),
            endTime: Number(prevResult[1]),
            executed: prevResult[2],
            winningNumber: Number(prevResult[3]),
            totalTickets: Number(prevResult[4]),
            prizePoolUSDC: formatUnits(prevResult[5], 6),
            prizePoolUSDT: formatUnits(prevResult[6], 6),
            winnersCount: Number(prevResult[7])
          };

          setPreviousDraw(prev);
        } catch (err) {
          console.log('No previous draw found');
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching draws:', error);
      setLoading(false);
    }
  };

  return (
    <div>
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
              href="/my-tickets-blockchain"
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
            <LoginButton />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <div className="container">
          <h1 className="hero-title" style={{ fontSize: '48px' }}>🏆 Draw Results</h1>
          <p className="hero-subtitle">View winning numbers from recent draws</p>
        </div>
      </section>

      {/* Results Content */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <p style={{ color: 'var(--light)', opacity: 0.8 }}>Loading results from blockchain...</p>
          </div>
        ) : (
          <>
            {/* Current Draw */}
            {currentDraw && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
                border: '2px solid rgba(0, 240, 255, 0.4)',
                borderRadius: '30px',
                padding: '40px',
                marginBottom: '40px',
                boxShadow: '0 20px 60px rgba(0, 240, 255, 0.2)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#00f0ff',
                    marginBottom: '10px',
                    opacity: 0.8
                  }}>
                    {currentDraw.executed ? '✅ PREVIOUS DRAW' : '🎲 CURRENT DRAW'}
                  </div>
                  <h2 style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '32px',
                    background: 'linear-gradient(135deg, #00f0ff, var(--light))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '3px'
                  }}>
                    DRAW #{currentDraw.id}
                  </h2>
                  <div style={{
                    fontSize: '12px',
                    fontFamily: "'Inter', sans-serif",
                    color: 'var(--light)',
                    opacity: 0.6,
                    marginTop: '5px'
                  }}>
                    {new Date(currentDraw.endTime * 1000).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Always show draw info */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'rgba(0, 240, 255, 0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(0, 240, 255, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '10px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Prize Pool
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#ffd700',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>
                      ${(parseFloat(currentDraw.prizePoolUSDC) + parseFloat(currentDraw.prizePoolUSDT)).toFixed(2)}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0, 240, 255, 0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(0, 240, 255, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '10px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Total Tickets
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#00f0ff',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>
                      {currentDraw.totalTickets}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0, 240, 255, 0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(0, 240, 255, 0.2)'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '10px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Status
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: currentDraw.executed ? '#4ade80' : '#ffd700',
                      fontFamily: "'Orbitron', sans-serif"
                    }}>
                      {currentDraw.executed ? '✅ EXECUTED' : '⏳ IN PROGRESS'}
                    </div>
                  </div>
                </div>

                {currentDraw.executed && currentDraw.winningNumber > 0 ? (
                  <>
                    {/* Winning Number Display */}
                    <div style={{
                      background: 'rgba(0, 240, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '40px',
                      textAlign: 'center',
                      marginBottom: '30px',
                      border: '2px solid rgba(0, 240, 255, 0.3)'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontFamily: "'Orbitron', sans-serif",
                        color: '#00f0ff',
                        marginBottom: '20px',
                        letterSpacing: '2px'
                      }}>
                        🎲 WINNING NUMBER
                      </div>
                      <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '72px',
                        fontWeight: 'bold',
                        fontFamily: "'Orbitron', sans-serif",
                        color: 'white',
                        boxShadow: '0 10px 40px rgba(0, 240, 255, 0.6)',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}>
                        {currentDraw.winningNumber}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '20px'
                    }}>
                      <div style={{
                        background: 'rgba(0, 240, 255, 0.05)',
                        borderRadius: '15px',
                        padding: '20px',
                        textAlign: 'center',
                        border: '1px solid rgba(0, 240, 255, 0.2)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginBottom: '10px',
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          Prize Pool
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 'bold',
                          color: '#ffd700',
                          fontFamily: "'Orbitron', sans-serif"
                        }}>
                          ${(parseFloat(currentDraw.prizePoolUSDC) + parseFloat(currentDraw.prizePoolUSDT)).toFixed(2)}
                        </div>
                      </div>

                      <div style={{
                        background: 'rgba(0, 240, 255, 0.05)',
                        borderRadius: '15px',
                        padding: '20px',
                        textAlign: 'center',
                        border: '1px solid rgba(0, 240, 255, 0.2)'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginBottom: '10px',
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          Total Tickets
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 'bold',
                          color: '#00f0ff',
                          fontFamily: "'Orbitron', sans-serif"
                        }}>
                          {currentDraw.totalTickets}
                        </div>
                      </div>

                      <div style={{
                        background: currentDraw.winnersCount > 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                        borderRadius: '15px',
                        padding: '20px',
                        textAlign: 'center',
                        border: `1px solid ${currentDraw.winnersCount > 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginBottom: '10px',
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          Winners
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: 'bold',
                          color: currentDraw.winnersCount > 0 ? '#4ade80' : '#ff6b6b',
                          fontFamily: "'Orbitron', sans-serif"
                        }}>
                          {currentDraw.winnersCount} {currentDraw.winnersCount === 1 ? '🏆' : currentDraw.winnersCount > 1 ? '🎉' : '😢'}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    borderRadius: '20px',
                    border: '2px solid rgba(255, 215, 0, 0.3)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
                    <div style={{
                      fontSize: '18px',
                      fontFamily: "'Orbitron', sans-serif",
                      color: '#ffd700',
                      marginBottom: '10px'
                    }}>
                      Draw In Progress
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Winning number will be revealed when the draw executes
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Previous Draw (if exists) */}
            {previousDraw && previousDraw.executed && previousDraw.winningNumber > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.7), rgba(5, 8, 17, 0.85))',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '30px',
                padding: '40px',
                opacity: 0.8
              }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontFamily: "'Orbitron', sans-serif",
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '10px',
                    opacity: 0.8
                  }}>
                    ⌛ OLDER DRAW
                  </div>
                  <h2 style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '28px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    letterSpacing: '2px'
                  }}>
                    DRAW #{previousDraw.id}
                  </h2>
                </div>

                {/* Winning Number */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '15px',
                    fontFamily: "'Orbitron', sans-serif"
                  }}>
                    Winning Number
                  </div>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    fontFamily: "'Orbitron', sans-serif",
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    {previousDraw.winningNumber}
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  <div>
                    Prize: ${(parseFloat(previousDraw.prizePoolUSDC) + parseFloat(previousDraw.prizePoolUSDT)).toFixed(2)}
                  </div>
                  <div>
                    Tickets: {previousDraw.totalTickets}
                  </div>
                  <div>
                    Winners: {previousDraw.winnersCount}
                  </div>
                </div>
              </div>
            )}

            {/* Check Your Tickets CTA */}
            <div style={{
              marginTop: '60px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 215, 0, 0.1))',
              border: '2px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '20px',
              padding: '40px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎫</div>
              <h3 style={{
                fontSize: '28px',
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(135deg, #00f0ff, #ffd700)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '15px'
              }}>
                Check If You Won!
              </h3>
              <p style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: "'Inter', sans-serif",
                marginBottom: '30px'
              }}>
                View your tickets to see if any of your numbers matched the winning number
              </p>
              <Link href="/my-tickets-blockchain">
                <button style={{
                  padding: '18px 40px',
                  background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
                  border: 'none',
                  borderRadius: '15px',
                  color: 'white',
                  fontSize: '18px',
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(0, 240, 255, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 240, 255, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 240, 255, 0.3)';
                }}
                >
                  🏆 VIEW MY TICKETS
                </button>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}
