import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { logger } from '@/lib/logging/logger';
import { requireCronAuth } from '@/lib/security/cron';
import { supabase } from '@/lib/supabase';

/**
 * CRON JOB: CLAIM GAS REIMBURSEMENT
 *
 * Ejecuta: CADA HORA (recomendado: 0 * * * *)
 *
 * Propósito:
 * - Reclama el gas reimbursement acumulado del relayer
 * - Evita que pendingReimbursements crezca indefinidamente
 * - Mantiene el balance del relayer saludable para operaciones gasless
 *
 * Contexto (Post-Auditoría de Seguridad):
 * - El smart contract cambió de "push pattern" a "pull pattern" para gas reimbursement
 * - Esto previene DoS attacks de relayers maliciosos con fallback infinito
 * - Ahora el reimbursement se ACUMULA on-chain (pendingReimbursements mapping)
 * - Este cron job ejecuta claimGasReimbursement() periódicamente
 *
 * Flujo:
 * 1. Verificar autenticación del CRON (multi-layer security)
 * 2. Conectar a smart contract con relayer wallet
 * 3. Verificar pendingReimbursements[relayer] on-chain
 * 4. Si pending > threshold (default: 0.01 ETH):
 *    a. Ejecutar claimGasReimbursement() on-chain
 *    b. Esperar confirmación de TX
 *    c. Loggear claim exitoso
 * 5. Si pending < threshold:
 *    a. Skip claim (evitar gas fees innecesarios)
 *    b. Loggear pending amount
 * 6. Guardar métricas en database (opcional)
 *
 * Schedule (vercel.json):
 * "0 * * * *" - Cada hora en punto
 *
 * Variables de Entorno Requeridas:
 * - LOTTERY_CONTRACT_ADDRESS_GASLESS: Address del smart contract
 * - RELAYER_PRIVATE_KEY: Private key del relayer wallet
 * - BASE_RPC_URL: RPC endpoint de Base L2
 * - CRON_SECRET: Bearer token para autenticación
 * - GAS_REIMBURSEMENT_THRESHOLD (opcional): Umbral mínimo para claim (default: 0.01 ETH)
 */

// ============ ENVIRONMENT VARIABLES ============
const LOTTERY_CONTRACT_ADDRESS = process.env.LOTTERY_CONTRACT_ADDRESS_GASLESS!;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const BASE_RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

// Threshold mínimo para ejecutar claim (evitar gas fees innecesarios en amounts pequeños)
// Default: 0.01 ETH (~$16 @ $1600/ETH)
const GAS_REIMBURSEMENT_THRESHOLD = ethers.parseEther(
  process.env.GAS_REIMBURSEMENT_THRESHOLD || '0.01'
);

// Validate critical environment variables (moved to runtime)
// if (!LOTTERY_CONTRACT_ADDRESS) {
//   throw new Error('LOTTERY_CONTRACT_ADDRESS_GASLESS not set');
// }
// if (!RELAYER_PRIVATE_KEY) {
//   throw new Error('RELAYER_PRIVATE_KEY not set');
// }

// ============ SMART CONTRACT ABI ============
const LOTTERY_ABI = [
  // View function: Check pending reimbursements
  'function pendingReimbursements(address relayer) external view returns (uint256)',
  // State-changing function: Claim accumulated reimbursements
  'function claimGasReimbursement() external',
  // Event emitted when claim succeeds
  'event GasReimbursementClaimed(address indexed relayer, uint256 amount)',
];

