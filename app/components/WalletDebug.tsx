'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';

export function WalletDebug() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();

  const wallets0Address = wallets?.[0]?.address;
  const wallets0Type = wallets?.[0]?.walletClientType;
  const userWalletAddress = user?.wallet?.address;
  const smartWalletAddress = smartWalletClient?.account?.address;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid #00f0ff',
      borderRadius: '12px',
      padding: '20px',
      color: 'white',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '500px'
    }}>
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#00f0ff' }}>
        🔍 WALLET DEBUG
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong style={{ color: '#ffd700' }}>wallets[0]?.address:</strong>
        <div style={{ wordBreak: 'break-all', color: wallets0Address ? '#00ff88' : '#ff6b6b' }}>
          {wallets0Address || 'undefined'}
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong style={{ color: '#ffd700' }}>wallets[0]?.walletClientType:</strong>
        <div style={{ color: '#00f0ff' }}>
          {wallets0Type || 'undefined'}
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong style={{ color: '#ffd700' }}>user.wallet?.address:</strong>
        <div style={{ wordBreak: 'break-all', color: userWalletAddress ? '#00ff88' : '#ff6b6b' }}>
          {userWalletAddress || 'undefined'}
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <strong style={{ color: '#ffd700' }}>smartWalletClient?.account?.address:</strong>
        <div style={{ wordBreak: 'break-all', color: smartWalletAddress ? '#00ff88' : '#ff6b6b' }}>
          {smartWalletAddress || 'undefined'}
        </div>
      </div>

      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #00f0ff' }}>
        <strong style={{ color: '#ffd700' }}>Total wallets:</strong> {wallets?.length || 0}
      </div>

      <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '6px' }}>
        <strong style={{ color: '#ff6b6b' }}>⚠️ CRITICAL:</strong>
        <div style={{ fontSize: '11px', marginTop: '4px' }}>
          {wallets0Address === smartWalletAddress
            ? '✅ All addresses MATCH'
            : '❌ ADDRESSES DON\'T MATCH - PROBLEM!'}
        </div>
      </div>
    </div>
  );
}
