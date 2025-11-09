/**
 * useLotteryGasless Hook
 *
 * React hook para compras de tickets gasless usando meta-transactions (EIP-2771)
 *
 * Características:
 * - Usuario firma mensaje EIP-712 offline (SIN pagar gas)
 * - Backend relayer ejecuta TX on-chain
 * - Smart contract valida signature y reembolsa gas al relayer
 * - Usuario solo ve: $0.25 por ticket (gas incluido)
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import {
  getLotteryDomain,
  BuyTicketTypes,
  BuyTicketMessage,
  SignatureComponents,
} from '@/lib/eip712/types';

// ============ ENVIRONMENT VARIABLES ============
const LOTTERY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS_GASLESS!;
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '8453'); // BASE Mainnet

// ============ CONTRACT ABI (minimal) ============
const LOTTERY_ABI = [
  'function nonces(address user) external view returns (uint256)',
  'function TICKET_PRICE() external view returns (uint256)',
];

/**
 * Ticket structure
 */
export interface Ticket {
  numbers: number[];
  powerNumber: number;
}

/**
 * Gasless purchase result
 */
export interface GaslessPurchaseResult {
  success: boolean;
  ticketIds: number[];
  txHashes: string[];
  totalCost: number;
  message: string;
}

/**
 * Hook return type
 */
export interface UseLotteryGaslessReturn {
  buyTicketsGasless: (tickets: Ticket[]) => Promise<GaslessPurchaseResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Main hook
 */
export function useLotteryGasless(): UseLotteryGaslessReturn {
  const { user, ready, authenticated } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get user's Ethereum provider
   */
  const getProvider = useCallback(async () => {
    if (!ready || !authenticated || !user) {
      throw new Error('User not authenticated');
    }

    // Get provider from Privy embedded wallet
    const provider = await (window as any).ethereum;
    if (!provider) {
      throw new Error('No Ethereum provider found');
    }

    return new ethers.BrowserProvider(provider);
  }, [ready, authenticated, user]);

  /**
   * Get user's wallet address
   */
  const getWalletAddress = useCallback(async (): Promise<string> => {
    if (!user?.wallet?.address) {
      throw new Error('No wallet address found');
    }
    return user.wallet.address.toLowerCase();
  }, [user]);

  /**
   * Get current nonce from smart contract
   */
  const getNonce = useCallback(
    async (provider: ethers.BrowserProvider, address: string): Promise<bigint> => {
      const contract = new ethers.Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, provider);
      const nonce = await contract.nonces(address);
      return nonce;
    },
    []
  );

  /**
   * Sign EIP-712 message for ticket purchase
   */
  const signBuyTicketMessage = useCallback(
    async (
      provider: ethers.BrowserProvider,
      message: BuyTicketMessage
    ): Promise<SignatureComponents> => {
      const signer = await provider.getSigner();
      const domain = getLotteryDomain(LOTTERY_CONTRACT_ADDRESS, CHAIN_ID);

      // Sign typed data (EIP-712)
      const signature = await signer.signTypedData(domain, BuyTicketTypes, message);

      // Split signature into v, r, s components
      const sig = ethers.Signature.from(signature);

      return {
        v: sig.v,
        r: sig.r,
        s: sig.s,
      };
    },
    []
  );

  /**
   * Buy tickets gasless (main function)
   */
  const buyTicketsGasless = useCallback(
    async (tickets: Ticket[]): Promise<GaslessPurchaseResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Validate inputs
        if (!tickets || tickets.length === 0) {
          throw new Error('No tickets provided');
        }

        if (tickets.length > 50000) {
          throw new Error('Cannot purchase more than 50,000 tickets at once');
        }

        // Validate each ticket
        for (const ticket of tickets) {
          if (ticket.numbers.length !== 5) {
            throw new Error('Each ticket must have exactly 5 numbers');
          }
          if (new Set(ticket.numbers).size !== 5) {
            throw new Error('Ticket numbers must be unique');
          }
          if (ticket.numbers.some((n) => n < 1 || n > 50)) {
            throw new Error('Numbers must be between 1 and 50');
          }
          if (ticket.powerNumber < 1 || ticket.powerNumber > 20) {
            throw new Error('Power number must be between 1 and 20');
          }
        }

        // 2. Get provider and wallet address
        const provider = await getProvider();
        const buyerAddress = await getWalletAddress();

        console.log('[useLotteryGasless] Starting gasless purchase', {
          buyer: buyerAddress,
          ticketCount: tickets.length,
        });

        // 3. Get current nonce from smart contract
        let currentNonce = await getNonce(provider, buyerAddress);
        console.log('[useLotteryGasless] Starting nonce:', currentNonce.toString());

        // 4. Create deadline (15 minutes from now)
        const deadline = Math.floor(Date.now() / 1000) + 15 * 60;

        // 5. Process each ticket individually (ONE signature per ticket)
        const successfulTickets: number[] = [];
        const txHashes: string[] = [];

        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          console.log(`[useLotteryGasless] Processing ticket ${i + 1}/${tickets.length}`);

          try {
            // Get current nonce (in case it changed)
            if (i > 0) {
              currentNonce = await getNonce(provider, buyerAddress);
              console.log('[useLotteryGasless] Updated nonce:', currentNonce.toString());
            }

            // Sign message for THIS ticket with current nonce
            const message: BuyTicketMessage = {
              buyer: buyerAddress,
              numbers: ticket.numbers as [number, number, number, number, number],
              powerNumber: ticket.powerNumber,
              nonce: currentNonce,
              deadline: deadline,
            };

            console.log(`[useLotteryGasless] Requesting signature for ticket ${i + 1}...`);
            const signature = await signBuyTicketMessage(provider, message);
            console.log(`[useLotteryGasless] Signature obtained for ticket ${i + 1}`);

            // Send to backend relayer API
            const response = await fetch('/api/tickets/buy-gasless', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                buyer: buyerAddress,
                numbers: ticket.numbers,
                powerNumber: ticket.powerNumber,
                nonce: Number(currentNonce),
                deadline: deadline,
                v: signature.v,
                r: signature.r,
                s: signature.s,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Gasless purchase failed');
            }

            const result = await response.json();
            console.log(`[useLotteryGasless] Ticket ${i + 1} purchased successfully`, result);

            successfulTickets.push(result.ticketId);
            txHashes.push(result.txHash);
          } catch (ticketError: any) {
            console.error(`[useLotteryGasless] Failed to purchase ticket ${i + 1}:`, ticketError);

            // If first ticket fails, throw error
            if (i === 0) {
              throw ticketError;
            }

            // If subsequent ticket fails, return partial success
            console.warn(`[useLotteryGasless] Partial success: ${i}/${tickets.length} tickets purchased`);
            break;
          }
        }

        // 6. Return success result
        return {
          success: true,
          ticketIds: successfulTickets,
          txHashes: txHashes,
          totalCost: successfulTickets.length * 0.25,
          message: `Successfully purchased ${successfulTickets.length} ticket(s) gasless!`,
        };
      } catch (err: any) {
        console.error('[useLotteryGasless] Purchase failed:', err);
        const errorMessage = err.message || 'Failed to purchase tickets';
        setError(errorMessage);

        return {
          success: false,
          ticketIds: [],
          txHashes: [],
          totalCost: 0,
          message: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [getProvider, getWalletAddress, getNonce, signBuyTicketMessage]
  );

  return {
    buyTicketsGasless,
    isLoading,
    error,
    clearError,
  };
}
