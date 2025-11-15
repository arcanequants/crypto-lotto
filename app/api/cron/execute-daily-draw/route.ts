import { NextRequest, NextResponse } from 'next/server';
import { requireCronAuth } from '@/lib/security/cron';
import lotteryContract from '@/lib/contracts/lottery-contract';
import { withCronMonitoring } from '@/lib/services/cron-monitoring-service';

/**
 * CRON JOB: Execute Daily Draw (STEP 2 of 2-step process)
 *
 * NEW BLOCKHASH SYSTEM - Commit-Reveal Pattern
 *
 * This endpoint should be called ~5 minutes after close-daily-draw
 * STEP 1: close-daily-draw (commit to future blocks)
 * STEP 2: execute-daily-draw (reveal using 5 blockhashes) ← THIS
 *
 * What it does:
 * 1. Verifies sales are closed (salesClosed = true)
 * 2. Verifies waited 5 blocks after revealBlock
 * 3. Verifies not too late (< 250 blocks from revealBlock)
 * 4. Calls executeDailyDraw() on contract
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
 *        "path": "/api/cron/execute-daily-draw",
 *        "schedule": "5 2 * * *"
 *      }]
 *    }
 *
 * 2. Or use cron-job.org:
 *    - URL: https://your-domain.com/api/cron/execute-daily-draw
 *    - Schedule: Daily at 2:05 AM (5 2 * * *)
 *    - Add header: Authorization: Bearer YOUR_CRON_SECRET
 */

export async function GET(request: NextRequest) {
  // 1. Verify CRON authentication FIRST
  const authResponse = requireCronAuth(request);
  if (authResponse) {
    return authResponse; // Unauthorized
  }

  // 2. Wrap entire execution in monitoring
  return withCronMonitoring('execute-daily-draw', async () => {
    try {
      console.log('⏰ CRON JOB: Execute Daily Draw (STEP 2) - Starting...');
      console.log('📋 Using centralized contract config:', lotteryContract.info);

    // 2. Create clients using centralized config
    const publicClient = lotteryContract.createPublicClient();
    const walletClient = lotteryContract.createWalletClient();

    // 3. Check current draw status (using helper function)
    const currentDrawId = await lotteryContract.read('currentDailyDrawId') as bigint;
    const drawData = await lotteryContract.getDailyDraw(currentDrawId);

    // Extract fields (helper function already handles array/object format)
    const {
      drawId,
      drawTime,
      winningNumber,
      executed,
      totalTickets,
      commitBlock,
      revealBlock,
      salesClosed
    } = drawData;

    const currentBlock = await publicClient.getBlockNumber();

    console.log('📊 Current Daily Draw Status:');
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
      console.log('⚠️ Sales not closed yet - need to call close-daily-draw first (STEP 1)');
      return NextResponse.json({
        success: false,
        message: 'Sales not closed - call close-daily-draw first (STEP 1)',
        drawId: Number(currentDrawId),
        salesClosed: false,
        hint: 'Run /api/cron/close-daily-draw first'
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
    // NOTE: We let the contract handle auto-skip logic instead of blocking here
    const maxExecutionBlock = revealBlock + BigInt(250);
    if (currentBlock > maxExecutionBlock) {
      console.log(`⚠️ TOO LATE - exceeded 250 block limit, but attempting anyway for auto-skip`);
      console.log(`  - Reveal Block: ${revealBlock}`);
      console.log(`  - Max Execution Block: ${maxExecutionBlock}`);
      console.log(`  - Current Block: ${currentBlock}`);
      console.log(`  - Blocks over limit: ${currentBlock - maxExecutionBlock}`);
      console.log(`  - Contract should auto-skip this draw and move to next one`);

      // DON'T return error - let contract handle auto-skip
      // The contract v2.1.0 has auto-skip logic that will:
      // 1. Detect draw is too late
      // 2. Skip it and advance to next draw ID
      // 3. Return success without executing random number generation
    }

    // 11. All checks passed - execute draw
    console.log('🎲 Executing daily draw (reveal phase with 5 blockhashes)...');
    console.log(`  - Reveal Block: ${revealBlock}`);
    console.log(`  - Current Block: ${currentBlock}`);
    console.log(`  - Will use blockhashes from blocks: ${revealBlock} to ${revealBlock + BigInt(4)}`);

    // Execute draw using centralized helper
    const { hash, receipt, success } = await lotteryContract.write('executeDailyDraw', [], {
      gas: BigInt(500000) // Higher gas limit for blockhash operations
    });

    console.log(`  - Using BLOCKHASH randomness (5 consecutive blocks) - FREE!`);
    console.log(`  - Transaction sent: ${hash}`);
    console.log(`  - Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  - Gas used: ${receipt.gasUsed}`);

    if (!success) {
      throw new Error('Transaction failed on-chain');
    }

    // 12. Get updated draw info
    const updatedDrawData = await lotteryContract.getDailyDraw(currentDrawId);
    const newDrawId = await lotteryContract.read('currentDailyDrawId') as bigint;

    console.log('🎉 Daily draw executed successfully (STEP 2 complete)!');
    console.log(`  - Old Draw ID: ${currentDrawId}`);
    console.log(`  - New Draw ID: ${newDrawId}`);
    console.log(`  - Winning Number: ${updatedDrawData.winningNumber}`);
    console.log(`  - Total Tickets: ${updatedDrawData.totalTickets}`);

      return NextResponse.json({
        success: true,
        message: 'Daily draw executed successfully (STEP 2 complete)',
        oldDrawId: Number(currentDrawId),
        newDrawId: Number(newDrawId),
        winningNumber: Number(updatedDrawData.winningNumber),
        totalTickets: Number(updatedDrawData.totalTickets),
        txHash: hash,
        gasUsed: receipt.gasUsed.toString(),
        blocksUsed: `${revealBlock} to ${revealBlock + BigInt(4)}`
      });

    } catch (error: any) {
      console.error('❌ Error executing daily draw:', error);

      // Check if it's a revert error with a specific message
      let errorMessage = error.message;
      if (error.message.includes('Too early')) {
        errorMessage = 'Too early - must wait 5 blocks after reveal block';
      } else if (error.message.includes('Too late')) {
        errorMessage = 'Too late - beyond 256 block limit (SmartBillions protection)';
      } else if (error.message.includes('Sales not closed')) {
        errorMessage = 'Sales not closed - call close-daily-draw first';
      } else if (error.message.includes('Hash') && error.message.includes('not available')) {
        errorMessage = 'Blockhash not available - may need to retry';
      }

      return NextResponse.json(
        {
          error: 'Failed to execute daily draw',
          details: errorMessage,
          fullError: error.message
        },
        { status: 500 }
      );
    }
  });
}
