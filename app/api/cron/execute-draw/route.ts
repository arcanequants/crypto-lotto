import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { requireCronAuth } from '@/lib/security/cron';

/**
 * CRON JOB: Execute Draw for LotteryTestingUltraSimple
 *
 * This endpoint should be called every 30 minutes by a cron service (like Vercel Cron or cron-job.org)
 *
 * What it does:
 * 1. Calls executeDraw() on the LotteryTestingUltraSimple contract
 * 2. If no tickets were sold, the contract skips QRNG and creates next draw immediately
 * 3. If tickets were sold, the contract requests QRNG and executes normally
 *
 * Security:
 * - Requires CRON_SECRET to prevent unauthorized calls
 *
 * Setup Instructions:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/execute-draw",
 *        "schedule": "every 30 minutes"
 *      }]
 *    }
 *
 * 2. Or use cron-job.org:
 *    - URL: https://your-domain.com/api/cron/execute-draw
 *    - Schedule: Every 30 minutes
 *    - Add header: Authorization: Bearer YOUR_CRON_SECRET
 */

const LOTTERY_ABI = [
  {
    name: 'executeDraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'currentDrawId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'draws',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'totalTickets', type: 'uint256' }
    ]
  }
] as const;

export async function GET(request: NextRequest) {
  try {
    // 1. Verify CRON authentication (Vercel Cron)
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    console.log('🎯 CRON JOB: Execute Draw - Starting...');

    // 2. Get contract address
    const LOTTERY_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}`;
    if (!LOTTERY_CONTRACT || LOTTERY_CONTRACT === '0x0000000000000000000000000000000000000000') {
      throw new Error('NEXT_PUBLIC_LOTTERY_CONTRACT not configured');
    }

    // 3. Get Alchemy RPC URL
    const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const rpcUrl = ALCHEMY_API_KEY && ALCHEMY_API_KEY !== 'YOUR_ALCHEMY_API_KEY_HERE'
      ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      : undefined;

    // 4. Create public client
    const publicClient = createPublicClient({
      chain: base,
      transport: rpcUrl ? http(rpcUrl) : http()
    });

    // 5. Check current draw status
    const currentDrawId = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'currentDrawId'
    });

    const draw = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'draws',
      args: [currentDrawId]
    });

    console.log('📊 Current Draw Status:');
    console.log(`  - Draw ID: ${currentDrawId}`);
    console.log(`  - End Time: ${new Date(Number(draw[1]) * 1000).toISOString()}`);
    console.log(`  - Executed: ${draw[2]}`);
    console.log(`  - Total Tickets: ${draw[4]}`);

    // 6. Check if draw needs to be executed
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(draw[1]);
    const executed = draw[2];

    if (executed) {
      console.log('✅ Draw already executed - nothing to do');
      return NextResponse.json({
        success: true,
        message: 'Draw already executed',
        drawId: Number(currentDrawId),
        executed: true
      });
    }

    if (now < endTime) {
      console.log('⏰ Draw not ended yet - waiting...');
      return NextResponse.json({
        success: true,
        message: 'Draw not ended yet',
        drawId: Number(currentDrawId),
        endTime: new Date(endTime * 1000).toISOString(),
        timeRemaining: endTime - now
      });
    }

    // 7. Execute draw (draw has ended and not executed)
    console.log('🎲 Executing draw...');

    // Get executor private key
    const EXECUTOR_PRIVATE_KEY = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY as `0x${string}`;
    if (!EXECUTOR_PRIVATE_KEY) {
      throw new Error('WITHDRAWAL_EXECUTOR_PRIVATE_KEY not configured');
    }

    const account = privateKeyToAccount(EXECUTOR_PRIVATE_KEY);

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: rpcUrl ? http(rpcUrl) : http()
    });

    // Get current nonce to avoid "nonce too low" errors
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });

    console.log(`  - Current nonce: ${nonce}`);

    // Call executeDraw() with explicit nonce
    const hash = await walletClient.writeContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'executeDraw',
      nonce
    });

    console.log(`  - Transaction sent: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`  - Status: ${receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  - Gas used: ${receipt.gasUsed}`);

    // 8. Get new draw info
    const newDrawId = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'currentDrawId'
    });

    const newDraw = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'draws',
      args: [newDrawId]
    });

    console.log('🎉 Draw executed successfully!');
    console.log(`  - Old Draw ID: ${currentDrawId}`);
    console.log(`  - New Draw ID: ${newDrawId}`);
    console.log(`  - New End Time: ${new Date(Number(newDraw[1]) * 1000).toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Draw executed successfully',
      oldDrawId: Number(currentDrawId),
      newDrawId: Number(newDrawId),
      txHash: hash,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error: any) {
    console.error('❌ Error executing draw:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute draw',
        details: error.message
      },
      { status: 500 }
    );
  }
}
