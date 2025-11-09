'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase';
import {
  calculateWinnersByTier,
  getUserWinningTickets,
  calculateUnclaimedPrizes
} from '@/lib/lottery';
import Link from 'next/link';

export function PrizeBalance() {
  const { authenticated, user } = usePrivy();
  const [unclaimedAmount, setUnclaimedAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const TOTAL_PRIZE_POOL = 5000;

  useEffect(() => {
    if (authenticated && user) {
      loadUnclaimedBalance();
    } else {
      setLoading(false);
    }
  }, [authenticated, user]);

  const loadUnclaimedBalance = async () => {
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
      const winningTickets = getUserWinningTickets(
        userTickets,
        winningNumbers,
        TOTAL_PRIZE_POOL,
        winnersByTier
      );

      // Calculate unclaimed total
      const unclaimed = calculateUnclaimedPrizes(winningTickets);
      setUnclaimedAmount(unclaimed);

      setLoading(false);
    } catch (error) {
      console.error('Error loading prize balance:', error);
      setLoading(false);
    }
  };

  if (!authenticated || loading) {
    return null;
  }

  if (unclaimedAmount === 0) {
    return null;
  }

  return (
    <Link
      href="/prizes"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 149, 0, 0.2))',
        border: '2px solid var(--accent)',
        borderRadius: '12px',
        padding: '8px 16px',
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 215, 0, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '20px' }}>🎁</div>
      <div>
        <div style={{
          fontSize: '10px',
          fontFamily: "'Inter', sans-serif",
          color: 'var(--light)',
          opacity: 0.7,
          marginBottom: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Unclaimed
        </div>
        <div style={{
          fontSize: '16px',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--accent), #fff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ${unclaimedAmount.toFixed(2)}
        </div>
      </div>
    </Link>
  );
}
