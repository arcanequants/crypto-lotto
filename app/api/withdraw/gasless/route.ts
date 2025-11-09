import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { logger } from '@/lib/logging/logger';
import { supabase } from '@/lib/supabase';
import { normalizeAddress } from '@/lib/security/address';
import { withValidation } from '@/lib/validation/middleware';
import { WithdrawSchema, type WithdrawInput } from '@/lib/validation/schemas';

// ABI del contrato GaslessWithdrawals
const GASLESS_WITHDRAWALS_ABI = [
  'function withdrawWithPermit(address token, address user, address destination, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',
  'function calculateFee(uint256 amount) external view returns (uint256)',
  'function getNetAmount(uint256 amount) external view returns (uint256)',
  'function nonces(address user) external view returns (uint256)'
];

// Direcciones (actualizar después del deploy)
const GASLESS_CONTRACT_ADDRESS = process.env.GASLESS_WITHDRAWALS_CONTRACT || '';
const EXECUTOR_PRIVATE_KEY = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY || '';

// Token addresses en BASE
const TOKEN_ADDRESSES = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'
};

/**
 * POST /api/withdraw/gasless
 *
 * Ejecuta un withdrawal gasless usando EIP-2612 permit
 * Now with Zod validation and rate limiting
 *
 * Body:
 * {
 *   token: 'USDC' | 'USDT',
 *   user: string,          // Dirección del usuario
 *   destination: string,   // Dirección destino
 *   amount: string,        // Monto en formato decimal (ej: "100.50")
 *   deadline: number,      // Timestamp de expiración
 *   v: number,            // Firma
 *   r: string,            // Firma
 *   s: string             // Firma
 * }
 */
