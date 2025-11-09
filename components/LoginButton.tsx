'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';

export function LoginButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();

  // Don't render until Privy is ready
  if (!ready) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-700 text-gray-400 rounded-lg font-['Orbitron'] cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  // If user is authenticated, show logout button with wallet address
  if (authenticated && user) {
    // CRITICAL: Use SMART WALLET address (same as deposit/withdraw/purchase)
    // This is the ERC-4337 account with gas sponsorship
    const walletAddress = smartWalletClient?.account?.address;
    const displayText = walletAddress
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : 'Connected';

    return (
      <div className="flex items-center gap-4">
        <span className="text-[var(--light)] font-['Inter'] text-sm">
          {displayText}
        </span>
        <button
          onClick={logout}
          className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]
                     text-white rounded-lg font-['Orbitron'] font-bold
                     hover:opacity-90 transition-opacity"
        >
          Logout
        </button>
      </div>
    );
  }

  // If not authenticated, show login button
  return (
    <button
      onClick={login}
      className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]
                 text-white rounded-lg font-['Orbitron'] font-bold
                 hover:opacity-90 transition-opacity
                 shadow-lg shadow-[var(--primary)]/20"
    >
      Connect Wallet
    </button>
  );
}
