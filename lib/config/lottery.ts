/**
 * LOTTERY CONFIGURATION
 *
 * This file centralizes all lottery parameters.
 * Set NEXT_PUBLIC_TESTING_MODE=true in .env.local to enable testing mode.
 */

const IS_TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';
const IS_ULTRA_SIMPLE_MODE = process.env.NEXT_PUBLIC_ULTRA_SIMPLE_MODE === 'true';

// ===========================================
// LOTTERY NUMBERS CONFIGURATION
// ===========================================

export const LOTTERY_CONFIG = {
  // LotteryDualCrypto (deployed Nov 6, 2025): 1 number from 1-100, NO POWER!
  // This matches the actual mainnet contract configuration
  // Ultra simple mode: 1 number from 1-100, NO POWER!
  // Testing mode: 3 numbers from 1-10, power 1-3
  // Production mode: 5 numbers from 1-69, power 1-26

  numbers: {
    min: 1,
    max: IS_ULTRA_SIMPLE_MODE ? 100 : (IS_TESTING_MODE ? 10 : 69),
    count: IS_ULTRA_SIMPLE_MODE ? 1 : (IS_TESTING_MODE ? 3 : 5),
  },

  powerNumber: {
    min: 1,
    max: IS_ULTRA_SIMPLE_MODE ? 0 : (IS_TESTING_MODE ? 3 : 26), // 0 = disabled
    enabled: !IS_ULTRA_SIMPLE_MODE,
  },

  // Prize tiers (same for both modes, just easier to win in testing)
  prizeTiers: IS_TESTING_MODE ? {
    // Testing mode: Simplified tiers
    tier1: { match: 3, powerMatch: true, name: 'Jackpot (3+P)' },
    tier2: { match: 3, powerMatch: false, name: '3 numbers' },
    tier3: { match: 2, powerMatch: true, name: '2+Power' },
    tier4: { match: 2, powerMatch: false, name: '2 numbers' },
    tier5: { match: 1, powerMatch: true, name: '1+Power' },
    tier6: { match: 0, powerMatch: true, name: 'Power only' },
  } : {
    // Production mode: Full tiers
    tier1: { match: 5, powerMatch: true, name: 'Jackpot (5+P)' },
    tier2: { match: 5, powerMatch: false, name: '5 numbers' },
    tier3: { match: 4, powerMatch: true, name: '4+Power' },
    tier4: { match: 4, powerMatch: false, name: '4 numbers' },
    tier5: { match: 3, powerMatch: true, name: '3+Power' },
    tier6: { match: 3, powerMatch: false, name: '3 numbers' },
    tier7: { match: 2, powerMatch: true, name: '2+Power' },
    tier8: { match: 1, powerMatch: true, name: '1+Power' },
    tier9: { match: 0, powerMatch: true, name: 'Power only' },
  },
};

// ===========================================
// DRAW SCHEDULE CONFIGURATION
// ===========================================

export const DRAW_SCHEDULE = {
  // Testing mode: Every 30 minutes
  // Production mode: Daily at 10 PM, Weekly on Saturdays at 11 PM

  daily: {
    enabled: true,
    // In testing, draws happen every 30 minutes
    // In production, daily at 10 PM UTC
    intervalMinutes: IS_TESTING_MODE ? 30 : undefined,
    hour: IS_TESTING_MODE ? undefined : 22, // 10 PM UTC
    minute: IS_TESTING_MODE ? undefined : 0,
  },

  weekly: {
    enabled: !IS_TESTING_MODE, // Disable weekly in testing mode
    dayOfWeek: 6, // Saturday (0 = Sunday)
    hour: 23, // 11 PM UTC
    minute: 0,
  },
};

// ===========================================
// TICKET PRICING
// ===========================================

export const TICKET_PRICING = {
  // Testing mode: $0.10 per ticket
  // Production mode: $0.25 per ticket
  priceUSD: IS_TESTING_MODE ? 0.10 : 0.25,

  // Accepted tokens (same for both modes)
  acceptedTokens: ['USDC', 'USDT', 'DAI'],
};

// ===========================================
// PRIZE POOL DISTRIBUTION
// ===========================================