const withdrawHandler = async (
  request: NextRequest,
  { data }: { data: WithdrawInput }
): Promise<NextResponse> => {
  try {
    const { token, user, destination, amount, deadline, v, r, s } = data;

    // Validar que el contrato esté configurado
    if (!GASLESS_CONTRACT_ADDRESS || !EXECUTOR_PRIVATE_KEY) {
      console.error('Missing environment variables for gasless withdrawals');
      return NextResponse.json(
        { error: 'Gasless withdrawals not configured' },
        { status: 500 }
      );
    }

    // Normalize user address (prevent case-sensitivity attacks)
    const normalizedUser = normalizeAddress(user);
    const normalizedDestination = normalizeAddress(destination);

    // Conectar a BASE network
    const provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );

    // Crear wallet del executor (quien paga el gas)
    const executorWallet = new ethers.Wallet(EXECUTOR_PRIVATE_KEY, provider);

    // Conectar al contrato
    const gaslessContract = new ethers.Contract(
      GASLESS_CONTRACT_ADDRESS,
      GASLESS_WITHDRAWALS_ABI,
      executorWallet
    );

    // Get token address
    const tokenAddress = TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES];

    // Parse amount (USDC/USDT tienen 6 decimales)
    const amountBigInt = ethers.parseUnits(amount, 6);

    // ============================================
    // CRITICAL FIX C-5: Nonce Replay Protection
    // ============================================
    // Get current nonce from smart contract
    const currentNonce = await gaslessContract.nonces(normalizedUser);
    const nonceNumber = Number(currentNonce);

    // Check if this nonce has already been used (atomic operation)
    const { data: nonceValid, error: nonceError } = await supabase.rpc('check_and_use_nonce', {
      p_wallet_address: normalizedUser,
      p_nonce: nonceNumber,
      p_action_type: 'withdrawal'
    });

    if (nonceError || !nonceValid) {
      logger.security('Nonce replay attack detected', {
        user: normalizedUser,
        nonce: nonceNumber,
        error: nonceError?.message,
        token,
      });

      return NextResponse.json(
        { error: 'Invalid or already used signature. Please generate a new signature.' },
        { status: 400 }
      );
    }

    logger.info('Nonce validated successfully', {
      user: normalizedUser,
      nonce: nonceNumber,
      token,
    });

    // Calcular fee y net amount (para logging)
    const fee = await gaslessContract.calculateFee(amountBigInt);
    const netAmount = await gaslessContract.getNetAmount(amountBigInt);

    logger.info('Gasless withdrawal initiated', {
      token,
      amountUSD: parseFloat(amount),
      fee: ethers.formatUnits(fee, 6),
      netAmount: ethers.formatUnits(netAmount, 6),
      // DO NOT log user/destination addresses for privacy
    });

    // Ejecutar withdrawal con permit (using normalized addresses)
    const tx = await gaslessContract.withdrawWithPermit(
      tokenAddress,
      normalizedUser,
      normalizedDestination,
      amountBigInt,
      deadline,
      v,
      r,
      s
    );

    logger.info('Withdrawal transaction sent', {
      txHash: tx.hash,
      token,
      amountUSD: parseFloat(amount),
      nonce: nonceNumber,
    });

    // Esperar confirmación
    const receipt = await tx.wait();

    // Update nonce record with transaction hash (for audit trail)
    await supabase.rpc('update_nonce_tx_hash', {
      p_wallet_address: normalizedUser,
      p_nonce: nonceNumber,
      p_tx_hash: receipt.hash,
      p_action_type: 'withdrawal'
    });

    logger.info('Withdrawal confirmed', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      token,
      amountUSD: parseFloat(amount),
      nonce: nonceNumber,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      fee: ethers.formatUnits(fee, 6),
      netAmount: ethers.formatUnits(netAmount, 6)
    });

  } catch (error: any) {
    const errorToken = (error as any).token || 'unknown';
    logger.error('Gasless withdrawal failed', {
      error: error.message || 'Unknown error',
      code: error.code,
      token: errorToken,
    });

    // Parse error message
    let errorMessage = 'Failed to execute withdrawal';

    if (error.message.includes('Permit expired')) {
      errorMessage = 'Signature expired. Please try again.';
    } else if (error.message.includes('Token not whitelisted')) {
      errorMessage = 'Token not supported for gasless withdrawals';
    } else if (error.message.includes('Amount too low')) {
      errorMessage = 'Withdrawal amount too low (minimum $1)';
    } else if (error.message.includes('Amount exceeds maximum')) {
      errorMessage = 'Withdrawal amount exceeds maximum limit';
    } else if (error.message.includes('Insufficient allowance')) {
      errorMessage = 'Invalid signature or insufficient balance';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Executor wallet has insufficient ETH for gas';
      logger.error('CRITICAL: Executor wallet needs ETH', {
        error: errorMessage,
        token: errorToken,
      });
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/withdraw/gasless?amount=100
 *
 * Calcula el fee y net amount para un withdrawal
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const amount = searchParams.get('amount');

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount parameter required' },
        { status: 400 }
      );
    }

    if (!GASLESS_CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: 'Gasless withdrawals not configured' },
        { status: 500 }
      );
    }

    // Conectar a BASE network (read-only)
    const provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );

    const gaslessContract = new ethers.Contract(
      GASLESS_CONTRACT_ADDRESS,
      GASLESS_WITHDRAWALS_ABI,
      provider
    );

    // Parse amount
    const amountBigInt = ethers.parseUnits(amount, 6);

    // Calcular fee y net amount
    const [fee, netAmount] = await Promise.all([
      gaslessContract.calculateFee(amountBigInt),
      gaslessContract.getNetAmount(amountBigInt)
    ]);

    return NextResponse.json({
      amount: amount,
      fee: ethers.formatUnits(fee, 6),
      netAmount: ethers.formatUnits(netAmount, 6),
      feePercentage: '0.1%'
    });

  } catch (error: any) {
    logger.error('Fee calculation failed', {
      error: error.message || 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to calculate fee' },
      { status: 500 }
    );
  }
}

// ============================================
// EXPORT WITH VALIDATION & RATE LIMITING
// ============================================
// C-6: Zod Validation Applied
// C-7: Rate limiting by wallet address
export const POST = withValidation(withdrawHandler, {
  schema: WithdrawSchema,
  rateLimit: {
    identifier: (req, data) => data.user,
    limit: 5, // 5 withdrawals per minute per user
    window: '1 m',
  },
});
