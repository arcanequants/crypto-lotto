import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { requireCronAuth } from '@/lib/security/cron';

// Force dynamic rendering - prevents Next.js from caching this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * CRON JOB: Execute Hourly Draw (STEP 2 of 2-step process)
 *
 * NEW BLOCKHASH SYSTEM - Commit-Reveal Pattern
 *
 * This endpoint should be called ~5 minutes after close-hourly-draw
 * STEP 1: close-hourly-draw (commit to future blocks)
 * STEP 2: execute-hourly-draw (reveal using 5 blockhashes) ← THIS
 *
 * What it does:
 * 1. Verifies sales are closed (salesClosed = true)
 * 2. Verifies waited 5 blocks after revealBlock
 * 3. Verifies not too late (< 250 blocks from revealBlock)
 * 4. Calls executeHourlyDraw() on contract
 * 5. Uses 5 consecutive blockhashes for randomness
 *
 * Security:
 * - Blockhash commit-reveal pattern
 * - 5 consecutive blockhashes (not 1)
 * - SmartBillions attack prevention
 * - All hashes verified != 0x00
 * - Requires CRON_SECRET
 *
 * Setup Instructions:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/execute-hourly-draw",
 *        "schedule": "5 * * * *"
 *      }]
 *    }
 *
 * 2. Or use cron-job.org:
 *    - URL: https://your-domain.com/api/cron/execute-hourly-draw
 *    - Schedule: Every hour at minute 5 (5 * * * *)
 *    - Add header: Authorization: Bearer YOUR_CRON_SECRET
 */

