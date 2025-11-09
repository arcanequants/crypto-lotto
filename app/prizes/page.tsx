'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { LoginButton } from '@/components/LoginButton';
import { PrizeBalance } from '@/components/PrizeBalance';
import { supabase, type Ticket } from '@/lib/supabase';
import {
  calculateWinnersByTier,
  getUserWinningTickets,
  calculateUnclaimedPrizes,
  PRIZE_TIERS,
  type PrizeTier
} from '@/lib/lottery';
import { fireGoldConfetti, fireJackpotConfetti } from '@/lib/confetti';
import { PrizeCardSkeleton } from '@/components/Skeleton';
import { analytics } from '@/lib/analytics';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PrizesPage() {
  const { ready, authenticated, user } = usePrivy();
  const [loading, setLoading] = useState(true);
  const [winningTickets, setWinningTickets] = useState<Array<{
    ticketId: number;
    tier: PrizeTier;
    amount: number;
    claimed: boolean;
    ticket: Ticket;
  }>>([]);
  const [claimingTicketId, setClaimingTicketId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const TOTAL_PRIZE_POOL = 5000;

  useEffect(() => {
    if (ready && authenticated && user) {
      loadUserPrizes();
    } else if (ready && !authenticated) {
      setLoading(false);
    }
  }, [ready, authenticated, user]);

  const loadUserPrizes = async () => {
    try {
      setLoading(true);

      const walletAddress = user?.wallet?.address || user?.email?.address;
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      // Get winning numbers from latest draw
      const { data: draw } = await supabase
        .from('draws')
        .select('id, winning_numbers, power_number, status')
        .eq('id', 1)
        .single();

      if (!draw || !draw.winning_numbers || draw.winning_numbers.length === 0) {
        setLoading(false);
        return;
      }

      const winningNumbers = {
        mainNumbers: draw.winning_numbers,
        powerNumber: draw.power_number
      };

      // Get all tickets for this draw (minimal fields for winner calculation)
      const { data: allTickets } = await supabase
        .from('tickets')
        .select('id, numbers, power_number, draw_id')
        .eq('draw_id', 1);

      // Calculate winners by tier
      const winnersByTier = calculateWinnersByTier(allTickets || [], winningNumbers);

      // Get user's tickets
      const { data: userTickets } = await supabase
        .from('tickets')
        .select('id, ticket_id, numbers, power_number, claim_status, claimed_at, prize_amount, draw_id, wallet_address, created_at, price_paid')
        .eq('wallet_address', walletAddress) // FIXED: era user_wallet
        .eq('draw_id', 1)
        .limit(50); // Limit to last 50 tickets

      if (!userTickets || userTickets.length === 0) {
        setLoading(false);
        return;
      }

      // Get winning tickets with amounts
      const winningTicketsData = getUserWinningTickets(
        userTickets,
        winningNumbers,
        TOTAL_PRIZE_POOL,
        winnersByTier
      );

      // Attach full ticket data
      const winningTicketsWithData = winningTicketsData.map(wt => {
        const ticket = userTickets.find(t => t.id === wt.ticketId)!;
        return { ...wt, ticket } as any;
      });

      setWinningTickets(winningTicketsWithData as any);
      setLoading(false);
    } catch (error) {
      console.error('Error loading prizes:', error);
      setLoading(false);
    }
  };

  const claimPrize = async (ticketId: number, amount: number) => {
    try {
      setClaimingTicketId(ticketId);

      // MOCK: Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update ticket in database
      const { error } = await supabase
        .from('tickets')
        .update({
          claim_status: 'claimed',
          claimed_at: new Date().toISOString(),
          prize_amount: amount
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error claiming prize:', error);
        showToast('Failed to claim prize. Please try again.', 'error');
        setClaimingTicketId(null);
        return;
      }

      // 🎉 CONFETTI TIME!
      if (amount >= 2000) {
        // Jackpot! Epic confetti
        fireJackpotConfetti();
      } else {
        // Regular win - gold confetti
        fireGoldConfetti();
      }

      analytics.prizeClaim(amount);
      showToast(`🎉 Prize of $${amount.toFixed(2)} claimed successfully!`, 'success');

      // Reload prizes
      await loadUserPrizes();
      setClaimingTicketId(null);
    } catch (error) {
      console.error('Error claiming prize:', error);
      showToast('Failed to claim prize. Please try again.', 'error');
      setClaimingTicketId(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const unclaimedPrizes = winningTickets.filter(t => !t.claimed);
  const claimedPrizes = winningTickets.filter(t => t.claimed);
  const totalUnclaimed = calculateUnclaimedPrizes(winningTickets);

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
              href="/results"
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
              RESULTS
            </Link>
            <PrizeBalance />
            <LoginButton />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <div className="container">
          <h1 className="hero-title" style={{ fontSize: '48px' }}>My Prizes</h1>
          <p className="hero-subtitle">Claim your winnings and view prize history</p>
        </div>
      </section>

      {/* Prizes Content */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        {!ready || loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '25px',
            padding: '0 20px'
          }}>
            {[...Array(4)].map((_, i) => (
              <PrizeCardSkeleton key={i} />
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
                Please connect your wallet to view your prizes
              </p>
              <LoginButton />
            </div>
          </div>
        ) : winningTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              background: 'rgba(0, 240, 255, 0.1)',
              border: '2px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎁</div>
              <h2 style={{
                color: 'var(--primary)',
                fontFamily: "'Orbitron', sans-serif",
                marginBottom: '15px',
                fontSize: '24px'
              }}>
                No Prizes Yet
              </h2>
              <p style={{
                color: 'var(--light)',
                fontFamily: "'Inter', sans-serif",
                marginBottom: '30px',
                opacity: 0.8
              }}>
                You don't have any winning tickets yet. Keep playing!
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
                  BUY TICKETS
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Total Balance */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 149, 0, 0.2))',
              border: '3px solid var(--accent)',
              borderRadius: '30px',
              padding: '40px',
              marginBottom: '40px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(255, 215, 0, 0.3)'
            }}>
              <div style={{
                fontSize: '18px',
                fontFamily: "'Orbitron', sans-serif",
                color: 'var(--light)',
                marginBottom: '15px',
                letterSpacing: '2px',
                opacity: 0.9
              }}>
                TOTAL UNCLAIMED BALANCE
              </div>
              <div style={{
                fontSize: '72px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--accent), #fff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '10px'
              }}>
                ${totalUnclaimed.toFixed(2)}
              </div>
              <div style={{
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                color: 'var(--light)',
                opacity: 0.7
              }}>
                {unclaimedPrizes.length} unclaimed {unclaimedPrizes.length === 1 ? 'prize' : 'prizes'}
              </div>
            </div>

            {/* Unclaimed Prizes */}
            {unclaimedPrizes.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '28px',
                  color: 'var(--primary)',
                  marginBottom: '25px',
                  textAlign: 'center',
                  letterSpacing: '2px'
                }}>
                  CLAIMABLE PRIZES
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '25px',
                  padding: '0 20px'
                }}>
                  {unclaimedPrizes.map((prize) => (
                    <div
                      key={prize.ticketId}
                      style={{
                        background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
                        border: '2px solid rgba(255, 215, 0, 0.4)',
                        borderRadius: '20px',
                        padding: '25px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)'
                      }}
                    >
                      {/* Prize Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--accent)',
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 600,
                            marginBottom: '5px'
                          }}>
                            TICKET #{prize.ticketId}
                          </div>
                          <div style={{
                            fontSize: '16px',
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 700,
                            color: 'var(--primary)'
                          }}>
                            {PRIZE_TIERS[prize.tier].name}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '32px',
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 900,
                          background: 'linear-gradient(135deg, var(--accent), #fff)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          ${prize.amount.toFixed(2)}
                        </div>
                      </div>

                      {/* Numbers */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {prize.ticket.numbers.map((num, idx) => ( // FIXED: era selected_numbers
                            <div
                              key={idx}
                              style={{
                                width: '35px',
                                height: '35px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                fontFamily: "'Orbitron', sans-serif",
                                color: 'white'
                              }}
                            >
                              {num.toString().padStart(2, '0')}
                            </div>
                          ))}
                          <span style={{ margin: '0 5px', color: 'var(--accent)', fontSize: '20px' }}>+</span>
                          <div
                            style={{
                              width: '35px',
                              height: '35px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--accent), #ffa500)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              fontFamily: "'Orbitron', sans-serif",
                              color: 'white'
                            }}
                          >
                            {prize.ticket.power_number.toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>

                      {/* Claim Button */}
                      <button
                        onClick={() => claimPrize(prize.ticketId, prize.amount)}
                        disabled={claimingTicketId === prize.ticketId}
                        style={{
                          width: '100%',
                          padding: '18px',
                          background: claimingTicketId === prize.ticketId
                            ? 'rgba(255, 215, 0, 0.3)'
                            : 'linear-gradient(135deg, var(--accent), #ffa500)',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: 700,
                          fontFamily: "'Orbitron', sans-serif",
                          color: 'var(--darker)',
                          cursor: claimingTicketId === prize.ticketId ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          opacity: claimingTicketId === prize.ticketId ? 0.6 : 1
                        }}
                        onMouseOver={(e) => {
                          if (claimingTicketId !== prize.ticketId) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 215, 0, 0.5)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (claimingTicketId !== prize.ticketId) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        {claimingTicketId === prize.ticketId ? '⏳ CLAIMING...' : 'CLAIM PRIZE'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claimed Prizes History */}
            {claimedPrizes.length > 0 && (
              <div>
                <h2 style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '28px',
                  color: 'var(--light)',
                  marginBottom: '25px',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  opacity: 0.7
                }}>
                  CLAIMED PRIZES
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '25px',
                  padding: '0 20px'
                }}>
                  {claimedPrizes.map((prize) => (
                    <div
                      key={prize.ticketId}
                      style={{
                        background: 'rgba(0, 20, 40, 0.6)',
                        border: '2px solid rgba(0, 240, 255, 0.2)',
                        borderRadius: '20px',
                        padding: '25px',
                        backdropFilter: 'blur(10px)',
                        opacity: 0.7
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--light)',
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 600,
                            marginBottom: '5px',
                            opacity: 0.6
                          }}>
                            TICKET #{prize.ticketId}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 700,
                            color: 'var(--light)'
                          }}>
                            {PRIZE_TIERS[prize.tier].name}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '24px',
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 900,
                          color: 'var(--light)'
                        }}>
                          ${prize.amount.toFixed(2)}
                        </div>
                      </div>

                      <div style={{
                        padding: '12px',
                        background: 'rgba(0, 240, 255, 0.1)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          fontFamily: "'Inter', sans-serif",
                          color: 'var(--primary)',
                          fontWeight: 600
                        }}>
                          ✓ CLAIMED
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </ErrorBoundary>
  );
}
