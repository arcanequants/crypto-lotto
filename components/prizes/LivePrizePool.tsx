'use client';

import { useState, useEffect } from 'react';
import { CryptoRow } from './CryptoRow';

interface LivePrizePoolProps {
  drawType: 'daily' | 'weekly';
  refreshInterval?: number; // milliseconds
}

interface PrizeData {
  drawType: 'daily' | 'weekly';
  totalUSD: number;
  composition: {
    btc: { amount: number; usd: number; percentage: number };
    eth: { amount: number; usd: number; percentage: number };
    token: { amount: number; usd: number; symbol: string; percentage: number };
  };
  totalTickets: number;
  lastUpdate: number;
}

/**
 * LivePrizePool Component
 *
 * Muestra el prize pool en tiempo real con auto-refresh
 *
 * Features:
 * - Auto-refresh cada X segundos (default 10s)
 * - Desglose por crypto (BTC, ETH, Token del Mes)
 * - Valores en USD actualizados
 * - Animaciones suaves en cambios
 * - Indicador "LIVE" parpadeante
 *
 * @example
 * <LivePrizePool drawType="weekly" refreshInterval={10000} />
 */
export function LivePrizePool({
  drawType,
  refreshInterval = 10000, // 10 seconds default
}: LivePrizePoolProps) {
  const [prizeData, setPrizeData] = useState<PrizeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrizePool = async () => {
    try {
      const res = await fetch(`/api/prizes/live?type=${drawType}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch prize pool');
      }

      const data = await res.json();
      setPrizeData(data);
      setLastUpdate(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching prize pool:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrizePool();

    // Setup interval for auto-refresh
    const interval = setInterval(fetchPrizePool, refreshInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [drawType, refreshInterval]);

  // Loading state
  if (loading || !prizeData) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(5, 8, 17, 0.9))',
        borderRadius: '30px',
        padding: '40px',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        boxShadow: '0 20px 60px rgba(0, 240, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ animation: 'pulse 2s ease-in-out infinite' }}>
          <div style={{ height: '30px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', marginBottom: '20px', width: '60%' }} />
          <div style={{ height: '60px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', marginBottom: '30px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ height: '80px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }} />
            <div style={{ height: '80px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }} />
            <div style={{ height: '80px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '15px' }} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(10, 14, 39, 0.9))',
        borderRadius: '30px',
        padding: '40px',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        textAlign: 'center'
      }}>
        <p style={{ color: '#ff6b6b', marginBottom: '20px', fontSize: '18px' }}>❌ {error}</p>
        <button
          onClick={fetchPrizePool}
          style={{
            padding: '12px 30px',
            background: 'rgba(255, 107, 107, 0.2)',
            border: '2px solid #ff6b6b',
            borderRadius: '15px',
            color: '#ff6b6b',
            cursor: 'pointer',
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 600,
            transition: 'all 0.3s ease'
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
          Retry
        </button>
      </div>
    );
  }

  const isDaily = drawType === 'daily';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(5, 8, 17, 0.9))',
      borderRadius: '30px',
      padding: '40px',
      border: isDaily ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid rgba(255, 215, 0, 0.3)',
      boxShadow: isDaily ? '0 20px 60px rgba(0, 240, 255, 0.2)' : '0 20px 60px rgba(255, 215, 0, 0.2)',
      position: 'relative',
      overflow: 'hidden',
      height: '100%'
    }}>
      {/* Shimmer effect */}
      <div style={{
        content: '',
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `linear-gradient(45deg, transparent, ${isDaily ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 215, 0, 0.05)'}, transparent)`,
        animation: 'shimmer 3s infinite',
        pointerEvents: 'none'
      }} />

      {/* Header with lottery type */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '30px',
        position: 'relative',
        zIndex: 1
      }}>
        <div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '28px',
            fontWeight: 700,
            color: isDaily ? '#00f0ff' : '#ffd700',
            textShadow: isDaily ? '0 0 20px rgba(0, 240, 255, 0.5)' : '0 0 20px rgba(255, 215, 0, 0.5)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            {isDaily ? '🎯 DAILY' : '🏆 WEEKLY'} JACKPOT
          </div>
          <div style={{
            fontSize: '14px',
            opacity: 0.7,
            fontFamily: "'Inter', sans-serif"
          }}>
            Updates every 10 seconds • {prizeData.totalTickets.toLocaleString()} tickets sold
          </div>
        </div>

        {/* Live indicator */}
        <div style={{
          padding: '8px 20px',
          background: 'rgba(74, 222, 128, 0.1)',
          border: '2px solid #4ade80',
          borderRadius: '50px',
          color: '#4ade80',
          fontWeight: 600,
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '12px',
          boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)',
          animation: 'statusPulse 2s ease-in-out infinite',
          letterSpacing: '1px'
        }}>
          ● LIVE
        </div>
      </div>

      {/* Total USD Amount */}
      <div style={{
        textAlign: 'center',
        margin: '40px 0',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '72px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #ffd700, #fff, #ffd700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 60px rgba(255, 215, 0, 0.5)',
          lineHeight: 1
        }}>
          ${prizeData.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{
          fontSize: '14px',
          opacity: 0.6,
          marginTop: '15px',
          fontFamily: "'Inter', sans-serif"
        }}>
          Last updated: {lastUpdate?.toLocaleTimeString()}
        </div>
      </div>

      {/* Prize Composition Label */}
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '25px',
        color: isDaily ? '#00f0ff' : '#ffd700',
        fontFamily: "'Orbitron', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '2px',
        position: 'relative',
        zIndex: 1,
        borderTop: `1px solid ${isDaily ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 215, 0, 0.2)'}`,
        paddingTop: '30px'
      }}>
        📊 PRIZE COMPOSITION:
      </div>

      {/* Crypto breakdown */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        position: 'relative',
        zIndex: 1
      }}>
        <CryptoRow
          symbol="BTC"
          name="Bitcoin"
          amount={prizeData.composition.btc.amount}
          usdValue={prizeData.composition.btc.usd}
          percentage={prizeData.composition.btc.percentage}
          icon="🟠"
          color="#f7931a"
        />

        <CryptoRow
          symbol="ETH"
          name="Ethereum"
          amount={prizeData.composition.eth.amount}
          usdValue={prizeData.composition.eth.usd}
          percentage={prizeData.composition.eth.percentage}
          icon="🔷"
          color="#627eea"
        />

        <CryptoRow
          symbol={prizeData.composition.token.symbol}
          name="Token of the Month"
          amount={prizeData.composition.token.amount}
          usdValue={prizeData.composition.token.usd}
          percentage={prizeData.composition.token.percentage}
          icon="⚡"
          color="#00ffa3"
        />
      </div>
    </div>
  );
}
