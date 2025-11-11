import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { requireCronAuth } from '@/lib/security/cron';

/**
 * CRON JOB: Close Daily Draw (STEP 1 of 2-step process)
 *
 * NEW BLOCKHASH SYSTEM - Commit-Reveal Pattern
 *
 * This endpoint should be called daily at 2 AM UTC by a cron service
 * STEP 1: Close sales and commit to future blocks
 * STEP 2: Wait ~5 minutes, then call execute-daily-draw
 *
 * What it does:
 * 1. Calls closeDailyDraw() on the LotteryDualCrypto contract
 * 2. Closes sales (no more ticket purchases allowed for this draw)
 * 3. Commits to future blocks (revealBlock = block.number + 25)
 * 4. Blocks don't exist yet (prevents front-running)
 *
 * Security:
 * - Commit-reveal pattern prevents manipulation
 * - Sales closed before randomness revealed
 * - Requires CRON_SECRET to prevent unauthorized calls
 *
 * Setup Instructions:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/close-daily-draw",
 *        "schedule": "0 2 * * *"
 *      }]
 *    }
 *
 * 2. Or use cron-job.org:
 *    - URL: https://your-domain.com/api/cron/close-daily-draw
 *    - Schedule: Daily at 2:00 AM UTC (0 2 * * *)
 *    - Add header: Authorization: Bearer YOUR_CRON_SECRET
 */

const LOTTERY_ABI = [
  {
    name: 'closeDailyDraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'currentDailyDrawId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getDailyDraw',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'drawId', type: 'uint256' }],
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'totalPrize', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'commitBlock', type: 'uint256' },
      { name: 'revealBlock', type: 'uint256' },
      { name: 'salesClosed', type: 'bool' }
    ]
  }
] as const;

export async function GET(request: NextRequest) {
  try {
    // 1. Verify CRON authentication
    const authResponse = requireCronAuth(request);
    if (authResponse) {
      return authResponse; // Unauthorized
    }

    console.log('⏰ CRON JOB: Close Daily Draw (STEP 1) - Starting...');

    // 2. Get contract address
    const LOTTERY_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_DUAL_CRYPTO as `0x${string}`;
    if (!LOTTERY_CONTRACT || LOTTERY_CONTRACT === '0x0000000000000000000000000000000000000000') {
      throw new Error('NEXT_PUBLIC_LOTTERY_DUAL_CRYPTO not configured');
    }

    // 3. Get Alchemy RPC URL
    const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

    // 4. Create public client
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl)
    });

    // 5. Check current draw status
    const currentDrawId = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'currentDailyDrawId'
    });

    const draw = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'getDailyDraw',
      args: [currentDrawId]
    });

    // Destructure draw tuple with new fields
    const [drawId, drawTime, winningNumber, totalTickets, totalPrize, executed, commitBlock, revealBlock, salesClosed] = draw;

    console.log('📊 Current Daily Draw Status:');
    console.log(`  - Draw ID: ${currentDrawId}`);
    console.log(`  - Draw Time: ${drawTime > BigInt(0) ? new Date(Number(drawTime) * 1000).toISOString() : 'NOT SET'}`);
    console.log(`  - Total Tickets: ${totalTickets || BigInt(0)}`);
    console.log(`  - Sales Closed: ${salesClosed}`);
    console.log(`  - Executed: ${executed}`);
    console.log(`  - Commit Block: ${commitBlock}`);
    console.log(`  - Reveal Block: ${revealBlock}`);

    // 6. Check if draw already closed
    if (salesClosed) {
      console.log('✅ Draw already closed - nothing to do');
      return NextResponse.json({
        success: true,
        message: 'Draw already closed',
        drawId: Number(currentDrawId),
        salesClosed: true,
        commitBlock: Number(commitBlock),
        revealBlock: Number(revealBlock)
      });
    }

    // Check if already executed
    if (executed) {
      console.log('✅ Draw already executed - nothing to do');
      return NextResponse.json({
        success: true,
        message: 'Draw already executed',
        drawId: Number(currentDrawId),
        executed: true,
        winningNumber: Number(winningNumber)
      });
    }

    // Check if draw time is set
    const now = Math.floor(Date.now() / 1000);
    const drawTimeNum = Number(drawTime);

    if (drawTimeNum === 0) {
      console.log('⏳ Draw time not set yet (waiting for first ticket)');
      return NextResponse.json({
        success: true,
        message: 'Draw time not set yet - waiting for first ticket purchase',
        drawId: Number(currentDrawId)
      });
    }

    // Check if it's time to close
    if (now < drawTimeNum) {
      console.log('⏰ Draw time not reached yet - waiting...');
      return NextResponse.json({
        success: true,
        message: 'Draw time not reached yet',
        drawId: Number(currentDrawId),
        drawTime: new Date(drawTimeNum * 1000).toISOString(),
        timeRemaining: drawTimeNum - now
      });
    }

    // 7. Close draw (commit phase)
    console.log('🔒 Closing daily draw (commit phase)...');

    // Get executor private key
    const EXECUTOR_PRIVATE_KEY = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY as `0x${string}`;
    if (!EXECUTOR_PRIVATE_KEY) {
      throw new Error('WITHDRAWAL_EXECUTOR_PRIVATE_KEY not configured');
    }

    const account = privateKeyToAccount(EXECUTOR_PRIVATE_KEY);

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(rpcUrl)
    });

    // Get current nonce
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });

    const currentBlock = await publicClient.getBlockNumber();

    console.log(`  - Executor address: ${account.address}`);
    console.log(`  - Current nonce: ${nonce}`);
    console.log(`  - Current block: ${currentBlock}`);
    console.log(`  - Committing to future blocks (reveal block = ${currentBlock + 25n})`);

    // Call closeDailyDraw()
    const hash = await walletClient.writeContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'closeDailyDraw',
      nonce
    });

    console.log(`  - Transaction sent: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`  - Status: ${receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  - Gas used: ${receipt.gasUsed}`);

    // 8. Get updated draw info
    const updatedDraw = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'getDailyDraw',
      args: [currentDrawId]
    });

    const [, , , , , , newCommitBlock, newRevealBlock, newSalesClosed] = updatedDraw;

    console.log('🎉 Daily draw closed successfully (STEP 1 complete)!');
    console.log(`  - Commit Block: ${newCommitBlock}`);
    console.log(`  - Reveal Block: ${newRevealBlock}`);
    console.log(`  - Sales Closed: ${newSalesClosed}`);
    console.log(`  - Next Step: Wait ~5 minutes (25 blocks), then call execute-daily-draw`);

    return NextResponse.json({
      success: true,
      message: 'Daily draw closed successfully (STEP 1 complete)',
      drawId: Number(currentDrawId),
      commitBlock: Number(newCommitBlock),
      revealBlock: Number(newRevealBlock),
      salesClosed: true,
      txHash: hash,
      gasUsed: receipt.gasUsed.toString(),
      nextStep: 'Wait ~5 minutes, then call execute-daily-draw'
    });

  } catch (error: any) {
    console.error('❌ Error closing daily draw:', error);
    return NextResponse.json(
      {
        error: 'Failed to close daily draw',
        details: error.message
      },
      { status: 500 }
    );
  }
}
