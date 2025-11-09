'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { LoginButton } from '@/components/LoginButton';
import { PrizeBalance } from '@/components/PrizeBalance';
import { WalletBalanceDropdown } from '@/components/WalletBalanceDropdown';
import { DualCryptoPoolDisplay } from '@/components/DualCryptoPoolDisplay';
import { PaymentModal } from '@/app/components/PaymentModal';
import { DepositModal } from '@/app/components/DepositModal';
import { WithdrawModal } from '@/app/components/WithdrawModal';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import Link from 'next/link';
import { LOTTERY_CONFIG, TICKET_PRICING, IS_TESTING, getLotteryDisplayName } from '@/lib/config/lottery';
import { NotificationMonitor } from '@/components/NotificationMonitor';

export default function Home() {
  // ============================================
  // PRIVY AUTH
  // ============================================
  const { ready, authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();

  // ============================================
  // STATE
  // ============================================
  const [selectedMain, setSelectedMain] = useState<number[]>([]);
  const [selectedPower, setSelectedPower] = useState<number | null>(null);
  const [cart, setCart] = useState<Array<{
    id: string;
    numbers: number[];
    powerNumber: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing...');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState<number>(1);
  const [showStickyButtons, setShowStickyButtons] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Ref for cart section to scroll to
  const cartSectionRef = useRef<HTMLDivElement>(null);

  const TICKET_PRICE = TICKET_PRICING.priceUSD;
  const MAX_BULK_TICKETS = 50000; // Max tickets per purchase

  // Track page view and mounted state
  useEffect(() => {
    setMounted(true);
    analytics.pageView('/');
  }, []);

  // Scroll listener for sticky buttons
  useEffect(() => {
    const handleScroll = () => {
      if (cartSectionRef.current && cart.length > 0) {
        const cartTop = cartSectionRef.current.offsetTop;
        const scrollPosition = window.scrollY + window.innerHeight;
        const cartBottom = cartTop + cartSectionRef.current.offsetHeight;

        // Show sticky buttons when cart is partially off-screen
        setShowStickyButtons(window.scrollY > cartTop && scrollPosition < cartBottom + 100);
      } else {
        setShowStickyButtons(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [cart.length]);

  // ============================================
  // DRAW & COUNTDOWN
  // ============================================
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Next draw is every Sunday at 8:00 PM (20:00)
  const getNextDrawDate = () => {
    const now = new Date();
    const nextDraw = new Date();

    // Set to next Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    nextDraw.setDate(now.getDate() + daysUntilSunday);

    // Set to 8:00 PM
    nextDraw.setHours(20, 0, 0, 0);

    // If we're past Sunday 8 PM, go to next week
    if (now.getTime() > nextDraw.getTime()) {
      nextDraw.setDate(nextDraw.getDate() + 7);
    }

    return nextDraw;
  };

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const nextDraw = getNextDrawDate().getTime();
      const distance = nextDraw - now;

      if (distance > 0) {
        setTimeRemaining({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  // ============================================
  // NUMBER SELECTION
  // ============================================
  const toggleMainNumber = (num: number) => {
    if (selectedMain.includes(num)) {
      setSelectedMain(selectedMain.filter(n => n !== num));
    } else {
      if (selectedMain.length < LOTTERY_CONFIG.numbers.count) {
        setSelectedMain([...selectedMain, num].sort((a, b) => a - b));
      } else {
        showToast(`Maximum ${LOTTERY_CONFIG.numbers.count} main numbers allowed!`, 'error');
      }
    }
  };

  const togglePowerNumber = (num: number) => {
    setSelectedPower(selectedPower === num ? null : num);
  };

  const quickPick = () => {
    // Select random main numbers based on config
    const mainNumbers: number[] = [];
    while (mainNumbers.length < LOTTERY_CONFIG.numbers.count) {
      const num = Math.floor(Math.random() * LOTTERY_CONFIG.numbers.max) + LOTTERY_CONFIG.numbers.min;
      if (!mainNumbers.includes(num)) {
        mainNumbers.push(num);
      }
    }
    setSelectedMain(mainNumbers.sort((a, b) => a - b));

    // Select 1 random power number based on config (only if enabled)
    if (LOTTERY_CONFIG.powerNumber.enabled && LOTTERY_CONFIG.powerNumber.max > 0) {
      const powerNum = Math.floor(Math.random() * LOTTERY_CONFIG.powerNumber.max) + LOTTERY_CONFIG.powerNumber.min;
      setSelectedPower(powerNum);
    } else {
      setSelectedPower(null);
    }

    analytics.quickPick();
    showToast('🎲 Lucky numbers selected!', 'success');
  };

  const bulkQuickPick = () => {
    if (bulkQuantity < 1) {
      showToast('Please enter a valid quantity (minimum 1)', 'error');
      return;
    }

    if (bulkQuantity > MAX_BULK_TICKETS) {
      showToast(`Maximum ${MAX_BULK_TICKETS.toLocaleString()} tickets per bulk purchase`, 'error');
      return;
    }

    // Show loading for large purchases
    if (bulkQuantity > 1000) {
      setLoadingText(`Generating ${bulkQuantity.toLocaleString()} tickets...`);
      setLoading(true);
    }

    // Use setTimeout to allow loading screen to render
    setTimeout(() => {
      const newTickets = [];
      for (let i = 0; i < bulkQuantity; i++) {
        // Generate random main numbers based on config
        const mainNumbers: number[] = [];
        while (mainNumbers.length < LOTTERY_CONFIG.numbers.count) {
          const num = Math.floor(Math.random() * LOTTERY_CONFIG.numbers.max) + LOTTERY_CONFIG.numbers.min;
          if (!mainNumbers.includes(num)) {
            mainNumbers.push(num);
          }
        }

        // Generate random power number based on config (only if enabled)
        const powerNum = LOTTERY_CONFIG.powerNumber.enabled && LOTTERY_CONFIG.powerNumber.max > 0
          ? Math.floor(Math.random() * LOTTERY_CONFIG.powerNumber.max) + LOTTERY_CONFIG.powerNumber.min
          : 0;

        newTickets.push({
          id: `${Date.now()}-${i}`,
          numbers: mainNumbers.sort((a, b) => a - b),
          powerNumber: powerNum
        });
      }

      setCart([...cart, ...newTickets]);
      analytics.quickPick();
      setLoading(false);
      showToast(`✅ ${bulkQuantity.toLocaleString()} Quick Pick tickets generated!`, 'success');

      // Auto-scroll to tickets section
      setTimeout(() => {
        cartSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 200);
    }, bulkQuantity > 1000 ? 100 : 0);
  };

  const clearSelection = () => {
    setSelectedMain([]);
    setSelectedPower(null);
  };

  const clearAllCart = () => {
    if (cart.length === 0) {
      showToast('Cart is already empty', 'error');
      return;
    }

    if (confirm(`Are you sure you want to remove all ${cart.length} ticket(s) from cart?`)) {
      setCart([]);
      showToast(`🗑️ Cart cleared! (${cart.length} tickets removed)`, 'success');
    }
  };

  // ============================================
  // CART MANAGEMENT
  // ============================================
  const addToCart = () => {
    if (selectedMain.length !== LOTTERY_CONFIG.numbers.count) {
      showToast(`Please select exactly ${LOTTERY_CONFIG.numbers.count} main numbers!`, 'error');
      return;
    }

    // Only check power number if enabled
    if (LOTTERY_CONFIG.powerNumber.enabled && selectedPower === null) {
      showToast('Please select 1 power number!', 'error');
      return;
    }

    const newTicket = {
      id: Date.now().toString(),
      numbers: [...selectedMain],
      powerNumber: selectedPower || 0 // Use 0 if power number is disabled
    };

    analytics.addToCart(selectedMain, selectedPower || 0);
    setCart([...cart, newTicket]);
    clearSelection();
    showToast(`✅ Ticket #${cart.length + 1} added!`, 'success');

    // Auto-scroll to tickets section for better UX
    setTimeout(() => {
      cartSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 200);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(ticket => ticket.id !== id));
    showToast('Ticket removed from cart', 'success');
  };

  const buyAllTickets = async () => {
    if (!authenticated) {
      showToast('Please connect your wallet first', 'error');
      login();
      return;
    }

    if (cart.length === 0) {
      showToast('Cart is empty!', 'error');
      return;
    }

    // Open payment modal instead of MOCK purchase
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      setShowPaymentModal(false);

      // Track analytics
      analytics.ticketPurchase(cart.length, cart.length * TICKET_PRICE);

      showToast(
        `🎉 Successfully purchased ${cart.length} ticket${cart.length > 1 ? 's' : ''}! Redirecting to My Tickets...`,
        'success'
      );

      // Clear cart after successful purchase
      setCart([]);

      // Redirect to My Tickets page after 1.5 seconds
      setTimeout(() => {
        window.location.href = '/my-tickets';
      }, 1500);
    } catch (error) {
      console.error('Error after purchase:', error);
      showToast('Ticket purchased successfully! Redirecting...', 'success');
      setCart([]);

      // Redirect even if there's an error
      setTimeout(() => {
        window.location.href = '/my-tickets';
      }, 1500);
    }
  };

  const handlePaymentError = (error: string) => {
    showToast(error, 'error');
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  // ============================================
  // UI UTILITIES
  // ============================================
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <div className="grid-bg"></div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay active">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">{loadingText}</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type} show`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header>
        <nav className="container">
          <div className="logo">CryptoLotto</div>

          {/* Desktop Navigation */}
          <div className="nav-items">
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
            {authenticated && (
              <>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="neon-deposit-btn"
                >
                  💰 DEPOSIT
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="neon-withdraw-btn"
                >
                  💸 WITHDRAW
                </button>
                <WalletBalanceDropdown />
              </>
            )}
            <PrizeBalance />
            <LoginButton />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className={`mobile-menu-overlay ${showMobileMenu ? 'active' : ''}`}>
          <button
            className="mobile-menu-close"
            onClick={() => setShowMobileMenu(false)}
            aria-label="Close menu"
          >
            ✕
          </button>

          <div className="mobile-menu-content">
            <Link
              href="/my-tickets"
              className="mobile-menu-link"
              onClick={() => setShowMobileMenu(false)}
            >
              🎫 MY TICKETS
            </Link>

            <Link
              href="/prizes"
              className="mobile-menu-link"
              onClick={() => setShowMobileMenu(false)}
            >
              🏆 PRIZES
            </Link>

            {authenticated && (
              <>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowDepositModal(true);
                  }}
                  className="mobile-menu-link"
                  style={{
                    width: '100%',
                    background: 'rgba(0, 240, 255, 0.05)',
                    border: '2px solid rgba(0, 240, 255, 0.3)'
                  }}
                >
                  💰 DEPOSIT
                </button>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowWithdrawModal(true);
                  }}
                  className="mobile-menu-link"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: '2px solid rgba(255, 215, 0, 0.3)'
                  }}
                >
                  💸 WITHDRAW
                </button>
              </>
            )}

            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: 'rgba(0, 240, 255, 0.05)',
              borderRadius: '15px',
              border: '2px solid rgba(0, 240, 255, 0.2)'
            }}>
              <PrizeBalance />
            </div>

            <div style={{ marginTop: '20px' }}>
              <LoginButton />
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 className="hero-title" style={{
            background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 30%, #ffd700 65%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'glow 3s ease-in-out infinite',
            backgroundSize: '250%',
            backgroundPosition: 'center',
            filter: 'saturate(1.3) brightness(1.15)'
          }}>The Future of<br />Global Lottery</h1>

          {/* Main Tagline */}
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #ffd700 5%, #ffffff 50%, #ffd700 95%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '20px',
            letterSpacing: '2px',
            lineHeight: 1.4,
            backgroundSize: '100%',
            filter: 'saturate(1.2) brightness(1.1)'
          }}>
            The World's Most Transparent Lottery
          </div>

          {/* Trust Features */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '16px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
            marginTop: '15px',
            flexWrap: 'wrap'
          }}>
            <span>100% On-Chain</span>
            <span style={{ color: '#00f0ff', fontSize: '20px', opacity: 0.5 }}>•</span>
            <span>Verifiable by Anyone</span>
            <span style={{ color: '#00f0ff', fontSize: '20px', opacity: 0.5 }}>•</span>
            <span>Impossible to Manipulate</span>
          </div>

          {/* Blockchain Badge */}
          <div style={{
            marginTop: '35px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(255, 0, 255, 0.1))',
            border: '2px solid rgba(0, 240, 255, 0.5)',
            borderRadius: '50px',
            padding: '15px 35px',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            color: '#00f0ff',
            letterSpacing: '1.5px',
            backdropFilter: 'blur(10px)',
            animation: 'heroShimmer 3s ease-in-out infinite'
          }}>
            <span style={{
              fontSize: '18px',
              animation: 'rotateIcon 4s linear infinite'
            }}>⚡</span>
            <span>POWERED BY BLOCKCHAIN SMART CONTRACTS</span>
          </div>
        </div>
      </section>

      {/* Dual Prize Pools Section - HOURLY & DAILY */}
      <section className="container" style={{ marginTop: '60px', marginBottom: '60px' }}>
        <h2 style={{
          fontSize: '36px',
          fontFamily: "'Orbitron', sans-serif",
          textAlign: 'center',
          marginBottom: '40px',
          background: 'linear-gradient(135deg, var(--accent), var(--primary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '2px'
        }}>
          💎 DUAL PRIZE POOLS - BTC + ETH + USDC
        </h2>
        <DualCryptoPoolDisplay />
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(255, 215, 0, 0.1))',
          border: '2px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            marginBottom: '10px',
            color: 'var(--primary)'
          }}>
            🎫 ONE TICKET = TWO CHANCES TO WIN!
          </div>
          <div style={{
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6
          }}>
            Your $0.10 ticket enters BOTH the Hourly (every hour) and Daily (8PM Central) lotteries.
            <br />
            Win crypto prizes: 70% Bitcoin + 20% Ethereum + 10% USDC
          </div>
        </div>
      </section>

      {/* Number Picker */}
      <section className="container">
        <div className="number-picker-section">
          <h2 className="picker-title">🎲 PICK YOUR LUCKY NUMBERS</h2>

          {cart.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 240, 255, 0.1))',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                color: 'var(--accent)',
                marginBottom: '5px'
              }}>
                🎫 {cart.length} TICKET{cart.length > 1 ? 'S' : ''} READY
              </div>
              <div style={{
                fontSize: '28px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ${(cart.length * TICKET_PRICE).toFixed(2)}
              </div>
            </div>
          )}

          {/* Main Numbers */}
          <div className="picker-label">⚡ SELECT {LOTTERY_CONFIG.numbers.count} MAIN NUMBERS ({LOTTERY_CONFIG.numbers.min}-{LOTTERY_CONFIG.numbers.max})</div>
          <div className="numbers-grid">
            {Array.from({ length: LOTTERY_CONFIG.numbers.max }, (_, i) => i + LOTTERY_CONFIG.numbers.min).map(num => (
              <div
                key={`main-${num}`}
                className={`number-ball ${selectedMain.includes(num) ? 'selected' : ''}`}
                onClick={() => toggleMainNumber(num)}
              >
                {num.toString().padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Power Number - Only show if enabled */}
          {LOTTERY_CONFIG.powerNumber.enabled && (
            <>
              <div className="picker-label">⭐ SELECT 1 POWER NUMBER ({LOTTERY_CONFIG.powerNumber.min}-{LOTTERY_CONFIG.powerNumber.max})</div>
              <div className="numbers-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))' }}>
                {Array.from({ length: LOTTERY_CONFIG.powerNumber.max }, (_, i) => i + LOTTERY_CONFIG.powerNumber.min).map(num => (
                  <div
                    key={`power-${num}`}
                    className={`number-ball power ${selectedPower === num ? 'selected' : ''}`}
                    onClick={() => togglePowerNumber(num)}
                  >
                    {num.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Selected Display */}
          <div className="selected-numbers">
            <div className="selected-label">YOUR SELECTION:</div>
            <div className="selected-display">
              {Array.from({ length: LOTTERY_CONFIG.numbers.count }, (_, i) => i).map(i => (
                <div
                  key={`selected-main-${i}`}
                  className={`selected-ball ${i < selectedMain.length ? '' : 'empty'}`}
                >
                  {i < selectedMain.length ? selectedMain[i].toString().padStart(2, '0') : '--'}
                </div>
              ))}
              {LOTTERY_CONFIG.powerNumber.enabled && (
                <>
                  <span className="plus-sign">+</span>
                  <div className={`selected-ball power ${selectedPower ? '' : 'empty'}`}>
                    {selectedPower ? selectedPower.toString().padStart(2, '0') : '--'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="picker-actions">
            <button className="btn-secondary" onClick={quickPick}>🎲 QUICK PICK</button>
            <button className="btn-secondary" onClick={clearSelection}>🔄 CLEAR</button>
            <button
              className="btn-primary"
              onClick={addToCart}
              disabled={selectedMain.length !== LOTTERY_CONFIG.numbers.count || (LOTTERY_CONFIG.powerNumber.enabled && selectedPower === null)}
            >
              ➕ ADD THIS TICKET
            </button>
          </div>

          {/* BULK QUICK PICK SECTION - INTEGRATED */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(75, 0, 130, 0.1))',
            border: '2px solid rgba(138, 43, 226, 0.4)',
            borderRadius: '20px',
            padding: '25px',
            marginTop: '30px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '12px'
            }}>
              <span style={{
                fontSize: '20px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>⚡</span>
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '18px',
                color: 'var(--primary)',
                margin: 0,
                letterSpacing: '1.5px'
              }}>
                BULK QUICK PICK
              </h3>
              <span style={{
                fontSize: '20px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>⚡</span>
            </div>

            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '13px',
              marginBottom: '20px',
              fontFamily: "'Inter', sans-serif"
            }}>
              Generate multiple random tickets instantly
            </div>

            {/* Quick Amount Presets */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                fontSize: '10px',
                fontFamily: "'Orbitron', sans-serif",
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '8px',
                textAlign: 'center',
                letterSpacing: '1px'
              }}>
                QUICK AMOUNTS
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                gap: '8px'
              }}>
                {[
                  { amount: 100, label: '$25' },
                  { amount: 400, label: '$100' },
                  { amount: 1000, label: '$250' },
                  { amount: 4000, label: '$1K' },
                  { amount: 10000, label: '$2.5K' },
                  { amount: 20000, label: '$5K' },
                  { amount: 40000, label: '$10K' }
                ].map(preset => (
                  <button
                    key={preset.amount}
                    onClick={() => setBulkQuantity(preset.amount)}
                    style={{
                      padding: '8px',
                      background: bulkQuantity === preset.amount
                        ? 'linear-gradient(135deg, var(--accent), var(--primary))'
                        : 'rgba(138, 43, 226, 0.2)',
                      border: bulkQuantity === preset.amount
                        ? '2px solid var(--primary)'
                        : '2px solid rgba(138, 43, 226, 0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Orbitron', sans-serif",
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      if (bulkQuantity !== preset.amount) {
                        e.currentTarget.style.background = 'rgba(138, 43, 226, 0.4)';
                        e.currentTarget.style.borderColor = 'rgba(138, 43, 226, 0.6)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (bulkQuantity !== preset.amount) {
                        e.currentTarget.style.background = 'rgba(138, 43, 226, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(138, 43, 226, 0.3)';
                      }
                    }}
                  >
                    <div style={{ fontSize: '14px', marginBottom: '2px' }}>{preset.label}</div>
                    <div style={{
                      fontSize: '9px',
                      opacity: 0.7,
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {preset.amount} tickets
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '12px',
              alignItems: 'end'
            }}>
              {/* Quantity Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontFamily: "'Orbitron', sans-serif",
                  color: 'var(--light)',
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}>
                  CUSTOM QUANTITY (Max {MAX_BULK_TICKETS.toLocaleString()})
                </label>
                <input
                  type="number"
                  value={bulkQuantity === 0 ? '' : bulkQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setBulkQuantity(0);
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setBulkQuantity(num);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Set to 1 if empty on blur
                    if (bulkQuantity === 0 || bulkQuantity < 1) {
                      setBulkQuantity(1);
                    }
                    e.currentTarget.style.borderColor = 'rgba(138, 43, 226, 0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Enter quantity..."
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    fontSize: '18px',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    background: 'rgba(10, 14, 39, 0.6)',
                    border: '2px solid rgba(138, 43, 226, 0.4)',
                    borderRadius: '10px',
                    color: 'white',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    // Select all text on focus for easy replacement
                    e.currentTarget.select();
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.3)';
                  }}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={bulkQuickPick}
                style={{
                  padding: '12px 25px',
                  background: 'linear-gradient(135deg, #8a2be2, #4b0082)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '1px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
                  height: 'fit-content'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(138, 43, 226, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(138, 43, 226, 0.3)';
                }}
              >
                🎲 GENERATE
              </button>
            </div>

            {/* Cost Preview */}
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: 'rgba(0, 240, 255, 0.1)',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '11px',
                fontFamily: "'Inter', sans-serif",
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '4px'
              }}>
                Total Cost:
              </div>
              <div style={{
                fontSize: '28px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ${(bulkQuantity * TICKET_PRICE).toFixed(2)}
              </div>
              <div style={{
                fontSize: '11px',
                fontFamily: "'Inter', sans-serif",
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '4px'
              }}>
                {bulkQuantity} ticket{bulkQuantity !== 1 ? 's' : ''} × ${TICKET_PRICE.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Inline Ticket Cards */}
          {cart.length > 0 && (
            <div ref={cartSectionRef} style={{ marginTop: '40px' }}>
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '24px',
                color: 'var(--primary)',
                marginBottom: '25px',
                textAlign: 'center',
                letterSpacing: '2px'
              }}>
                🎫 YOUR TICKETS ({cart.length.toLocaleString()})
              </h3>

              {/* Compact Mode Notice for Large Purchases */}
              {cart.length > 500 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(0, 240, 255, 0.1))',
                  border: '2px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '15px',
                  padding: '20px',
                  marginBottom: '25px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    color: 'var(--accent)',
                    marginBottom: '8px'
                  }}>
                    ⚡ LARGE PURCHASE DETECTED
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: cart.length <= 10000 ? '12px' : '0'
                  }}>
                    {cart.length <= 10000
                      ? `Showing summary view for better performance. ${cart.length.toLocaleString()} tickets ready to purchase.`
                      : `${cart.length.toLocaleString()} tickets generated! All tickets will be purchased together.`
                    }
                  </div>
                  {cart.length <= 10000 && (
                    <button
                      onClick={() => setShowAllTickets(!showAllTickets)}
                      style={{
                        padding: '10px 20px',
                        background: showAllTickets
                          ? 'linear-gradient(135deg, var(--accent), var(--primary))'
                          : 'rgba(255, 215, 0, 0.2)',
                        border: '2px solid var(--accent)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'Orbitron', sans-serif",
                        transition: 'all 0.3s ease',
                        letterSpacing: '0.5px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 215, 0, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {showAllTickets ? '📦 HIDE TICKETS' : '👁️ SHOW ALL TICKETS'}
                    </button>
                  )}
                </div>
              )}

              {/* Render tickets based on mode */}
              {(cart.length <= 500 || (cart.length <= 10000 && showAllTickets)) ? (
                // FULL MODE: Show all ticket cards
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {cart.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
                      border: '2px solid rgba(0, 240, 255, 0.3)',
                      borderRadius: '20px',
                      padding: '20px',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 240, 255, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(ticket.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: 'rgba(255, 107, 107, 0.2)',
                        border: '2px solid #ff6b6b',
                        color: '#ff6b6b',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#ff6b6b';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
                        e.currentTarget.style.color = '#ff6b6b';
                      }}
                    >
                      ✕
                    </button>

                    {/* Ticket number */}
                    <div style={{
                      fontSize: '12px',
                      fontFamily: "'Orbitron', sans-serif",
                      color: 'var(--primary)',
                      fontWeight: 600,
                      marginBottom: '15px',
                      letterSpacing: '1px'
                    }}>
                      TICKET #{index + 1}
                    </div>

                    {/* Main numbers */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '10px',
                        fontFamily: "'Inter', sans-serif",
                        color: 'var(--light)',
                        opacity: 0.6,
                        marginBottom: '8px',
                        letterSpacing: '0.5px'
                      }}>
                        MAIN NUMBERS
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ticket.numbers.map((num, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              fontFamily: "'Orbitron', sans-serif",
                              color: 'white',
                              boxShadow: '0 2px 8px rgba(0, 240, 255, 0.4)'
                            }}
                          >
                            {num.toString().padStart(2, '0')}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Power number - Only show if enabled */}
                    {LOTTERY_CONFIG.powerNumber.enabled && (
                      <div>
                        <div style={{
                          fontSize: '10px',
                          fontFamily: "'Inter', sans-serif",
                          color: 'var(--light)',
                          opacity: 0.6,
                          marginBottom: '8px',
                          letterSpacing: '0.5px'
                        }}>
                          POWER NUMBER
                        </div>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), #ffa500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            fontFamily: "'Orbitron', sans-serif",
                            color: 'var(--darker)',
                            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5)'
                          }}
                        >
                          {ticket.powerNumber.toString().padStart(2, '0')}
                        </div>
                      </div>
                    )}

                    {/* Price tag */}
                    <div style={{
                      marginTop: '15px',
                      paddingTop: '15px',
                      borderTop: '1px solid rgba(0, 240, 255, 0.2)',
                      fontSize: '14px',
                      fontFamily: "'Orbitron', sans-serif",
                      color: 'var(--accent)',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}>
                      ${TICKET_PRICE.toFixed(2)}
                    </div>
                  </div>
                ))}
                </div>
              ) : (
                // COMPACT MODE: Show summary only for 500+ tickets
                <div style={{
                  background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.9), rgba(5, 8, 17, 0.95))',
                  border: '2px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '20px',
                  padding: '40px',
                  marginBottom: '30px',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '15px'
                  }}>
                    🎟️
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '10px'
                  }}>
                    {cart.length.toLocaleString()} TICKETS
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '20px'
                  }}>
                    All tickets generated with Quick Pick random numbers
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginTop: '25px'
                  }}>
                    <div style={{
                      background: 'rgba(0, 240, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '15px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '5px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Main Numbers
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        fontFamily: "'Orbitron', sans-serif"
                      }}>
                        {LOTTERY_CONFIG.numbers.count} per ticket ({LOTTERY_CONFIG.numbers.min}-{LOTTERY_CONFIG.numbers.max})
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      borderRadius: '10px',
                      padding: '15px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '5px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Power Numbers
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        fontFamily: "'Orbitron', sans-serif"
                      }}>
                        1 per ticket ({LOTTERY_CONFIG.powerNumber.min}-{LOTTERY_CONFIG.powerNumber.max})
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(138, 43, 226, 0.1)',
                      borderRadius: '10px',
                      padding: '15px'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '5px',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Total Cost
                      </div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#8a2be2',
                        fontFamily: "'Orbitron', sans-serif"
                      }}>
                        ${(cart.length * TICKET_PRICE).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '15px',
                alignItems: 'center'
              }}>
                {/* Clear All Button */}
                <button
                  onClick={clearAllCart}
                  style={{
                    padding: '22px 30px',
                    background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 0, 0, 0.2))',
                    color: '#ff6b6b',
                    border: '2px solid #ff6b6b',
                    borderRadius: '15px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Orbitron', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 107, 107, 0.4)';
                    e.currentTarget.style.background = '#ff6b6b';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 0, 0, 0.2))';
                    e.currentTarget.style.color = '#ff6b6b';
                  }}
                >
                  🗑️ CLEAR ALL
                </button>

                {/* Buy All Button */}
                <button
                  onClick={buyAllTickets}
                  style={{
                    width: '100%',
                    padding: '22px',
                    background: 'linear-gradient(135deg, var(--accent), #ffa500)',
                    color: 'var(--darker)',
                    border: 'none',
                    borderRadius: '15px',
                    fontSize: '22px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Orbitron', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 20px 50px rgba(255, 215, 0, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  🚀 BUY ALL {cart.length.toLocaleString()} TICKET{cart.length > 1 ? 'S' : ''} - ${(cart.length * TICKET_PRICE).toLocaleString()}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Old cart section removed - everything is inline now */}
      {false && cart.length > 0 && (
        <section ref={cartSectionRef} className="container">
          <div className="cart-section">
            <h2 className="cart-title">🛒 YOUR CART ({cart.length} {cart.length === 1 ? 'ticket' : 'tickets'})</h2>

            <div className="cart-items">
              {cart.map((ticket) => (
                <div key={ticket.id} className="cart-item">
                  <div className="cart-ticket-numbers">
                    {ticket.numbers.map((num, i) => (
                      <span key={i} className="cart-ball">
                        {num.toString().padStart(2, '0')}
                      </span>
                    ))}
                    <span className="plus-sign">+</span>
                    <span className="cart-ball power">
                      {ticket.powerNumber.toString().padStart(2, '0')}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(ticket.id)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Tickets in cart:</span>
                <span>{cart.length}</span>
              </div>
              <div className="summary-row total">
                <span>TOTAL:</span>
                <span>${(cart.length * TICKET_PRICE).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={buyAllTickets}
              className="buy-all-btn"
            >
              🚀 BUY ALL {cart.length} {cart.length === 1 ? 'TICKET' : 'TICKETS'}
            </button>
          </div>
        </section>
      )}

      {/* STICKY FLOATING BUTTONS */}
      {showStickyButtons && cart.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, rgba(5, 8, 17, 0) 0%, rgba(5, 8, 17, 0.95) 20%, rgba(5, 8, 17, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '2px solid rgba(0, 240, 255, 0.3)',
          padding: '20px',
          zIndex: 1000,
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div className="container" style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '15px',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Cart Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                fontSize: '16px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                color: 'var(--accent)',
              }}>
                🎫 {cart.length.toLocaleString()} TICKET{cart.length > 1 ? 'S' : ''}
              </div>
              <div style={{
                fontSize: '24px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ${(cart.length * TICKET_PRICE).toLocaleString()}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '15px',
              alignItems: 'center'
            }}>
              {/* Clear All Button */}
              <button
                onClick={clearAllCart}
                style={{
                  padding: '18px 25px',
                  background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 0, 0, 0.2))',
                  color: '#ff6b6b',
                  border: '2px solid #ff6b6b',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Orbitron', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.5)';
                  e.currentTarget.style.background = '#ff6b6b';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 0, 0, 0.2))';
                  e.currentTarget.style.color = '#ff6b6b';
                }}
              >
                🗑️ CLEAR ALL
              </button>

              {/* Buy All Button */}
              <button
                onClick={buyAllTickets}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: 'linear-gradient(135deg, var(--accent), #ffa500)',
                  color: 'var(--darker)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Orbitron', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 215, 0, 0.7)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🚀 BUY ALL {cart.length.toLocaleString()} TICKET{cart.length > 1 ? 'S' : ''} - ${(cart.length * TICKET_PRICE).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          tickets={cart}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          onError={handlePaymentError}
        />
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
        />
      )}

      {/* Notification Monitor - runs in background */}
      <NotificationMonitor />

    </>
  );
}
