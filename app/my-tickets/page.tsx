'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { LoginButton } from '@/components/LoginButton';
import { PrizeBalance } from '@/components/PrizeBalance';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { TicketCardSkeleton } from '@/components/Skeleton';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import lotteryContract from '@/lib/contracts/lottery-contract';
import { DrawCountdown } from '@/components/DrawCountdown';

const LOTTERY_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}`;
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const ALCHEMY_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

// ABI for reading tickets
const LOTTERY_ABI = [
  {
    inputs: [{ name: 'ticketId', type: 'uint256' }],
    name: 'tickets',
    outputs: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'number', type: 'uint8' },
      { name: 'hourlyDrawId', type: 'uint256' },
      { name: 'dailyDrawId', type: 'uint256' },
      { name: 'hourlyClaimed', type: 'bool' },
      { name: 'dailyClaimed', type: 'bool' },
      { name: 'purchaseTime', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'nextTicketId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface DrawInfo {
  drawId: number;
  drawTime: bigint;
  winningNumber: number;
  executed: boolean;
  salesClosed: boolean;
  totalTickets: bigint;
}

interface BlockchainTicket {
  id: number;
  owner: string;
  number: number;
  hourlyDrawId: number;
  dailyDrawId: number;
  hourlyClaimed: boolean;
  dailyClaimed: boolean;
  purchaseTime: number;
  hourlyDrawInfo?: DrawInfo;
  dailyDrawInfo?: DrawInfo;
}

export default function MyTicketsPage() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();
  const [tickets, setTickets] = useState<BlockchainTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (ready && authenticated && smartWalletClient) {
      fetchUserTickets();
    } else if (ready && !authenticated) {
      setLoading(false);
    } else if (ready && authenticated && !smartWalletClient) {
      // Smart wallet is still initializing
      setLoading(true);
    }
  }, [ready, authenticated, smartWalletClient]);

  const fetchUserTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use SMART WALLET address (same as useContract hook)
      // This is the ERC-4337 account that actually holds funds and buys tickets
      const smartWalletAddress = smartWalletClient?.account?.address;

      if (!smartWalletAddress) {
        setError('Smart wallet not ready');
        setLoading(false);
        return;
      }

      console.log('Checking tickets for smart wallet:', smartWalletAddress);

      const publicClient = createPublicClient({
        chain: base,
        transport: http(ALCHEMY_RPC_URL)
      });

      // Get next ticket ID (tickets are 0-indexed)
      const nextTicketId = await publicClient.readContract({
        address: LOTTERY_CONTRACT,
        abi: LOTTERY_ABI,
        functionName: 'nextTicketId'
      }) as bigint;

      const totalTickets = Number(nextTicketId);
      console.log(`Total tickets in contract: ${totalTickets}`);

      // Fetch all tickets and filter by user
      const userTickets: BlockchainTicket[] = [];

      for (let i = 0; i < totalTickets; i++) {
        try {
          const ticketData = await publicClient.readContract({
            address: LOTTERY_CONTRACT,
            abi: LOTTERY_ABI,
            functionName: 'tickets',
            args: [BigInt(i)]
          }) as [bigint, string, number, bigint, bigint, boolean, boolean, bigint];

          const [ticketId, owner, number, hourlyDrawId, dailyDrawId, hourlyClaimed, dailyClaimed, purchaseTime] = ticketData;

          // Check if ticket is owned by the smart wallet
          if (owner.toLowerCase() === smartWalletAddress.toLowerCase()) {
            // Fetch draw information for this ticket
            let hourlyDrawInfo: DrawInfo | undefined;
            let dailyDrawInfo: DrawInfo | undefined;

            try {
              const hourlyDraw = await lotteryContract.getHourlyDraw(hourlyDrawId);
              hourlyDrawInfo = {
                drawId: Number(hourlyDraw.drawId),
                drawTime: hourlyDraw.drawTime,
                winningNumber: Number(hourlyDraw.winningNumber),
                executed: hourlyDraw.executed,
                salesClosed: hourlyDraw.salesClosed,
                totalTickets: hourlyDraw.totalTickets
              };
            } catch (err) {
              console.error(`Error fetching hourly draw ${hourlyDrawId}:`, err);
            }

            try {
              const dailyDraw = await lotteryContract.getDailyDraw(dailyDrawId);
              dailyDrawInfo = {
                drawId: Number(dailyDraw.drawId),
                drawTime: dailyDraw.drawTime,
                winningNumber: Number(dailyDraw.winningNumber),
                executed: dailyDraw.executed,
                salesClosed: dailyDraw.salesClosed,
                totalTickets: dailyDraw.totalTickets
              };
            } catch (err) {
              console.error(`Error fetching daily draw ${dailyDrawId}:`, err);
            }

            userTickets.push({
              id: i,
              owner,
              number,
              hourlyDrawId: Number(hourlyDrawId),
              dailyDrawId: Number(dailyDrawId),
              hourlyClaimed,
              dailyClaimed,
              purchaseTime: Number(purchaseTime),
              hourlyDrawInfo,
              dailyDrawInfo
            });
          }
        } catch (err) {
          console.error(`Error fetching ticket ${i}:`, err);
        }
      }

      console.log(`Found ${userTickets.length} tickets for user`);
      setTickets(userTickets);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load tickets from blockchain');
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <ErrorBoundary>
      <div className="grid-bg"></div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type} show`}>
          {toast.message}
        </div>
      )}

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
            <PrizeBalance />
            <LoginButton />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <div className="container">
          <h1 className="hero-title" style={{ fontSize: '48px' }}>My Tickets</h1>
          <p className="hero-subtitle">View all your purchased lottery tickets from the blockchain</p>
        </div>
      </section>

      {/* Tickets Content */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        {!ready || loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '25px',
            padding: '0 20px'
          }}>
            {[...Array(3)].map((_, i) => (
              <TicketCardSkeleton key={i} />
            ))}
          </div>
        ) : !authenticated ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '2px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
              <h2 style={{
                color: 'var(--primary)',
                fontFamily: "'Orbitron', sans-serif",
                marginBottom: '15px',
                fontSize: '24px'
              }}>
                Authentication Required
              </h2>
              <p style={{
                color: 'var(--light)',
                fontFamily: "'Inter', sans-serif",
                marginBottom: '30px',
                opacity: 0.8
              }}>
                Please connect your wallet to view your tickets
              </p>
              <LoginButton />
            </div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              background: 'rgba(255, 50, 50, 0.1)',
              border: '2px solid rgba(255, 50, 50, 0.3)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
              <h2 style={{
                color: '#ff5252',
                fontFamily: "'Orbitron', sans-serif",
                marginBottom: '15px',
                fontSize: '24px'
              }}>
                Error Loading Tickets
              </h2>
              <p style={{
                color: 'var(--light)',
                fontFamily: "'Inter', sans-serif",
                opacity: 0.8
              }}>
                {error}
              </p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '2px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎫</div>
              <h2 style={{
                color: 'var(--primary)',
                fontFamily: "'Orbitron', sans-serif",
                marginBottom: '15px',
                fontSize: '24px'
              }}>
                No Tickets Yet
              </h2>
              <p style={{
                color: 'var(--light)',
                fontFamily: "'Inter', sans-serif",
                marginBottom: '30px',
                opacity: 0.8
              }}>
                You haven't purchased any tickets yet. Get started now!
              </p>
              <Link href="/">
                <button className="btn-primary" style={{
                  padding: '15px 40px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: 'white',
                  fontSize: '16px',
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
                }}>
                  🎲 BUY TICKETS
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '25px',
            padding: '0 20px'
          }}>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                style={{
                  background: 'rgba(0, 20, 40, 0.8)',
                  border: '2px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '20px',
                  padding: '25px',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 240, 255, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Blockchain Badge */}
                <a
                  href={`https://basescan.org/address/${LOTTERY_CONTRACT}#readContract`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))',
                    border: '2px solid rgba(0, 240, 255, 0.5)',
                    borderRadius: '50px',
                    padding: '10px 20px',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#00f0ff',
                    letterSpacing: '1px',
                    textDecoration: 'none',
                    marginBottom: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    animation: 'glow 2s ease-in-out infinite'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.6)';
                    e.currentTarget.style.borderColor = '#00f0ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.5)';
                  }}
                >
                  <span style={{
                    fontSize: '16px',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>🔗</span>
                  <span>VERIFIED ON BLOCKCHAIN</span>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    background: '#4ade80',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></span>
                </a>

                {/* Ticket Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '1px solid rgba(0, 240, 255, 0.2)'
                }}>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--primary)',
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 600,
                      marginBottom: '5px'
                    }}>
                      TICKET #{ticket.id}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--light)',
                      opacity: 0.6,
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Number: {ticket.number}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(0, 240, 255, 0.15)',
                    padding: '8px 15px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 600,
                    color: 'var(--primary)'
                  }}>
                    $0.10
                  </div>
                </div>

                {/* Add CSS animations */}
                <style jsx>{`
                  @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(0, 240, 255, 0.5); }
                    50% { box-shadow: 0 0 30px rgba(0, 240, 255, 0.8); }
                  }
                  @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                  }
                `}</style>

                {/* Lucky Number */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--light)',
                    opacity: 0.7,
                    fontFamily: "'Orbitron', sans-serif",
                    marginBottom: '10px',
                    letterSpacing: '1px'
                  }}>
                    YOUR LUCKY NUMBER
                  </div>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      fontFamily: "'Orbitron', sans-serif",
                      color: 'white',
                      boxShadow: '0 5px 20px rgba(0, 240, 255, 0.5)',
                      margin: '0 auto'
                    }}
                  >
                    {ticket.number.toString().padStart(2, '0')}
                  </div>
                </div>

                {/* Purchase Date */}
                <div style={{
                  paddingTop: '15px',
                  borderTop: '1px solid rgba(0, 240, 255, 0.2)',
                  fontSize: '11px',
                  color: 'var(--light)',
                  opacity: 0.6,
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  Purchased: {new Date(ticket.purchaseTime * 1000).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                {/* Draw Status */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    color: 'var(--accent)',
                    marginBottom: '15px',
                    textAlign: 'center',
                    letterSpacing: '1px'
                  }}>
                    🎰 DUAL LOTTERY STATUS
                  </div>

                  {/* Hourly Draw Status */}
                  <div style={{
                    background: ticket.hourlyDrawInfo?.executed
                      ? 'linear-gradient(135deg, rgba(0, 200, 255, 0.15), rgba(0, 150, 255, 0.08))'
                      : 'linear-gradient(135deg, rgba(0, 200, 255, 0.1), rgba(0, 150, 255, 0.05))',
                    border: `2px solid ${ticket.hourlyDrawInfo?.executed ? 'rgba(0, 200, 255, 0.5)' : 'rgba(0, 200, 255, 0.3)'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 600,
                      color: '#00c8ff',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>⚡ HOURLY DRAW</span>
                      <span style={{ opacity: 0.7, fontSize: '10px' }}>#{ticket.hourlyDrawId}</span>
                    </div>

                    {ticket.hourlyDrawInfo?.executed ? (
                      // Draw executed - show winning number
                      <div>
                        <div style={{
                          fontSize: '10px',
                          fontFamily: "'Inter', sans-serif",
                          color: 'var(--light)',
                          opacity: 0.7,
                          marginBottom: '6px'
                        }}>
                          Winning Number:
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: ticket.number === ticket.hourlyDrawInfo.winningNumber
                              ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                              : 'linear-gradient(135deg, #64748b, #475569)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            fontFamily: "'Orbitron', sans-serif",
                            color: 'white',
                            boxShadow: ticket.number === ticket.hourlyDrawInfo.winningNumber
                              ? '0 0 15px rgba(74, 222, 128, 0.6)'
                              : 'none'
                          }}>
                            {ticket.hourlyDrawInfo.winningNumber.toString().padStart(2, '0')}
                          </div>
                          {ticket.number === ticket.hourlyDrawInfo.winningNumber ? (
                            <span style={{
                              fontSize: '12px',
                              fontFamily: "'Orbitron', sans-serif",
                              fontWeight: 700,
                              color: '#4ade80'
                            }}>
                              🎉 YOU WON!
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              fontFamily: "'Inter', sans-serif",
                              color: 'var(--light)',
                              opacity: 0.6
                            }}>
                              Not a winner
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Draw not executed yet - show countdown
                      <div style={{
                        fontSize: '11px',
                        fontFamily: "'Inter', sans-serif",
                        color: 'var(--light)'
                      }}>
                        {ticket.hourlyDrawInfo ? (
                          <DrawCountdown
                            drawTime={ticket.hourlyDrawInfo.drawTime}
                            executed={ticket.hourlyDrawInfo.executed}
                            salesClosed={ticket.hourlyDrawInfo.salesClosed}
                          />
                        ) : (
                          <span style={{ opacity: 0.7 }}>⏳ Loading draw info...</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Daily Draw Status */}
                  <div style={{
                    background: ticket.dailyDrawInfo?.executed
                      ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.08))'
                      : 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))',
                    border: `2px solid ${ticket.dailyDrawInfo?.executed ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 215, 0, 0.3)'}`,
                    borderRadius: '12px',
                    padding: '12px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 600,
                      color: 'var(--accent)',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>💎 DAILY DRAW</span>
                      <span style={{ opacity: 0.7, fontSize: '10px' }}>#{ticket.dailyDrawId}</span>
                    </div>

                    {ticket.dailyDrawInfo?.executed ? (
                      // Draw executed - show winning number
                      <div>
                        <div style={{
                          fontSize: '10px',
                          fontFamily: "'Inter', sans-serif",
                          color: 'var(--light)',
                          opacity: 0.7,
                          marginBottom: '6px'
                        }}>
                          Winning Number:
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: ticket.number === ticket.dailyDrawInfo.winningNumber
                              ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                              : 'linear-gradient(135deg, #64748b, #475569)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            fontFamily: "'Orbitron', sans-serif",
                            color: 'white',
                            boxShadow: ticket.number === ticket.dailyDrawInfo.winningNumber
                              ? '0 0 15px rgba(74, 222, 128, 0.6)'
                              : 'none'
                          }}>
                            {ticket.dailyDrawInfo.winningNumber.toString().padStart(2, '0')}
                          </div>
                          {ticket.number === ticket.dailyDrawInfo.winningNumber ? (
                            <span style={{
                              fontSize: '12px',
                              fontFamily: "'Orbitron', sans-serif",
                              fontWeight: 700,
                              color: '#4ade80'
                            }}>
                              🎉 YOU WON!
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              fontFamily: "'Inter', sans-serif",
                              color: 'var(--light)',
                              opacity: 0.6
                            }}>
                              Not a winner
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Draw not executed yet - show countdown
                      <div style={{
                        fontSize: '11px',
                        fontFamily: "'Inter', sans-serif",
                        color: 'var(--light)'
                      }}>
                        {ticket.dailyDrawInfo ? (
                          <DrawCountdown
                            drawTime={ticket.dailyDrawInfo.drawTime}
                            executed={ticket.dailyDrawInfo.executed}
                            salesClosed={ticket.dailyDrawInfo.salesClosed}
                          />
                        ) : (
                          <span style={{ opacity: 0.7 }}>⏳ Loading draw info...</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ErrorBoundary>
  );
}
