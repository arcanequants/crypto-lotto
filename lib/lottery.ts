// Lottery utility functions

export const PRIZE_TIERS = {
  '5+1': { name: '5 + PowerBall', percentage: 50, baseAmount: 2500 },
  '5+0': { name: '5 Numbers', percentage: 20, baseAmount: 1000 },
  '4+1': { name: '4 + PowerBall', percentage: 15, baseAmount: 750 },
  '4+0': { name: '4 Numbers', percentage: 10, baseAmount: 500 },
  '3+1': { name: '3 + PowerBall', percentage: 3, baseAmount: 150 },
  '3+0': { name: '3 Numbers', percentage: 2, baseAmount: 100 }
};

export type PrizeTier = '5+1' | '5+0' | '4+1' | '4+0' | '3+1' | '3+0';

export interface WinningNumbers {
  mainNumbers: number[];
  powerNumber: number;
}

/**
 * Generate random winning numbers for the draw
 */
export function generateWinningNumbers(): WinningNumbers {
  // Generate 5 unique main numbers (1-50)
  const mainNumbers: number[] = [];
  while (mainNumbers.length < 5) {
    const num = Math.floor(Math.random() * 50) + 1;
    if (!mainNumbers.includes(num)) {
      mainNumbers.push(num);
    }
  }
  mainNumbers.sort((a, b) => a - b);

  // Generate 1 power number (1-20)
  const powerNumber = Math.floor(Math.random() * 20) + 1;

  return { mainNumbers, powerNumber };
}

/**
 * Check how many numbers match between ticket and winning numbers
 */
export function calculateMatches(
  ticketNumbers: number[],
  ticketPower: number,
  winningNumbers: WinningNumbers
): { mainMatches: number; powerMatch: boolean } {
  const mainMatches = ticketNumbers.filter(num =>
    winningNumbers.mainNumbers.includes(num)
  ).length;

  const powerMatch = ticketPower === winningNumbers.powerNumber;

  return { mainMatches, powerMatch };
}

/**
 * Determine the prize tier based on matches
 */
export function getPrizeTier(
  mainMatches: number,
  powerMatch: boolean
): PrizeTier | null {
  if (mainMatches === 5 && powerMatch) return '5+1';
  if (mainMatches === 5 && !powerMatch) return '5+0';
  if (mainMatches === 4 && powerMatch) return '4+1';
  if (mainMatches === 4 && !powerMatch) return '4+0';
  if (mainMatches === 3 && powerMatch) return '3+1';
  if (mainMatches === 3 && !powerMatch) return '3+0';
  return null;
}

/**
 * Calculate prize amount for a tier
 */
export function calculatePrizeAmount(
  tier: PrizeTier,
  totalPrizePool: number
): number {
  const tierInfo = PRIZE_TIERS[tier];
  return (totalPrizePool * tierInfo.percentage) / 100;
}

/**
 * Calculate total winners per tier from all tickets
 */
export function calculateWinnersByTier(
  tickets: Array<{
    numbers: number[]; // FIXED: era selected_numbers
    power_number: number;
  }>,
  winningNumbers: WinningNumbers
): Record<PrizeTier, number> {
  const winners: Record<PrizeTier, number> = {
    '5+1': 0,
    '5+0': 0,
    '4+1': 0,
    '4+0': 0,
    '3+1': 0,
    '3+0': 0
  };

  tickets.forEach(ticket => {
    const { mainMatches, powerMatch } = calculateMatches(
      ticket.numbers, // FIXED: era selected_numbers
      ticket.power_number,
      winningNumbers
    );

    const tier = getPrizeTier(mainMatches, powerMatch);
    if (tier) {
      winners[tier]++;
    }
  });

  return winners;
}

/**
 * Calculate individual prize for a winning ticket
 */
export function calculateIndividualPrize(
  tier: PrizeTier,
  totalPrizePool: number,
  winnersInTier: number
): number {
  if (winnersInTier === 0) return 0;

  const tierPrize = calculatePrizeAmount(tier, totalPrizePool);
  return tierPrize / winnersInTier;
}

/**
 * Calculate prize for a specific ticket
 */
export function calculateTicketPrize(
  ticket: {
    numbers: number[]; // FIXED: era selected_numbers
    power_number: number;
  },
  winningNumbers: WinningNumbers,
  totalPrizePool: number,
  winnersByTier: Record<PrizeTier, number>
): { tier: PrizeTier | null; amount: number } {
  const { mainMatches, powerMatch } = calculateMatches(
    ticket.numbers, // FIXED: era selected_numbers
    ticket.power_number,
    winningNumbers
  );

  const tier = getPrizeTier(mainMatches, powerMatch);

  if (!tier) {
    return { tier: null, amount: 0 };
  }

  const winnersInTier = winnersByTier[tier];
  const amount = calculateIndividualPrize(tier, totalPrizePool, winnersInTier);

  return { tier, amount };
}

/**
 * Get all winning tickets for a user with prize amounts
 */
export function getUserWinningTickets(
  userTickets: Array<{
    id: number;
    numbers: number[]; // FIXED: era selected_numbers
    power_number: number;
    claim_status: string;
  }>,
  winningNumbers: WinningNumbers,
  totalPrizePool: number,
  winnersByTier: Record<PrizeTier, number>
): Array<{
  ticketId: number;
  tier: PrizeTier;
  amount: number;
  claimed: boolean;
}> {
  return userTickets
    .map(ticket => {
      const { tier, amount } = calculateTicketPrize(
        ticket,
        winningNumbers,
        totalPrizePool,
        winnersByTier
      );

      if (!tier) return null;

      return {
        ticketId: ticket.id,
        tier,
        amount,
        claimed: ticket.claim_status === 'claimed'
      };
    })
    .filter((ticket): ticket is NonNullable<typeof ticket> => ticket !== null);
}

/**
 * Calculate total unclaimed prizes for a user
 */
export function calculateUnclaimedPrizes(
  winningTickets: Array<{
    amount: number;
    claimed: boolean;
  }>
): number {
  return winningTickets
    .filter(ticket => !ticket.claimed)
    .reduce((total, ticket) => total + ticket.amount, 0);
}
