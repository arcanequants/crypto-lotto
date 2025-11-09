/**
 * Notification Manager
 *
 * Smart notification system that consolidates and batches notifications
 * to avoid spam and improve user experience.
 */

import {
  DepositConfirmedEmail,
  DepositBulkEmail,
  RandomDrawResultEmail,
  PrizeWonPremiumEmail,
  type DepositConfirmedEmailProps,
  type DepositBulkEmailProps,
  type DrawResultEmailProps,
  type PrizeWonPremiumEmailProps,
} from '@/lib/email-templates';
import {
  createNotification,
  type NotificationType,
  type NotificationChannel,
} from '@/lib/database/notifications';

// Ticket purchase data
export interface TicketPurchase {
  ticketId: number;
  ticketNumber: number;
  drawId: number;
}

// Deposit notification data
export interface DepositNotificationData {
  userAddress: string;
  amount: string;
  transactionHash: string;
  timestamp: string;
  tickets: TicketPurchase[];
  emailAddress?: string;
}

// Draw result notification data
export interface DrawResultNotificationData {
  userAddress: string;
  drawId: number;
  drawDate: string;
  drawTime: string;
  winningNumber: number;
  tickets: Array<{ ticketId: number; ticketNumber: number; won: boolean }>;
  emailAddress?: string;
}

// Prize won notification data
export interface PrizeWonNotificationData {
  userAddress: string;
  drawId: number;
  drawDate: string;
  winningTickets: Array<{
    ticketId: number;
    ticketNumber: number;
    prize: {
      btc: string;
      eth: string;
      usdc: string;
      totalUSD: string;
    };
  }>;
  emailAddress?: string;
}

/**
 * Smart deposit notification
 * Automatically chooses the right template based on ticket count
 */
export async function sendDepositNotification(data: DepositNotificationData) {
  const { userAddress, amount, transactionHash, timestamp, tickets, emailAddress } = data;
  const ticketCount = tickets.length;

  // Determine which template to use based on ticket count
  let emailTemplate;
  let templateProps;

  if (ticketCount === 1) {
    // Single ticket - use simple deposit confirmed template
    emailTemplate = 'deposit-confirmed';
    templateProps = {
      amount,
      transactionHash,
      timestamp,
    } as DepositConfirmedEmailProps;
  } else {
    // Multiple tickets - use bulk template
    emailTemplate = 'deposit-bulk';
    const ticketIds = ticketCount <= 10 ? tickets.map(t => t.ticketId) : undefined;

    templateProps = {
      amount,
      transactionHash,
      timestamp,
      ticketCount,
      drawId: tickets[0].drawId,
      ticketIds,
    } as DepositBulkEmailProps;
  }

  // Create notification record
  const notification = await createNotification({
    userAddress,
    type: 'deposit_confirmed',
    channel: 'both', // Send both email and toast
    data: {
      template: emailTemplate,
      props: templateProps,
      ticketCount,
      tickets: tickets.map(t => ({ id: t.ticketId, number: t.ticketNumber })),
    },
    emailAddress,
  });

  return {
    template: emailTemplate,
    props: templateProps,
    notificationId: notification?.id,
    shouldSendEmail: true,
    shouldShowToast: true,
    toastMessage: ticketCount === 1
      ? `Ticket purchased! ✅`
      : `${ticketCount} tickets purchased! ✅`,
  };
}

/**
 * Smart draw result notification
 * Always sends ONE email per draw, regardless of ticket count
 */
