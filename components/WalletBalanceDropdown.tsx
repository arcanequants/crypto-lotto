'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { createPublicClient, http, formatUnits } from 'viem';
import { base } from 'viem/chains';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Token addresses on BASE mainnet
const TOKENS = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    decimals: 6,
    icon: '💎',
    name: 'USDC'
  },
  USDT: {
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`,
    decimals: 6,
    icon: '💚',
    name: 'USDT'
  }
};

export function WalletBalanceDropdown() {
  const { authenticated, ready } = usePrivy();
  const { client: smartWalletClient } = useSmartWallets();
  const [isOpen, setIsOpen] = useState(false);
  const [balances, setBalances] = useState({
    usdc: 0,
    usdt: 0
  });
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch balances
  useEffect(() => {
    if (ready && authenticated && smartWalletClient) {
      fetchBalances();
    }
  }, [ready, authenticated, smartWalletClient]);

  const fetchBalances = async () => {
    try {
      setLoading(true);

      const smartWalletAddress = smartWalletClient?.account?.address;
      if (!smartWalletAddress) {
        setLoading(false);
        return;
      }

      // Create public client for reading blockchain
      const publicClient = createPublicClient({
        chain: base,
        transport: http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
      });

      // Fetch USDC balance
      const usdcBalance = await publicClient.readContract({
        address: TOKENS.USDC.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [smartWalletAddress]
      });

      // Fetch USDT balance
      const usdtBalance = await publicClient.readContract({
        address: TOKENS.USDT.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [smartWalletAddress]
      });

      setBalances({
        usdc: parseFloat(formatUnits(usdcBalance, TOKENS.USDC.decimals)),
        usdt: parseFloat(formatUnits(usdtBalance, TOKENS.USDT.decimals))
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setLoading(false);
    }
  };

  if (!authenticated || !ready) {
    return null;
  }

  const totalBalance = balances.usdc + balances.usdt;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Balance Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="balance-card-trigger"
        style={{
          padding: '10px 20px',
          background: 'rgba(0, 240, 255, 0.1)',
          border: '2px solid #00f0ff',
          borderRadius: '12px',
          color: '#00f0ff',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.1)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span>💰</span>
        <span>{loading ? '...' : `$${totalBalance.toFixed(2)}`}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="balance-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 15px)',
            right: 0,
            background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(5, 8, 17, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(0, 240, 255, 0.4)',
            borderRadius: '20px',
            padding: '25px',
            minWidth: '350px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 240, 255, 0.3)',
            zIndex: 1000,
            animation: 'slideDown 0.3s ease'
          }}
        >
          {/* Arrow */}
          <div
            style={{
              content: '',
              position: 'absolute',
              top: '-10px',
              right: '100px',
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '10px solid rgba(0, 240, 255, 0.4)'
            }}
          />

          {/* Header */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid rgba(0, 240, 255, 0.2)'
            }}
          >
            <h3
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '12px',
                color: '#00f0ff',
                marginBottom: '8px',
                letterSpacing: '2px',
                textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
              }}
            >
              TOTAL BALANCE
            </h3>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '36px',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00f0ff, #fff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))'
              }}
            >
              ${totalBalance.toFixed(2)}
            </div>
          </div>

          {/* Token List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* USDC */}
            <div
              className="token-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 5px currentColor)' }}>
                  {TOKENS.USDC.icon}
                </div>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#00f0ff',
                    textShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
                  }}
                >
                  {TOKENS.USDC.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {balances.usdc.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  ${balances.usdc.toFixed(2)}
                </div>
              </div>
            </div>

            {/* USDT */}
            <div
              className="token-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '24px', filter: 'drop-shadow(0 0 5px currentColor)' }}>
                  {TOKENS.USDT.icon}
                </div>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#00f0ff',
                    textShadow: '0 0 10px rgba(0, 240, 255, 0.3)'
                  }}
                >
                  {TOKENS.USDT.name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'white'
                  }}
                >
                  {balances.usdt.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  ${balances.usdt.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        .balance-card-trigger::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.3), transparent);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .balance-card-trigger:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 30px rgba(0, 240, 255, 0.6), inset 0 0 15px rgba(0, 240, 255, 0.2) !important;
          background: rgba(0, 240, 255, 0.2) !important;
          border-color: #00f0ff !important;
        }

        .balance-card-trigger::after {
          content: '▼';
          font-size: 10px;
          transition: transform 0.3s ease;
          margin-left: 4px;
        }

        .balance-card-trigger.active::after {
          transform: rotate(180deg);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .token-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(180deg, transparent, #00f0ff, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .token-item:hover {
          background: rgba(0, 0, 0, 0.5) !important;
          border-color: rgba(0, 240, 255, 0.5) !important;
          transform: translateX(5px);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
        }

        .token-item:hover::before {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
