/**
 * CENTRALIZED LOTTERY CONTRACT CONFIGURATION
 *
 * This is the SINGLE SOURCE OF TRUTH for all contract interactions.
 *
 * When you deploy a NEW contract:
 * 1. Update LOTTERY_DUAL_CRYPTO_ABI in /lib/abi/lottery-dual-crypto.ts
 * 2. Update CONTRACT_ADDRESS below (or set NEXT_PUBLIC_LOTTERY_CONTRACT env var)
 * 3. All endpoints, pages, and components auto-update ✅
 *
 * Features:
 * - Auto-imports official ABI from single location
 * - Environment-aware (supports .env override)
 * - Type-safe with TypeScript
 * - Helper functions for common operations
 * - Validation at runtime
 */

import { createPublicClient, createWalletClient, http, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { LOTTERY_DUAL_CRYPTO_ABI } from '@/lib/abi/lottery-dual-crypto';

// ==========================================
// CONTRACT CONFIGURATION
// ==========================================

/**
 * Get contract address from env or fallback to hardcoded
 * Priority: NEXT_PUBLIC_LOTTERY_CONTRACT > NEXT_PUBLIC_LOTTERY_DUAL_CRYPTO > DEFAULT
 */
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_LOTTERY_CONTRACT ||
  process.env.NEXT_PUBLIC_LOTTERY_DUAL_CRYPTO ||
  '0xF3f6f3452513C6101D2EeA45BB8d4f552131B2C7' // v2.1.0 with auto-skip
) as Address;

/**
 * Official ABI - imported from single source of truth
 */
export const CONTRACT_ABI = LOTTERY_DUAL_CRYPTO_ABI;

/**
 * Contract version (for debugging and validation)
 */
export const CONTRACT_VERSION = 'v2.1.0';

/**
 * Contract deployment info
 */
export const CONTRACT_INFO = {
  address: CONTRACT_ADDRESS,
  version: CONTRACT_VERSION,
  chain: 'BASE Mainnet',
  chainId: 8453,
  deployedAt: 'Jan 12, 2025',
  features: [
    'Blockhash commit-reveal randomness',
    'Auto-skip empty draws',
    'Dual vault (hourly + daily)',
    'Refund failed draws',
    'Gas-efficient execution'
  ]
} as const;

// ==========================================
// RPC CONFIGURATION
// ==========================================

/**
 * Get RPC URL from env
 */
export const getRpcUrl = () => {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!alchemyKey) {
    throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY not configured');
  }
  return `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`;
};

/**
 * Get executor private key from env
 */
export const getExecutorPrivateKey = () => {
  const key = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY as `0x${string}`;
  if (!key) {
    throw new Error('WITHDRAWAL_EXECUTOR_PRIVATE_KEY not configured');
  }
  return key;
};

// ==========================================
// CLIENT FACTORIES
// ==========================================

/**
 * Create a public client for read operations
 */
export const createLotteryPublicClient = () => {
  return createPublicClient({
    chain: base,
    transport: http(getRpcUrl())
  });
};

/**
 * Create a wallet client for write operations (cron jobs, admin)
 */
export const createLotteryWalletClient = () => {
  const privateKey = getExecutorPrivateKey();
  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain: base,
    transport: http(getRpcUrl())
  });
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Read from contract (type-safe)
 */
export async function readContract<T = any>(
  functionName: string,
  args?: any[]
): Promise<T> {
  const client = createLotteryPublicClient();

  return client.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName,
    args: args || []
  }) as Promise<T>;
}

/**
 * Write to contract (type-safe)
 */
export async function writeContract(
  functionName: string,
  args?: any[],
  options?: {
    gas?: bigint;
    value?: bigint;
  }
) {
  const client = createLotteryWalletClient();

  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName,
    args: args || [],
    ...options
  });

  // Wait for confirmation
  const publicClient = createLotteryPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    receipt,
    success: receipt.status === 'success'
  };
}

/**
 * Get current draw IDs
 */
export async function getCurrentDrawIds() {
  const [hourlyDrawId, dailyDrawId] = await Promise.all([
    readContract<bigint>('currentHourlyDrawId'),
    readContract<bigint>('currentDailyDrawId')
  ]);

  return {
    hourly: hourlyDrawId,
    daily: dailyDrawId
  };
}

/**
 * Get hourly draw details
 */
export async function getHourlyDraw(drawId: bigint) {
  const data = await readContract('getHourlyDraw', [drawId]) as any;

  // Handle both array and object formats from Viem
  if (Array.isArray(data)) {
    return {
      drawId: data[0],
      drawTime: data[1],
      winningNumber: data[2],
      executed: data[3],
      totalTickets: data[4],
      winner: data[5],
      totalWinners: data[6],
      btcPrizeSnapshot: data[7],
      ethPrizeSnapshot: data[8],
      usdcPrizeSnapshot: data[9],
      commitBlock: data[10],
      revealBlock: data[11],
      salesClosed: data[12]
    };
  }

  return data;
}

/**
 * Get daily draw details
 */
export async function getDailyDraw(drawId: bigint) {
  const data = await readContract('getDailyDraw', [drawId]) as any;

  // Handle both array and object formats from Viem
  if (Array.isArray(data)) {
    return {
      drawId: data[0],
      drawTime: data[1],
      winningNumber: data[2],
      executed: data[3],
      totalTickets: data[4],
      winner: data[5],
      totalWinners: data[6],
      btcPrizeSnapshot: data[7],
      ethPrizeSnapshot: data[8],
      usdcPrizeSnapshot: data[9],
      commitBlock: data[10],
      revealBlock: data[11],
      salesClosed: data[12]
    };
  }

  return data;
}

/**
 * Get vault balances
 */
export async function getVaultBalances() {
  const [hourlyVault, dailyVault] = await Promise.all([
    readContract('getHourlyVault'),
    readContract('getDailyVault')
  ]);

  return {
    hourly: hourlyVault as any,
    daily: dailyVault as any
  };
}

// ==========================================
// VALIDATION
// ==========================================

/**
 * Validate contract configuration
 * Call this on app startup or before critical operations
 */
export async function validateContractConfig() {
  const errors: string[] = [];

  // Check contract address
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    errors.push('Contract address not configured');
  }

  // Check RPC URL
  try {
    getRpcUrl();
  } catch (e) {
    errors.push('RPC URL not configured (missing NEXT_PUBLIC_ALCHEMY_API_KEY)');
  }

  // Check ABI
  if (!CONTRACT_ABI || CONTRACT_ABI.length === 0) {
    errors.push('Contract ABI is empty');
  }

  // Try to read from contract
  try {
    const client = createLotteryPublicClient();
    await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'currentHourlyDrawId'
    });
  } catch (e: any) {
    errors.push(`Cannot read from contract: ${e.message}`);
  }

  if (errors.length > 0) {
    throw new Error(`Contract configuration invalid:\n${errors.join('\n')}`);
  }

  return {
    valid: true,
    contract: CONTRACT_INFO
  };
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  version: CONTRACT_VERSION,
  info: CONTRACT_INFO,

  // Clients
  createPublicClient: createLotteryPublicClient,
  createWalletClient: createLotteryWalletClient,

  // Helpers
  read: readContract,
  write: writeContract,
  getCurrentDrawIds,
  getHourlyDraw,
  getDailyDraw,
  getVaultBalances,

  // Validation
  validate: validateContractConfig
};
