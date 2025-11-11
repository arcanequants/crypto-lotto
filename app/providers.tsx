'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { base, baseSepolia } from 'viem/chains';
import { http } from 'viem';
import { ToastProvider } from '@/components/ToastProvider';
import { useDepositMonitor } from '@/hooks/useDepositMonitor';

// Get Alchemy RPC URL
const getAlchemyRpcUrl = () => {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (apiKey && apiKey !== 'YOUR_ALCHEMY_API_KEY_HERE') {
    return `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
  }
  // Fallback to default RPC if Alchemy not configured
  return undefined;
};

// Component that activates deposit monitoring
function DepositMonitorActivator() {
  useDepositMonitor(); // Auto-starts when user is authenticated
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const alchemyRpcUrl = getAlchemyRpcUrl();
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmgyczp6p01wdl90bh8v20dua';

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Login methods
        loginMethods: ['email', 'wallet', 'google'],

        // Appearance
        appearance: {
          theme: 'dark',
          accentColor: '#00f0ff', // Cyan color from your theme
          logo: undefined,
          showWalletLoginFirst: false,
        },

        // Supported chains (BASE mainnet + testnet)
        supportedChains: [base, baseSepolia],

        // Default chain
        defaultChain: base,

        // CRITICAL: Configure custom RPC to use Alchemy instead of Privy's RPC
        // This avoids rate limiting issues
        rpcConfig: alchemyRpcUrl ? {
          rpcUrls: {
            [base.id]: alchemyRpcUrl,
          }
        } : undefined,

        // EMBEDDED WALLETS: ENABLED for smart wallets
        // These are used as the SIGNER for Privy-managed smart wallets
        // The embedded wallet itself doesn't hold funds - the smart wallet does
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Create embedded wallet to sign for smart wallet
          requireUserPasswordOnCreate: false,
          noPromptOnSignature: false,
        },

        // EXTERNAL WALLETS: Disabled for now
        // We want users to use Privy-managed smart wallets (with gas sponsorship)
        // NOT external Coinbase wallets (which don't have gas sponsorship)
        // externalWallets: {
        //   coinbaseWallet: {
        //     connectionOptions: 'all',
        //   },
        // },

        // Legal links (optional, can add later)
        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
      }}
    >
      <SmartWalletsProvider>
        <DepositMonitorActivator />
        {children}
        <ToastProvider />
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