export const PRIZE_DISTRIBUTION = {
  // How the prize pool is divided (same for both modes)
  jackpot: 0.50,        // 50% to jackpot
  tier2: 0.15,          // 15% to tier 2
  tier3: 0.10,          // 10% to tier 3
  tier4: 0.08,          // 8% to tier 4
  tier5: 0.06,          // 6% to tier 5
  tier6: 0.05,          // 5% to tier 6
  tier7: 0.03,          // 3% to tier 7
  tier8: 0.02,          // 2% to tier 8
  tier9: 0.01,          // 1% to tier 9

  // Platform fees
  platformFee: 0.05,     // 5% platform fee
  treasuryFee: 0.03,     // 3% to DAO treasury
};

// ===========================================
// TESTING MODE FEATURES
// ===========================================

export const TESTING_FEATURES = {
  enabled: IS_TESTING_MODE,

  // "Cheat mode" - guarantee winning numbers for testing
  // When enabled, user can specify winning numbers in advance
  allowCheatMode: IS_TESTING_MODE,

  // Auto-advance draws for testing
  autoAdvanceDraws: IS_TESTING_MODE,

  // Faucet - Get free test tokens
  faucetEnabled: IS_TESTING_MODE,
  faucetAmount: 10, // $10 worth of test tokens
  faucetCooldown: 60 * 60 * 1000, // 1 hour cooldown
};

// ===========================================
// SMART CONTRACT ADDRESSES
// ===========================================

export const CONTRACT_ADDRESSES = {
  // Use contracts from .env.local
  lottery: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS,
  usdt: process.env.NEXT_PUBLIC_USDC_ADDRESS, // Using USDC for both in ultra-simple mode
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) : 8453,
  network: process.env.NEXT_PUBLIC_NETWORK || 'base',
};

// ===========================================
// DISPLAY HELPERS
// ===========================================

export function getLotteryDisplayName(): string {
  return IS_TESTING_MODE ? 'Crypto Lotto (TESTING)' : 'Crypto Lotto';
}

export function getLotteryDescription(): string {
  if (IS_TESTING_MODE) {
    return `Pick ${LOTTERY_CONFIG.numbers.count} numbers from 1-${LOTTERY_CONFIG.numbers.max} and 1 Power number from 1-${LOTTERY_CONFIG.powerNumber.max}. Draws every ${DRAW_SCHEDULE.daily.intervalMinutes} minutes!`;
  }

  return `Pick ${LOTTERY_CONFIG.numbers.count} numbers from 1-${LOTTERY_CONFIG.numbers.max} and 1 Power number from 1-${LOTTERY_CONFIG.powerNumber.max}. Draws daily and weekly!`;
}

export function getDrawFrequency(): string {
  if (IS_TESTING_MODE) {
    return `Every ${DRAW_SCHEDULE.daily.intervalMinutes} minutes`;
  }

  return 'Daily at 10 PM UTC, Weekly on Saturdays at 11 PM UTC';
}

// ===========================================
// VALIDATION HELPERS
// ===========================================

export function validateTicketNumbers(numbers: number[]): { valid: boolean; error?: string } {
  if (numbers.length !== LOTTERY_CONFIG.numbers.count) {
    return {
      valid: false,
      error: `Must select exactly ${LOTTERY_CONFIG.numbers.count} numbers`,
    };
  }

  const allValid = numbers.every(
    (n) => n >= LOTTERY_CONFIG.numbers.min && n <= LOTTERY_CONFIG.numbers.max
  );

  if (!allValid) {
    return {
      valid: false,
      error: `All numbers must be between ${LOTTERY_CONFIG.numbers.min} and ${LOTTERY_CONFIG.numbers.max}`,
    };
  }

  const hasDuplicates = new Set(numbers).size !== numbers.length;
  if (hasDuplicates) {
    return {
      valid: false,
      error: 'Cannot select duplicate numbers',
    };
  }

  return { valid: true };
}

export function validatePowerNumber(powerNumber: number): { valid: boolean; error?: string } {
  if (powerNumber < LOTTERY_CONFIG.powerNumber.min || powerNumber > LOTTERY_CONFIG.powerNumber.max) {
    return {
      valid: false,
      error: `Power number must be between ${LOTTERY_CONFIG.powerNumber.min} and ${LOTTERY_CONFIG.powerNumber.max}`,
    };
  }

  return { valid: true };
}

// ===========================================
// EXPORT MODE FLAGS
// ===========================================

export const IS_TESTING = IS_TESTING_MODE;
export const IS_ULTRA_SIMPLE = IS_ULTRA_SIMPLE_MODE;

export default LOTTERY_CONFIG;
