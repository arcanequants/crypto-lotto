'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

/**
 * MoonPay Funding Hook
 * Allows users to buy USDC/USDT with fiat via MoonPay onramp
 *
 * User can pay with:
 * - Credit/Debit Card
 * - Apple Pay
 * - Google Pay
 * - Bank Transfer
 */
export function useFundWallet() {
  const { user, authenticated } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = user?.wallet?.address;

  /**
   * Open MoonPay modal to buy USDC or USDT with card
   *
   * @param amount - Amount in USD (e.g., "10.00" for $10)
   * @param asset - Asset to buy (USDC or USDT), defaults to USDC
   */
  const fundWithCard = async (amount?: string, asset: 'usdc' | 'usdt' = 'usdc') => {
    if (!authenticated || !walletAddress) {
      throw new Error('Please connect your wallet first');
    }

    setLoading(true);
    setError(null);

    try {
      // Call our API to get signed MoonPay URL
      const response = await fetch('/api/onramp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: walletAddress,
          email: user?.email?.address,
          amount: amount,
          asset: asset,
          redirectUrl: window.location.href, // Return to current page after purchase
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment URL');
      }

      const data = await response.json();

      console.log('Opening MoonPay for:', {
        wallet: walletAddress,
        amount: amount || 'user choice',
        asset: asset.toUpperCase(),
        provider: data.provider,
        currency: data.currency
      });

      // Open MoonPay in new window
      const moonpayWindow = window.open(
        data.url,
        'MoonPay',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      if (!moonpayWindow) {
        throw new Error('Please allow popups to complete the purchase');
      }

      // Monitor window close (user completed or cancelled)
      const checkWindowClosed = setInterval(() => {
        if (moonpayWindow.closed) {
          clearInterval(checkWindowClosed);
          setLoading(false);

          // Show notification that they should check their balance
          console.log('MoonPay window closed. Please check your wallet balance.');
        }
      }, 1000);

      // Stop loading after 2 seconds (window is open)
      setTimeout(() => {
        setLoading(false);
      }, 2000);

    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to open funding modal');
      throw err;
    }
  };

  /**
   * Check if MoonPay funding is available
   */
  const isFundingAvailable = (): boolean => {
    // MoonPay works with any wallet type (embedded or external)
    // Only requires authentication and wallet address

    if (!authenticated) return false;
    if (!walletAddress) return false;

    return true;
  };

  /**
   * Get estimated time for funding to complete via MoonPay
   */
  const getEstimatedFundingTime = (): string => {
    return '5-15 minutes';
  };

  /**
   * Get supported payment methods
   */
  const getSupportedPaymentMethods = (): string[] => {
    return [
      'Credit Card',
      'Debit Card',
      'Apple Pay',
      'Google Pay',
      'Bank Transfer (ACH)'
    ];
  };

  return {
    // State
    loading,
    error,
    walletAddress,
    authenticated,

    // Functions
    fundWithCard,
    isFundingAvailable,
    getEstimatedFundingTime,
    getSupportedPaymentMethods
  };
}