const LOTTERY_ABI = [
  {
    name: 'executeHourlyDraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'currentHourlyDrawId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getHourlyDraw',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'drawId', type: 'uint256' }],
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'executed', type: 'bool' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'totalWinners', type: 'uint256' },
      { name: 'btcPrizeSnapshot', type: 'uint256' },
      { name: 'ethPrizeSnapshot', type: 'uint256' },
      { name: 'usdcPrizeSnapshot', type: 'uint256' },
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

    console.log('⏰ CRON JOB: Execute Hourly Draw (STEP 2) - Starting...');

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
      functionName: 'currentHourlyDrawId'
    });

    const draw = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'getHourlyDraw',
      args: [currentDrawId]
    });

    // Destructure draw tuple with ALL 13 fields in correct order
    const [drawId, drawTime, winningNumber, executed, totalTickets, winner, totalWinners, btcPrizeSnapshot, ethPrizeSnapshot, usdcPrizeSnapshot, commitBlock, revealBlock, salesClosed] = draw;

    const currentBlock = await publicClient.getBlockNumber();

    console.log('📊 Current Hourly Draw Status:');
    console.log(`  - Draw ID: ${currentDrawId}`);
    console.log(`  - Draw Time: ${drawTime > BigInt(0) ? new Date(Number(drawTime) * 1000).toISOString() : 'NOT SET'}`);
    console.log(`  - Total Tickets: ${totalTickets || BigInt(0)}`);
    console.log(`  - Sales Closed: ${salesClosed}`);
    console.log(`  - Executed: ${executed}`);
    console.log(`  - Commit Block: ${commitBlock}`);
    console.log(`  - Reveal Block: ${revealBlock}`);
    console.log(`  - Current Block: ${currentBlock}`);

    // 6. Check if draw already executed
    if (executed || winningNumber > 0) {
      console.log('✅ Draw already executed - nothing to do');
      return NextResponse.json({
        success: true,
        message: 'Draw already executed',
        drawId: Number(currentDrawId),
        executed: true,
        winningNumber: Number(winningNumber),
        totalTickets: Number(totalTickets || BigInt(0))
      });
    }

    // 7. Check if sales are closed (STEP 1 must be done first)
    if (!salesClosed) {
      console.log('⚠️ Sales not closed yet - need to call close-hourly-draw first (STEP 1)');
      return NextResponse.json({
        success: false,
        message: 'Sales not closed - call close-hourly-draw first (STEP 1)',
        drawId: Number(currentDrawId),
        salesClosed: false,
        hint: 'Run /api/cron/close-hourly-draw first'
      }, { status: 400 });
    }

    // 8. Check if revealBlock is set
    if (revealBlock === BigInt(0)) {
      console.log('⚠️ Reveal block not set - draw was not properly closed');
      return NextResponse.json({
        success: false,
        message: 'Reveal block not set - draw not properly closed',
        drawId: Number(currentDrawId)
      }, { status: 400 });
    }

    // 9. Check if we've waited enough blocks (revealBlock + 5)
    const minExecutionBlock = revealBlock + BigInt(5);
    if (currentBlock < minExecutionBlock) {
      const blocksRemaining = Number(minExecutionBlock - currentBlock);
      const secondsRemaining = blocksRemaining * 2; // ~2 seconds per block on BASE

      console.log(`⏳ Too early - must wait ${blocksRemaining} more blocks (~${secondsRemaining}s)`);
      return NextResponse.json({
        success: false,
        message: 'Too early - must wait 5 blocks after reveal block',
        drawId: Number(currentDrawId),
        currentBlock: Number(currentBlock),
        minExecutionBlock: Number(minExecutionBlock),
        blocksRemaining,
        secondsRemaining,
        hint: 'Wait a few more minutes and try again'
      }, { status: 400 });
    }

    // 10. Check if not too late (SmartBillions protection - within 250 blocks)
    const maxExecutionBlock = revealBlock + BigInt(250);
    if (currentBlock > maxExecutionBlock) {
      console.log(`❌ TOO LATE - exceeded 250 block limit (SmartBillions protection)`);
      console.log(`  - Reveal Block: ${revealBlock}`);
      console.log(`  - Max Execution Block: ${maxExecutionBlock}`);
      console.log(`  - Current Block: ${currentBlock}`);
      console.log(`  - Blocks over limit: ${currentBlock - maxExecutionBlock}`);

      return NextResponse.json({
        success: false,
        error: 'Too late - exceeded 250 block limit',
        drawId: Number(currentDrawId),
        revealBlock: Number(revealBlock),
        currentBlock: Number(currentBlock),
        maxExecutionBlock: Number(maxExecutionBlock),
        blocksOverLimit: Number(currentBlock - maxExecutionBlock),
        hint: 'Draw cannot be executed - blockhashes no longer available. May need manual intervention.'
      }, { status: 400 });
    }

    // 11. All checks passed - execute draw
    console.log('🎲 Executing hourly draw (reveal phase with 5 blockhashes)...');
    console.log(`  - Reveal Block: ${revealBlock}`);
    console.log(`  - Current Block: ${currentBlock}`);
    console.log(`  - Will use blockhashes from blocks: ${revealBlock} to ${revealBlock + BigInt(4)}`);

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

    console.log(`  - Executor address: ${account.address}`);
    console.log(`  - Current nonce: ${nonce}`);

    // Call executeHourlyDraw() - uses 5 blockhashes internally
    const hash = await walletClient.writeContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'executeHourlyDraw',
      nonce,
      gas: BigInt(500000) // Higher gas limit for blockhash operations
    });

    console.log(`  - Using BLOCKHASH randomness (5 consecutive blocks) - FREE!`);
    console.log(`  - Transaction sent: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`  - Status: ${receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  - Gas used: ${receipt.gasUsed}`);

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed on-chain');
    }

    // 12. Get updated draw info
    const updatedDraw = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'getHourlyDraw',
      args: [currentDrawId]
    });

    const [, , newWinningNumber, , newTotalTickets] = updatedDraw;

    const newDrawId = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'currentHourlyDrawId'
    });

    console.log('🎉 Hourly draw executed successfully (STEP 2 complete)!');
    console.log(`  - Old Draw ID: ${currentDrawId}`);
    console.log(`  - New Draw ID: ${newDrawId}`);
    console.log(`  - Winning Number: ${newWinningNumber}`);
    console.log(`  - Total Tickets: ${newTotalTickets}`);

    return NextResponse.json({
      success: true,
      message: 'Hourly draw executed successfully (STEP 2 complete)',
      oldDrawId: Number(currentDrawId),
      newDrawId: Number(newDrawId),
      winningNumber: Number(newWinningNumber),
      totalTickets: Number(newTotalTickets),
      txHash: hash,
      gasUsed: receipt.gasUsed.toString(),
      blocksUsed: `${revealBlock} to ${revealBlock + BigInt(4)}`
    });

  } catch (error: any) {
    console.error('❌ Error executing hourly draw:', error);

    // Check if it's a revert error with a specific message
    let errorMessage = error.message;
    if (error.message.includes('Too early')) {
      errorMessage = 'Too early - must wait 5 blocks after reveal block';
    } else if (error.message.includes('Too late')) {
      errorMessage = 'Too late - beyond 256 block limit (SmartBillions protection)';
    } else if (error.message.includes('Sales not closed')) {
      errorMessage = 'Sales not closed - call close-hourly-draw first';
    } else if (error.message.includes('Hash') && error.message.includes('not available')) {
      errorMessage = 'Blockhash not available - may need to retry';
    }

    return NextResponse.json(
      {
        error: 'Failed to execute hourly draw',
        details: errorMessage,
        fullError: error.message
      },
      { status: 500 }
    );
  }
}
