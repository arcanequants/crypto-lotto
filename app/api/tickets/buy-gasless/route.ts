import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logging/logger';
import { priceCache, fetchPriceFromCoinGecko } from '@/lib/cache/priceCache';
import {
  GaslessTicketPurchaseSchema,
  validateRequest,
  formatZodError,
} from '@/lib/validation/schemas';
import {
  acquireLock,
  checkGaslessRateLimit,
  isRedisConfigured,
} from '@/lib/security/redis';

/**
 * POST /api/tickets/buy-gasless
 *
 * GASLESS META-TRANSACTION RELAYER (EIP-2771)
 *
 * Este endpoint actúa como relayer para compras de tickets gasless:
 *
 * Flujo:
 * 1. Usuario firma EIP-712 message con su wallet (offline, no gas)
 * 2. Frontend envía signature + datos a este endpoint
 * 3. Backend valida signature y datos
 * 4. Backend ejecuta TX on-chain como relayer (paga gas inicialmente)
 * 5. Smart contract valida signature on-chain
 * 6. Smart contract reembolsa 4% del ticket price al relayer
 * 7. Backend registra ticket en DB con buyer como owner
 *
 * Request body (ONE TICKET PER REQUEST):
 * {
 *   buyer: "0x123...",
 *   numbers: [1,2,3,4,5],
 *   powerNumber: 10,
 *   nonce: 0,
 *   deadline: 1234567890,
 *   v: 28,
 *   r: "0x...",
 *   s: "0x..."
 * }
 *
 * Response:
 * {
 *   success: true,
 *   txHash: "0x...",
 *   ticketId: 1,
 *   cost: 0.25,
 *   gasReimbursed: 0.01
 * }
 */

// ============ ENVIRONMENT VARIABLES ============
const LOTTERY_CONTRACT_ADDRESS = process.env.LOTTERY_CONTRACT_ADDRESS_GASLESS!;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

// Validate environment
if (!LOTTERY_CONTRACT_ADDRESS) {
  throw new Error('LOTTERY_CONTRACT_ADDRESS_GASLESS not set');
}
if (!RELAYER_PRIVATE_KEY) {
  throw new Error('RELAYER_PRIVATE_KEY not set');
}

// ============ SMART CONTRACT ABI (only buyTicketGasless function) ============
const LOTTERY_ABI = [
  'function buyTicketGasless(address buyer, uint8[5] calldata numbers, uint8 powerNumber, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable',
  'function nonces(address user) external view returns (uint256)',
  'function TICKET_PRICE() external view returns (uint256)',
  'event TicketPurchased(uint256 indexed ticketId, address indexed buyer, uint8[5] numbers, uint8 powerNumber, uint256 dailyDrawId, uint256 weeklyDrawId, uint256 timestamp)',
  'event GasReimbursed(address indexed relayer, uint256 amount)',
];

// ============ CONSTANTS ============
const PLATFORM_FEE_PERCENT = 24; // 24% platform fee (gasless model)
const DAILY_PERCENT = 30; // 30% of prize pool goes to daily
const WEEKLY_PERCENT = 70; // 70% of prize pool goes to weekly
const BTC_PERCENT = 70; // 70% BTC
const ETH_PERCENT = 25; // 25% ETH
const TOKEN_PERCENT = 5; // 5% Token of Month
const GAS_REIMBURSEMENT_PERCENT = 4; // 4% gas reimbursement