/**
 * Main CRON handler
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ============================================
    // STEP 1: AUTHENTICATE CRON REQUEST
    // ============================================
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    logger.info('Starting claim-gas-reimbursement job', {
      jobType: 'claim-gas-reimbursement',
      threshold: ethers.formatEther(GAS_REIMBURSEMENT_THRESHOLD),
    });

    // ============================================
    // STEP 2: SETUP ETHERS PROVIDER & WALLET
    // ============================================
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const lotteryContract = new ethers.Contract(
      LOTTERY_CONTRACT_ADDRESS,
      LOTTERY_ABI,
      relayerWallet
    );

    logger.info('Connected to blockchain', {
      relayerAddress: relayerWallet.address,
      contractAddress: LOTTERY_CONTRACT_ADDRESS,
      network: 'Base L2',
    });

    // ============================================
    // STEP 3: CHECK PENDING REIMBURSEMENTS ON-CHAIN
    // ============================================
    let pendingReimbursements: bigint;
    try {
      pendingReimbursements = await lotteryContract.pendingReimbursements(
        relayerWallet.address
      );

      logger.info('Pending reimbursements fetched', {
        pendingETH: ethers.formatEther(pendingReimbursements),
        pendingWei: pendingReimbursements.toString(),
        thresholdETH: ethers.formatEther(GAS_REIMBURSEMENT_THRESHOLD),
      });
    } catch (error: any) {
      logger.error('Failed to fetch pending reimbursements', {
        error: error.message,
        code: error.code,
        relayerAddress: relayerWallet.address,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch pending reimbursements',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // ============================================
    // STEP 4: DECIDE IF CLAIM IS WORTH IT
    // ============================================
    if (pendingReimbursements < GAS_REIMBURSEMENT_THRESHOLD) {
      const executionTime = Date.now() - startTime;

      logger.info('Skipping claim - below threshold', {
        pendingETH: ethers.formatEther(pendingReimbursements),
        thresholdETH: ethers.formatEther(GAS_REIMBURSEMENT_THRESHOLD),
        message: 'Will claim when threshold is reached',
        executionTimeMs: executionTime,
      });

      return NextResponse.json({
        success: true,
        claimed: false,
        pendingETH: ethers.formatEther(pendingReimbursements),
        thresholdETH: ethers.formatEther(GAS_REIMBURSEMENT_THRESHOLD),
        message: 'Below threshold, skipping claim to save gas',
        executionTimeMs: executionTime,
      });
    }

    // ============================================
    // STEP 5: GET RELAYER BALANCE (for logging)
    // ============================================
    const balanceBeforeClaim = await provider.getBalance(relayerWallet.address);

    logger.info('Relayer balance before claim', {
      balanceETH: ethers.formatEther(balanceBeforeClaim),
      balanceWei: balanceBeforeClaim.toString(),
    });

    // ============================================
    // STEP 6: EXECUTE CLAIM ON-CHAIN
    // ============================================
    let txHash: string;
    let gasUsed: bigint;
    let claimedAmount: bigint;

    try {
      logger.info('Executing claimGasReimbursement() on-chain', {
        pendingETH: ethers.formatEther(pendingReimbursements),
      });

      // Execute claim transaction
      const tx = await lotteryContract.claimGasReimbursement();

      logger.info('TX sent to blockchain', {
        txHash: tx.hash,
        from: relayerWallet.address,
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
        status: receipt.status,
      });

      txHash = receipt.hash;
      gasUsed = receipt.gasUsed;

      // Parse GasReimbursementClaimed event to get exact amount claimed
      const claimEvent = receipt.logs.find(
        (log: any) =>
          log.topics[0] === ethers.id('GasReimbursementClaimed(address,uint256)')
      );

      if (claimEvent) {
        claimedAmount = BigInt(claimEvent.data);
      } else {
        // Fallback: use pending amount from before claim
        claimedAmount = pendingReimbursements;
      }

      logger.info('Gas reimbursement claimed successfully', {
        claimedETH: ethers.formatEther(claimedAmount),
        claimedWei: claimedAmount.toString(),
        txHash,
        gasUsedWei: gasUsed.toString(),
      });
    } catch (txError: any) {
      logger.error('Failed to execute claim transaction', {
        error: txError.message,
        code: txError.code,
        reason: txError.reason,
        relayerAddress: relayerWallet.address,
      });

      return NextResponse.json(
        {
          error: 'Failed to claim gas reimbursement',
          message: txError.reason || txError.message,
        },
        { status: 500 }
      );
    }

    // ============================================
    // STEP 7: VERIFY BALANCE INCREASED
    // ============================================
    const balanceAfterClaim = await provider.getBalance(relayerWallet.address);
    const netGain = balanceAfterClaim - balanceBeforeClaim;

    logger.info('Relayer balance after claim', {
      balanceBeforeETH: ethers.formatEther(balanceBeforeClaim),
      balanceAfterETH: ethers.formatEther(balanceAfterClaim),
      netGainETH: ethers.formatEther(netGain),
      claimedETH: ethers.formatEther(claimedAmount),
      gasUsedETH: ethers.formatEther(gasUsed * BigInt(1e9)), // Approximate gas cost
    });

    // ============================================
    // STEP 8: LOG METRICS TO DATABASE (Optional)
    // ============================================
    try {
      await supabase.from('gas_reimbursement_claims').insert({
        relayer_address: relayerWallet.address,
        claimed_amount_wei: claimedAmount.toString(),
        claimed_amount_eth: ethers.formatEther(claimedAmount),
        tx_hash: txHash,
        gas_used: gasUsed.toString(),
        balance_before_wei: balanceBeforeClaim.toString(),
        balance_after_wei: balanceAfterClaim.toString(),
        net_gain_wei: netGain.toString(),
        block_number: await provider.getBlockNumber(),
        claimed_at: new Date().toISOString(),
      });

      logger.info('Metrics logged to database');
    } catch (dbError) {
      // Non-critical error, just log it
      logger.warn('Failed to log metrics to database', {
        error: dbError instanceof Error ? dbError.message : 'Unknown',
      });
    }

    // ============================================
    // STEP 9: RETURN SUCCESS RESPONSE
    // ============================================
    const executionTime = Date.now() - startTime;

    logger.info('Claim gas reimbursement completed successfully', {
      claimedETH: ethers.formatEther(claimedAmount),
      txHash,
      executionTimeMs: executionTime,
    });

    return NextResponse.json({
      success: true,
      claimed: true,
      claimedETH: ethers.formatEther(claimedAmount),
      claimedWei: claimedAmount.toString(),
      txHash,
      gasUsed: gasUsed.toString(),
      netGainETH: ethers.formatEther(netGain),
      balanceAfterETH: ethers.formatEther(balanceAfterClaim),
      executionTimeMs: executionTime,
      message: 'Successfully claimed gas reimbursement',
    });
  } catch (error) {
    // Outer catch for unexpected errors
    const executionTime = Date.now() - startTime;

    logger.error('Claim gas reimbursement job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      executionTimeMs: executionTime,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
