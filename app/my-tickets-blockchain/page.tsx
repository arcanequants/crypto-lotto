'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { LoginButton } from '@/components/LoginButton';
import Link from 'next/link';

interface BlockchainTicket {
  id: number;
  ticketNumber: number;
  numbers: number[];
  powerNumber: number;
  walletAddress?: string;
  drawId: number;
  token: string;
  cost: string;
  purchasedAt: string;
  txHash?: string;
}

export default function MyTicketsBlockchainPage() {
  const { ready, authenticated, user } = usePrivy();
  const { client: smartWalletClient } = useSmartWallets();
  const [tickets, setTickets] = useState<BlockchainTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Get smart wallet address (same as used in purchases)
  const walletAddress = smartWalletClient?.account?.address;

  useEffect(() => {
    if (ready && authenticated) {
      loadTickets();
    } else if (ready && !authenticated) {
      setLoading(false);
    }
  }, [ready, authenticated]);

  const loadTickets = () => {
    try {
      setLoading(true);

      console.log('🔍 Loading tickets for wallet:', walletAddress);

      // Load tickets from localStorage
      const storedTickets = localStorage.getItem('blockchain_tickets');
      console.log('🔍 Raw localStorage data:', storedTickets);

      if (storedTickets) {
        const allTickets: BlockchainTicket[] = JSON.parse(storedTickets);
        console.log('📋 All tickets in localStorage:', allTickets);
        console.log('📋 Total number of tickets:', allTickets.length);

        // Show all tickets (no wallet filtering for testing)
        console.log('✅ Displaying all tickets from localStorage');
        setTickets(allTickets);
      } else {
        console.log('⚠️ No tickets found in localStorage');
        console.log('💡 localStorage keys:', Object.keys(localStorage));
        setTickets([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading tickets:', err);
      setTickets([]);
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
            <LoginButton />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <div className="container">
          <h1 className="hero-title" style={{ fontSize: '48px' }}>My Blockchain Tickets</h1>
          <p className="hero-subtitle">View your tickets purchased on-chain</p>
          {walletAddress && (
            <p className="hero-subtitle" style={{ fontSize: '14px', opacity: 0.7 }}>
              Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          )}
        </div>
      </section>

      {/* Tickets Content */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        {!ready || loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <p style={{ color: 'var(--light)', opacity: 0.8 }}>Loading tickets...</p>
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
                      Draw #{ticket.drawId} • {ticket.token}
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
                    ${ticket.cost}
                  </div>
                </div>

                {/* Selected Number (ULTRA SIMPLE: only 1 number) */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--light)',
                    opacity: 0.7,
                    fontFamily: "'Orbitron', sans-serif",
                    marginBottom: '10px',
                    letterSpacing: '1px'
                  }}>
                    SELECTED NUMBER (1-10)
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        fontFamily: "'Orbitron', sans-serif",
                        color: 'white',
                        boxShadow: '0 3px 10px rgba(0, 240, 255, 0.4)'
                      }}
                    >
                      {ticket.ticketNumber}
                    </div>
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
                  marginBottom: '10px'
                }}>
                  Purchased: {new Date(ticket.purchasedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                {/* TX Hash (if available) */}
                {ticket.txHash && (
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--light)',
                    opacity: 0.5,
                    fontFamily: "'monospace'",
                    wordBreak: 'break-all'
                  }}>
                    TX: {ticket.txHash.slice(0, 10)}...{ticket.txHash.slice(-8)}
                  </div>
                )}

                {/* Status */}
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontFamily: "'Orbitron', sans-serif",
                  color: 'var(--primary)'
                }}>
                  🎲 Waiting for draw...
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