/**
 * Main gasless ticket purchase handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(GaslessTicketPurchaseSchema, body);

    if (!validation.success) {
      logger.warn('Gasless purchase validation failed', {
        errors: formatZodError(validation.error),
      });
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { buyer, numbers, powerNumber, nonce, deadline, v, r, s } = validation.data;

    logger.info('Gasless purchase initiated', {
      buyer,
      numbers,
      powerNumber,
      nonce,
      deadline,
    });

    // 2. Rate limiting (FIX MEDIA #6)
    // Protect against DoS attacks by limiting requests per user
    if (isRedisConfigured()) {
      const { success, limit, remaining, reset } = await checkGaslessRateLimit(buyer);

      if (!success) {
        logger.warn('Rate limit exceeded', {
          buyer,
          limit,
          remaining,
          resetAt: new Date(reset).toISOString(),
        });

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Maximum ${limit} requests per minute.`,
            retryAfter: new Date(reset).toISOString(),
            remaining: 0,
          },
          { status: 429 }
        );
      }

      logger.info('Rate limit check passed', {
        buyer,
        remaining,
        resetAt: new Date(reset).toISOString(),
      });
    } else {
      logger.warn('Redis not configured - rate limiting disabled');
    }

    // 3. Distributed lock (FIX MEDIA #4)
    // Prevent race conditions on nonce validation
    const lockKey = `nonce-lock:${buyer.toLowerCase()}`;
    const lock = isRedisConfigured()
      ? await acquireLock(lockKey, { ttl: 30 })
      : { acquired: true, release: async () => {} };

    if (!lock.acquired) {
      logger.warn('Failed to acquire lock - purchase already in progress', {
        buyer,
        lockKey,
      });

      return NextResponse.json(
        {
          error: 'Purchase in progress',
          message: 'Another purchase is being processed for this address. Please wait.',
        },
        { status: 429 }
      );
    }

    logger.info('Lock acquired', { buyer, lockKey });

    try {
      // 4. Setup ethers provider and relayer wallet
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const lotteryContract = new ethers.Contract(
      LOTTERY_CONTRACT_ADDRESS,
      LOTTERY_ABI,
      relayerWallet
    );

    // 3. Get ticket price and verify nonce on-chain
    const [ticketPrice, onChainNonce] = await Promise.all([
      lotteryContract.TICKET_PRICE(),
      lotteryContract.nonces(buyer),
    ]);

    // Validate nonce matches on-chain
    if (BigInt(nonce) !== onChainNonce) {
      logger.error('Nonce mismatch', {
        providedNonce: nonce,
        onChainNonce: onChainNonce.toString(),
        buyer,
      });
      return NextResponse.json(
        {
          error: 'Invalid nonce',
          message: `Expected nonce ${onChainNonce.toString()}, got ${nonce}`,
        },
        { status: 400 }
      );
    }

    // 4. Execute gasless ticket purchase on-chain (ONE TICKET ONLY)
    logger.info('Executing gasless TX', {
      buyer,
      numbers,
      powerNumber,
      nonce: nonce.toString(),
    });

    let ticketId: number | null = null;
    let txHash: string | null = null;
    let gasReimbursed = BigInt(0);

    try {
      // FIX BAJA #7: Dynamic gas estimation with 20% buffer
      let gasLimit: bigint;
      try {
        const estimatedGas = await lotteryContract.buyTicketGasless.estimateGas(
          buyer,
          numbers as [number, number, number, number, number],
          powerNumber,
          deadline,
          v,
          r,
          s,
          { value: ticketPrice }
        );

        // Add 20% buffer to estimated gas
        gasLimit = (estimatedGas * 120n) / 100n;

        logger.info('Gas estimation completed', {
          estimatedGas: estimatedGas.toString(),
          gasLimitWithBuffer: gasLimit.toString(),
          buyer,
        });
      } catch (estimateError: any) {
        // Fallback to safe default if estimation fails
        gasLimit = 500000n;
        logger.warn('Gas estimation failed, using fallback', {
          error: estimateError.message,
          fallbackGasLimit: gasLimit.toString(),
          buyer,
        });
      }

      // Execute buyTicketGasless on-chain
      const tx = await lotteryContract.buyTicketGasless(
        buyer,
        numbers as [number, number, number, number, number],
        powerNumber,
        deadline,
        v,
        r,
        s,
        {
          value: ticketPrice,
          gasLimit: gasLimit, // ✅ Dynamic gas estimation
        }
      );

      logger.info('TX sent to blockchain', {
        txHash: tx.hash,
        buyer,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed on-chain');
      }

      logger.info('TX confirmed', {
        txHash: receipt.hash,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      });

      txHash = receipt.hash;

      // Parse events to get ticket ID
      const ticketPurchasedEvent = receipt.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id('TicketPurchased(uint256,address,uint8[5],uint8,uint256,uint256,uint256)')
      );

      if (ticketPurchasedEvent) {
        ticketId = parseInt(ticketPurchasedEvent.topics[1], 16);
      }

      // Parse GasReimbursed event
      const gasReimbursedEvent = receipt.logs.find(
        (log: any) => log.topics[0] === ethers.id('GasReimbursed(address,uint256)')
      );

      if (gasReimbursedEvent) {
        gasReimbursed = BigInt(gasReimbursedEvent.data);
      }
    } catch (txError: any) {
      logger.error('On-chain TX execution failed', {
        error: txError.message,
        buyer,
        code: txError.code,
        reason: txError.reason,
      });

      return NextResponse.json(
        {
          error: 'Transaction execution failed',
          message: txError.reason || txError.message,
        },
        { status: 500 }
      );
    }

    // Verify ticket was created
    if (!ticketId || !txHash) {
      logger.error('Ticket ID or TX hash not found in events');
      return NextResponse.json(
        { error: 'Failed to parse transaction events' },
        { status: 500 }
      );
    }

    // 5. Get draw IDs from contract events or database
    const purchaseTime = new Date().toISOString();
    const { data: dailyDrawInfoRaw, error: dailyError } = await supabase.rpc(
      'get_next_daily_draw_info',
      { purchase_time: purchaseTime }
    );

    const { data: weeklyDrawInfoRaw, error: weeklyError } = await supabase.rpc(
      'get_next_weekly_draw_info',
      { purchase_time: purchaseTime }
    );

    if (dailyError || weeklyError) {
      logger.error('Failed to get draw IDs', { dailyError, weeklyError });
      return NextResponse.json(
        { error: 'Failed to get draw IDs' },
        { status: 500 }
      );
    }

    const dailyDrawInfo =
      typeof dailyDrawInfoRaw === 'string'
        ? JSON.parse(dailyDrawInfoRaw)
        : dailyDrawInfoRaw;
    const weeklyDrawInfo =
      typeof weeklyDrawInfoRaw === 'string'
        ? JSON.parse(weeklyDrawInfoRaw)
        : weeklyDrawInfoRaw;

    const dailyId = dailyDrawInfo.id;
    const dailyDrawId = dailyDrawInfo.draw_id;
    const weeklyId = weeklyDrawInfo.id;
    const weeklyDrawId = weeklyDrawInfo.draw_id;

    // 6. Insert ticket into database (buyer is owner, NOT relayer)
    const TICKET_PRICE_USD = 0.25;
    const ticketToInsert = {
      ticket_id: ticketId,
      draw_id: weeklyDrawId,
      wallet_address: buyer, // BUYER is owner ✅
      numbers: numbers,
      power_number: powerNumber,
      price_paid: TICKET_PRICE_USD,
      claim_status: 'pending',
      prize_amount: 0,
      assigned_daily_draw_id: dailyId,
      assigned_weekly_draw_id: weeklyId,
      daily_processed: false,
      weekly_processed: false,
      // Gasless metadata
      is_gasless: true,
      tx_hash: txHash,
      relayer_address: relayerWallet.address,
    };

    const { error: ticketError } = await supabase.from('tickets').insert(ticketToInsert);

    if (ticketError) {
      logger.error('Ticket DB insertion failed', {
        error: ticketError.message,
        code: ticketError.code,
        ticketId,
      });
      // Note: Ticket is already on-chain, so we log error but don't fail request
    }

    // 7. Update prize pools (same as regular purchase)
    const { data: currentDraw } = await supabase
      .from('draws')
      .select('month_token')
      .eq('id', weeklyId)
      .single();

    const tokenSymbol = currentDraw?.month_token || 'MATIC';

    try {
      const [btcPrice, ethPrice, tokenPrice] = await Promise.all([
        priceCache.get('BTC', () => fetchPriceFromCoinGecko('BTC')),
        priceCache.get('ETH', () => fetchPriceFromCoinGecko('ETH')),
        priceCache.get(tokenSymbol, () => fetchPriceFromCoinGecko(tokenSymbol)),
      ]);

      await supabase.rpc('update_dual_draw_prize_pools', {
        p_daily_draw_id: dailyId,
        p_weekly_draw_id: weeklyId,
        p_ticket_price: TICKET_PRICE_USD,
        p_platform_fee_percent: PLATFORM_FEE_PERCENT,
        p_daily_percent: DAILY_PERCENT,
        p_weekly_percent: WEEKLY_PERCENT,
        p_btc_percent: BTC_PERCENT,
        p_eth_percent: ETH_PERCENT,
        p_token_percent: TOKEN_PERCENT,
        p_btc_price: btcPrice,
        p_eth_price: ethPrice,
        p_token_price: tokenPrice,
      });
    } catch (prizeError) {
      logger.error('Prize pool update failed', {
        error: prizeError instanceof Error ? prizeError.message : 'Unknown',
      });
    }

    // 8. Calculate costs
    const gasReimbursedUSD =
      parseFloat(ethers.formatEther(gasReimbursed)) * 6400; // Rough ETH price
    const executionTime = Date.now() - startTime;

    logger.info('Gasless purchase completed successfully', {
      buyer,
      ticketId,
      txHash,
      cost: TICKET_PRICE_USD,
      gasReimbursedUSD,
      executionTimeMs: executionTime,
    });

    // 9. Return success response
    return NextResponse.json({
      success: true,
      buyer,
      ticketId,
      cost: TICKET_PRICE_USD,
      txHash,
      gasReimbursed: ethers.formatEther(gasReimbursed),
      dailyDrawId,
      weeklyDrawId,
      message: 'Successfully purchased ticket gasless! No gas fees paid by user.',
      executionTimeMs: executionTime,
    });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Gasless purchase failed (within lock)', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: executionTime,
      });

      return NextResponse.json(
        {
          error: 'Gasless purchase failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    } finally {
      // Release distributed lock
      await lock.release();
      logger.info('Lock released', { buyer });
    }
  } catch (error) {
    // Outer catch for errors before lock acquisition
    const executionTime = Date.now() - startTime;
    logger.error('Gasless purchase failed (before lock)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      executionTimeMs: executionTime,
    });

    return NextResponse.json(
      {
        error: 'Gasless purchase failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
