/**
 * Deposit Monitor Hook
 *
 * Monitors USDC balance changes and triggers notifications when deposits are confirmed
 */

import { useEffect, useRef, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { showDepositConfirmedToast } from '@/lib/notifications/toast-notifications';

// USDC Contract on BASE
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// USDC ABI (balanceOf function)
const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const;

interface DepositDetection {
  previousBalance: bigint;
  newBalance: bigint;
  difference: bigint;
  timestamp: Date;
}

/**
 * Hook to monitor USDC deposits
 *
 * Polls the blockchain every 5 seconds to detect balance changes
 * When a deposit is detected, triggers toast and email notifications
 */
export function useDepositMonitor() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastDeposit, setLastDeposit] = useState<DepositDetection | null>(null);
  const previousBalanceRef = useRef<bigint | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's smart wallet address
  const smartWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const walletAddress = smartWallet?.address;

  // Create public client for reading blockchain
  const publicClient = createPublicClient({
    chain: base,
    transport: http(
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : undefined
    ),
  });

  /**
   * Check USDC balance
   */
  const checkBalance = async (): Promise<bigint | null> => {
    if (!walletAddress) return null;

    try {
      const balance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      });

      return balance;
    } catch (error) {
      console.error('Error checking USDC balance:', error);
      return null;
    }
  };

  /**
   * Handle deposit detection
   */
  const handleDepositDetected = async (previousBalance: bigint, newBalance: bigint) => {
    const difference = newBalance - previousBalance;
    const amountUSDC = formatUnits(difference, 6); // USDC has 6 decimals

    console.log('🎉 Deposit detected!', {
      previousBalance: formatUnits(previousBalance, 6),
      newBalance: formatUnits(newBalance, 6),
      difference: amountUSDC,
    });

    // Calculate how many tickets this is (assuming $0.10 per ticket)
    const ticketPrice = 0.10;
    const ticketCount = Math.floor(parseFloat(amountUSDC) / ticketPrice);

    // Store detection info
    const detection: DepositDetection = {
      previousBalance,
      newBalance,
      difference,
      timestamp: new Date(),
    };
    setLastDeposit(detection);

    // Show toast notification immediately
    showDepositConfirmedToast(ticketCount, amountUSDC);

    // Send email notification (async, don't block)
    if (user?.email?.address) {
      fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'deposit_confirmed',
          data: {
            userAddress: walletAddress,
            amount: amountUSDC,
            transactionHash: '0x...', // Would need to get this from events
            timestamp: new Date().toLocaleString(),
            tickets: Array.from({ length: ticketCount }, (_, i) => ({
              ticketId: i, // Would need actual ticket IDs from contract
              ticketNumber: Math.floor(Math.random() * 100), // Would need actual numbers
              drawId: 1, // Would need current draw ID
            })),
            emailAddress: user.email.address,
          },
        }),
      }).catch((error) => {
        console.error('Failed to send email notification:', error);
        // Don't show error to user - they already saw the toast
      });
    }
  };

  /**
   * Polling function
   */
  const pollBalance = async () => {
    const currentBalance = await checkBalance();

    if (currentBalance === null) return;

    // First time checking - just store the balance
    if (previousBalanceRef.current === null) {
      previousBalanceRef.current = currentBalance;
      return;
    }

    // Check if balance increased (deposit detected)
    if (currentBalance > previousBalanceRef.current) {
      await handleDepositDetected(previousBalanceRef.current, currentBalance);
    }

    // Update previous balance
    previousBalanceRef.current = currentBalance;
  };

  /**
   * Start monitoring
   */
  const startMonitoring = () => {
    if (isMonitoring || !walletAddress) return;

    console.log('🔍 Starting deposit monitoring for:', walletAddress);
    setIsMonitoring(true);

    // Check immediately
    pollBalance();

    // Then poll every 5 seconds
    pollingIntervalRef.current = setInterval(pollBalance, 5000);
  };

  /**
   * Stop monitoring
   */
  const stopMonitoring = () => {
    if (!isMonitoring) return;

    console.log('⏸️ Stopping deposit monitoring');
    setIsMonitoring(false);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  /**
   * Auto-start monitoring when user is authenticated
   */
  useEffect(() => {
    if (authenticated && walletAddress) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, [authenticated, walletAddress]);

  return {
    isMonitoring,
    lastDeposit,
    startMonitoring,
    stopMonitoring,
    checkBalance,
  };
}
