/**
 * Ticket Purchase Monitor Hook
 *
 * Monitors TicketPurchased events from the lottery contract
 * More efficient than polling - uses blockchain events
 */

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import { showDepositConfirmedToast } from '@/lib/notifications/toast-notifications';

// Lottery Contract Address
const LOTTERY_CONTRACT = '0xB8D7DEf776C1D3C96DeB6b2193408B82dca99aE3'; // Your LotteryDualCrypto

// Event signature for TicketPurchased
// event TicketPurchased(address indexed player, uint256 indexed ticketId, uint256 ticketNumber, uint256 drawId)
const TICKET_PURCHASED_EVENT = parseAbiItem(
  'event TicketPurchased(address indexed player, uint256 indexed ticketId, uint256 ticketNumber, uint256 drawId)'
);

interface TicketPurchaseEvent {
  player: string;
  ticketId: bigint;
  ticketNumber: bigint;
  drawId: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

interface PurchaseBatch {
  tickets: TicketPurchaseEvent[];
  totalTickets: number;
  amount: string;
  timestamp: Date;
}

/**
 * Hook to monitor ticket purchases via contract events
 *
 * Listens to TicketPurchased events and consolidates them
 * Triggers notifications after 5 seconds of no new purchases
 */
export function useTicketPurchaseMonitor() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<PurchaseBatch | null>(null);
  const [pendingTickets, setPendingTickets] = useState<TicketPurchaseEvent[]>([]);
  const [notificationTimeout, setNotificationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get user's smart wallet address
  const smartWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const walletAddress = smartWallet?.address;

  // Create public client
  const publicClient = createPublicClient({
    chain: base,
    transport: http(
      process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
        ? `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        : undefined
    ),
  });

  /**
   * Process accumulated tickets and send notification
   */
  const processTicketBatch = async (tickets: TicketPurchaseEvent[]) => {
    if (tickets.length === 0) return;

    const ticketCount = tickets.length;
    const ticketPrice = 0.10;
    const totalAmount = (ticketCount * ticketPrice).toFixed(2);

    console.log('🎫 Processing ticket batch:', {
      count: ticketCount,
      amount: totalAmount,
      tickets: tickets.map(t => ({
        id: Number(t.ticketId),
        number: Number(t.ticketNumber),
        draw: Number(t.drawId),
      })),
    });

    // Create batch info
    const batch: PurchaseBatch = {
      tickets,
      totalTickets: ticketCount,
      amount: totalAmount,
      timestamp: new Date(),
    };
    setLastPurchase(batch);

    // Show toast notification
    showDepositConfirmedToast(ticketCount, totalAmount);

    // Send email notification (async)
    if (user?.email?.address) {
      fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'deposit_confirmed',
          data: {
            userAddress: walletAddress,
            amount: totalAmount,
            transactionHash: tickets[0].transactionHash,
            timestamp: new Date().toLocaleString(),
            tickets: tickets.map(t => ({
              ticketId: Number(t.ticketId),
              ticketNumber: Number(t.ticketNumber),
              drawId: Number(t.drawId),
            })),
            emailAddress: user.email.address,
          },
        }),
      }).catch((error) => {
        console.error('Failed to send email notification:', error);
      });
    }

    // Clear pending tickets
    setPendingTickets([]);
  };

  /**
   * Handle new ticket purchased event
   */
  const handleTicketPurchased = (event: TicketPurchaseEvent) => {
    console.log('🎟️ New ticket purchased:', {
      ticketId: Number(event.ticketId),
      ticketNumber: Number(event.ticketNumber),
      drawId: Number(event.drawId),
    });

    // Add to pending tickets
    setPendingTickets(prev => [...prev, event]);

    // Clear existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }

    // Set new timeout - wait 5 seconds for more tickets
    const timeout = setTimeout(() => {
      setPendingTickets(currentTickets => {
        if (currentTickets.length > 0) {
          processTicketBatch(currentTickets);
        }
        return [];
      });
    }, 5000); // 5 second consolidation window

    setNotificationTimeout(timeout);
  };

  /**
   * Start monitoring contract events
   */
  const startMonitoring = async () => {
    if (!walletAddress || isMonitoring) return;

    console.log('🔍 Starting ticket purchase monitoring for:', walletAddress);
    setIsMonitoring(true);

    try {
      // Get current block number
      const currentBlock = await publicClient.getBlockNumber();

      // Watch for new TicketPurchased events for this user
      const unwatch = publicClient.watchEvent({
        address: LOTTERY_CONTRACT as `0x${string}`,
        event: TICKET_PURCHASED_EVENT,
        args: {
          player: walletAddress as `0x${string}`,
        },
        onLogs: (logs) => {
          logs.forEach((log) => {
            const event: TicketPurchaseEvent = {
              player: log.args.player!,
              ticketId: log.args.ticketId!,
              ticketNumber: log.args.ticketNumber!,
              drawId: log.args.drawId!,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
            };
            handleTicketPurchased(event);
          });
        },
        pollingInterval: 3000, // Poll every 3 seconds
      });

      // Store unwatcher for cleanup
      return unwatch;
    } catch (error) {
      console.error('Error starting event monitoring:', error);
      setIsMonitoring(false);
    }
  };

  /**
   * Stop monitoring
   */
  const stopMonitoring = () => {
    console.log('⏸️ Stopping ticket purchase monitoring');
    setIsMonitoring(false);

    // Clear any pending notification timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      setNotificationTimeout(null);
    }

    // Process any remaining pending tickets
    if (pendingTickets.length > 0) {
      processTicketBatch(pendingTickets);
    }
  };

  /**
   * Auto-start monitoring when authenticated
   */
  useEffect(() => {
    let unwatch: (() => void) | undefined;

    if (authenticated && walletAddress) {
      startMonitoring().then((unwatchFn) => {
        unwatch = unwatchFn;
      });
    } else {
      stopMonitoring();
    }

    // Cleanup
    return () => {
      if (unwatch) {
        unwatch();
      }
      stopMonitoring();
    };
  }, [authenticated, walletAddress]);

  return {
    isMonitoring,
    lastPurchase,
    pendingTickets: pendingTickets.length,
  };
}
