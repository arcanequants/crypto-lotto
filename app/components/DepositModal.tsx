'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useContract } from '@/lib/hooks/useContract';

interface DepositModalProps {
  onClose: () => void;
}

type Network = 'BASE' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM' | 'AVALANCHE' | 'BSC' | 'ETHEREUM';

const NETWORKS: Record<Network, { name: string; time: string; recommended?: boolean }> = {
  BASE: { name: 'BASE', time: '1-5 min', recommended: true },
  POLYGON: { name: 'Polygon (MATIC)', time: '2-5 min' },
  ARBITRUM: { name: 'Arbitrum One', time: '1-5 min' },
  OPTIMISM: { name: 'Optimism', time: '1-5 min' },
  AVALANCHE: { name: 'Avalanche C-Chain', time: '2-5 min' },
  BSC: { name: 'BNB Smart Chain', time: '1-5 min' },
  ETHEREUM: { name: 'Ethereum Mainnet', time: '1-5 min' }
};

export function DepositModal({ onClose }: DepositModalProps) {
  const { user, createWallet } = usePrivy();
  const { wallets, ready } = useWallets();
  const { walletAddress, checkTokenBalance } = useContract();
  const [copied, setCopied] = useState(false);
  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT'>('USDC');
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('BASE');
  const [balanceUSDC, setBalanceUSDC] = useState<string>('...');
  const [balanceUSDT, setBalanceUSDT] = useState<string>('...');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);

  // Use wallet address from useContract hook (smart wallet with gas sponsorship)

  // Auto-create wallet if user doesn't have one
  useEffect(() => {
    const initWallet = async () => {
      if (ready && !walletAddress && !creatingWallet && user) {
        try {
          setCreatingWallet(true);
          console.log('🔐 Creating embedded wallet...');
          await createWallet();
          console.log('✅ Wallet created successfully');
        } catch (err) {
          console.error('❌ Error creating wallet:', err);
        } finally {
          setCreatingWallet(false);
        }
      }
    };
    initWallet();
  }, [ready, walletAddress, user, creatingWallet]);

  // Load balances on mount
  useEffect(() => {
    if (walletAddress) {
      loadBalances();
    }
  }, [walletAddress]);

  const loadBalances = async () => {
    if (!walletAddress) return;
    setLoadingBalance(true);
    try {
      const usdcBal = await checkTokenBalance('USDC');
      const usdtBal = await checkTokenBalance('USDT');
      setBalanceUSDC(parseFloat(usdcBal).toFixed(2));
      setBalanceUSDT(parseFloat(usdtBal).toFixed(2));
    } catch (err) {
      console.error('Error loading balances:', err);
      // Set to 0.00 if there's an error (contract not deployed yet)
      setBalanceUSDC('0.00');
      setBalanceUSDT('0.00');
    }
    setLoadingBalance(false);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '550px',
          width: '100%',
          border: '2px solid rgba(0, 240, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 240, 255, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '28px',
              background: 'linear-gradient(135deg, #00f0ff, #0080ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700
            }}
          >
            💰 Deposit Crypto
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', margin: 0 }}>
            Send USDC or USDT from your exchange
          </p>
        </div>

        {/* Current Balance */}
        <div
          style={{
            background: 'rgba(0, 240, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(0, 240, 255, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
              Current Balance
            </span>
            <button
              onClick={loadBalances}
              disabled={loadingBalance}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: loadingBalance ? 0.5 : 1
              }}
            >
              🔄 Refresh
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>USDC</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00f0ff', fontFamily: "'Orbitron', sans-serif" }}>
                ${balanceUSDC}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>USDT</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#26a17b', fontFamily: "'Orbitron', sans-serif" }}>
                ${balanceUSDT}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Select Token */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            1. Select Token
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedToken('USDC')}
              style={{
                flex: 1,
                padding: '14px',
                background: selectedToken === 'USDC' ? 'linear-gradient(135deg, #00f0ff, #0080ff)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedToken === 'USDC' ? '2px solid #00f0ff' : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              💎 USDC
            </button>
            <button
              onClick={() => setSelectedToken('USDT')}
              style={{
                flex: 1,
                padding: '14px',
                background: selectedToken === 'USDT' ? 'linear-gradient(135deg, #26a17b, #1c9c6e)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedToken === 'USDT' ? '2px solid #26a17b' : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              💚 USDT
            </button>
          </div>
        </div>

        {/* Step 2: Select Network */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            2. Select Network
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.entries(NETWORKS).map(([key, network]) => (
              <button
                key={key}
                onClick={() => setSelectedNetwork(key as Network)}
                style={{
                  padding: '12px',
                  background: selectedNetwork === key ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedNetwork === key ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{network.name}</span>
                  {network.recommended && (
                    <span style={{ fontSize: '10px', background: '#00ff88', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      BEST
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.6 }}>
                  Arrives: {network.time}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Deposit Address */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            3. Deposit Address
          </label>
          {walletAddress ? (
            <div>
              <div
                style={{
                  background: 'rgba(0, 240, 255, 0.1)',
                  border: '2px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div
                    style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '13px',
                      color: 'var(--primary)',
                      wordBreak: 'break-all',
                      flex: 1
                    }}
                  >
                    {walletAddress}
                  </div>
                  <button
                    onClick={copyAddress}
                    style={{
                      padding: '8px 16px',
                      background: copied ? '#00ff88' : 'var(--primary)',
                      border: 'none',
                      borderRadius: '8px',
                      color: copied ? '#000' : '#000',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Important Notice */}
              <div
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '11px',
                  lineHeight: '1.6'
                }}
              >
                <div style={{ fontWeight: 700, color: '#ffd700', marginBottom: '6px' }}>
                  ⚠️ Important:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  <li>Send only <strong>{selectedToken}</strong> to this address</li>
                  <li>Use <strong>{NETWORKS[selectedNetwork].name}</strong> network</li>
                  <li>This address works for all EVM chains (same address)</li>
                  <li>Funds arrive in {NETWORKS[selectedNetwork].time}</li>
                </ul>
              </div>
            </div>
          ) : creatingWallet ? (
            <div
              style={{
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '13px',
                color: 'var(--primary)',
                textAlign: 'center'
              }}
            >
              🔐 Creating your wallet...
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(255, 100, 100, 0.1)',
                border: '1px solid rgba(255, 100, 100, 0.3)',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '12px',
                color: '#ff9999',
                textAlign: 'center'
              }}
            >
              ⚠️ Wallet not detected. Please refresh or reconnect.
            </div>
          )}
        </div>

        {/* Instructions */}
        <div
          style={{
            background: 'rgba(0, 240, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            fontSize: '12px',
            lineHeight: '1.7',
            color: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>
            📝 How to deposit:
          </div>
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            <li>Open your exchange app (Coinbase, Binance, etc.)</li>
            <li>Go to "Withdraw" or "Send"</li>
            <li>Select <strong>{selectedToken}</strong></li>
            <li>Select <strong>{NETWORKS[selectedNetwork].name}</strong> network</li>
            <li>Paste the address above</li>
            <li>Enter amount and confirm</li>
            <li>Wait {NETWORKS[selectedNetwork].time} for arrival</li>
          </ol>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