export async function sendDrawResultNotification(data: DrawResultNotificationData) {
  const { userAddress, drawId, drawDate, drawTime, winningNumber, tickets, emailAddress } = data;

  const wonTickets = tickets.filter(t => t.won);
  const hasWon = wonTickets.length > 0;

  // If user won, we'll send a separate "Prize Won" email
  // So for draw results, we only send to users who didn't win
  if (hasWon) {
    // Skip draw result email, will send prize won email instead
    return {
      template: null,
      props: null,
      notificationId: null,
      shouldSendEmail: false,
      shouldShowToast: true,
      toastMessage: `You won ${wonTickets.length} prize${wonTickets.length > 1 ? 's' : ''}! 🎊`,
    };
  }

  // User didn't win - send draw result email
  // For users with multiple tickets, we pick ONE random ticket to show
  // (Just for display purposes - the email shows they didn't match)
  const randomTicket = tickets[Math.floor(Math.random() * tickets.length)];

  const templateProps: DrawResultEmailProps = {
    drawId,
    drawDate,
    drawTime,
    winningNumber,
    userNumber: randomTicket.ticketNumber,
    ticketId: randomTicket.ticketId,
  };

  // Create notification record
  const notification = await createNotification({
    userAddress,
    type: 'draw_result',
    channel: 'both',
    data: {
      props: templateProps,
      ticketCount: tickets.length,
      allTickets: tickets.map(t => ({ id: t.ticketId, number: t.ticketNumber })),
    },
    emailAddress,
  });

  return {
    template: 'draw-result-random',
    props: templateProps,
    notificationId: notification?.id,
    shouldSendEmail: true,
    shouldShowToast: true,
    toastMessage: tickets.length === 1
      ? `Draw #${drawId} complete. Better luck next time!`
      : `Draw #${drawId} complete. No matches from your ${tickets.length} tickets.`,
  };
}

/**
 * Prize won notification
 * Consolidates all winning tickets into ONE email
 */
export async function sendPrizeWonNotification(data: PrizeWonNotificationData) {
  const { userAddress, drawId, drawDate, winningTickets, emailAddress } = data;

  // Calculate total prizes
  let totalBTC = 0;
  let totalETH = 0;
  let totalUSDC = 0;
  let totalValueUSD = 0;

  winningTickets.forEach(ticket => {
    totalBTC += parseFloat(ticket.prize.btc);
    totalETH += parseFloat(ticket.prize.eth);
    totalUSDC += parseFloat(ticket.prize.usdc);
    totalValueUSD += parseFloat(ticket.prize.totalUSD);
  });

  // If only one winning ticket, show standard template
  // If multiple, we could create a special "multiple wins" template
  const firstTicket = winningTickets[0];

  const templateProps: PrizeWonPremiumEmailProps = {
    drawId,
    drawDate,
    ticketId: firstTicket.ticketId,
    winningNumber: firstTicket.ticketNumber,
    totalValueUSD: totalValueUSD.toFixed(2),
    assets: [
      {
        symbol: 'BITCOIN',
        emoji: '₿',
        amount: `${totalBTC.toFixed(8)} BTC`,
        usdValue: (totalBTC * 90000).toFixed(2), // Approximate BTC price
        color: '#ffa500',
      },
      {
        symbol: 'ETHEREUM',
        emoji: 'Ξ',
        amount: `${totalETH.toFixed(6)} ETH`,
        usdValue: (totalETH * 1650).toFixed(2), // Approximate ETH price
        color: '#00f0ff',
      },
      {
        symbol: 'USDC',
        emoji: '💵',
        amount: `$${totalUSDC.toFixed(2)}`,
        usdValue: totalUSDC.toFixed(2),
        color: '#ffffff',
      },
    ],
  };

  // Create notification record
  const notification = await createNotification({
    userAddress,
    type: 'prize_won',
    channel: 'both',
    data: {
      props: templateProps,
      winningTicketCount: winningTickets.length,
      allWinningTickets: winningTickets.map(t => ({
        id: t.ticketId,
        number: t.ticketNumber,
        prize: t.prize,
      })),
    },
    emailAddress,
  });

  return {
    template: 'prize-won-premium',
    props: templateProps,
    notificationId: notification?.id,
    shouldSendEmail: true,
    shouldShowToast: true,
    toastMessage: winningTickets.length === 1
      ? `You won a prize! 🎊`
      : `You won ${winningTickets.length} prizes! 🎊`,
  };
}

/**
 * Helper to get toast notification message
 */
export function getToastMessage(
  type: NotificationType,
  data: any
): string {
  switch (type) {
    case 'deposit_confirmed':
      const ticketCount = data.ticketCount || 1;
      return ticketCount === 1
        ? 'Deposit confirmed! ✅'
        : `${ticketCount} tickets purchased! ✅`;

    case 'draw_result':
      const hasTickets = data.ticketCount > 1;
      return hasTickets
        ? `Draw #${data.drawId} complete. Check your results!`
        : `Draw #${data.drawId} complete.`;

    case 'prize_won':
      const winCount = data.winningTicketCount || 1;
      return winCount === 1
        ? 'You won a prize! 🎊'
        : `You won ${winCount} prizes! 🎊`;

    default:
      return 'New notification';
  }
}
