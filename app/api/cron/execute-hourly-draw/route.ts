import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { requireCronAuth } from '@/lib/security/cron';

/**
 * CRON JOB: Execute Hourly Draw for LotteryDualCrypto
 *
 * This endpoint should be called every hour by a cron service (like Vercel Cron or cron-job.org)
 *
 * What it does:
 * 1. Calls executeHourlyDraw() on the LotteryDualCrypto contract
 * 2. Requests QRNG from API3 and executes the draw
 *
 * Security:
 * - Requires CRON_SECRET to prevent unauthorized calls
 *
 * Setup Instructions:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/execute-hourly-draw",
 *        "schedule": "0 * * * *"
 *      }]
 *    }
 *
 * 2. Or use cron-job.org:
 *    - URL: https://your-domain.com/api/cron/execute-hourly-draw
 *    - Schedule: Every hour at minute 0 (0 * * * *)
 *    - Add header: Authorization: Bearer YOUR_CRON_SECRET
 */

const LOTTERY_ABI = [
  {
    name: 'executeHourlyDraw',
    type: 'function',
    stateMutability: 'payable',
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
      { name: 'cbBTCPrize', type: 'uint256' },
      { name: 'wethPrize', type: 'uint256' },
      { name: 'usdcPrize', type: 'uint256' }
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

    console.log('⏰ CRON JOB: Execute Hourly Draw - Starting...');

    // 2. Get contract address - USE LOTTERY_DUAL_CRYPTO (latest deployment)
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

    // Destructure draw tuple: [drawId, drawTime, winningNumber, executed, totalTickets, cbBTCPrize, wethPrize, usdcPrize]
    const [drawId, drawTime, winningNumber, executed, totalTickets, cbBTCPrize, wethPrize, usdcPrize] = draw;

    console.log('📊 Current Hourly Draw Status:');
    console.log(`  - Draw ID: ${currentDrawId}`);
    console.log(`  - Draw Time: ${drawTime > BigInt(0) ? new Date(Number(drawTime) * 1000).toISOString() : 'NOT SET'}`);
    console.log(`  - Winning Number: ${winningNumber}`);
    console.log(`  - Total Tickets: ${totalTickets || BigInt(0)}`);
    console.log(`  - Executed: ${executed || false}`);

    // 6. Check if draw needs to be executed
    const now = Math.floor(Date.now() / 1000);
    const drawTimeNum = Number(drawTime);

    // Check if already executed (either has winning number OR executed flag is true)
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

    // Check if draw time is set (should be > 0)
    if (drawTimeNum === 0) {
      console.log('⏳ Draw time not set yet (waiting for first ticket)');
      return NextResponse.json({
        success: true,
        message: 'Draw time not set yet - waiting for first ticket purchase',
        drawId: Number(currentDrawId),
        executed: false
      });
    }

    // Check if it's time to execute
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

    // Check if there are tickets (optional - contract handles this too)
    const totalTicketsNum = Number(totalTickets || BigInt(0));
    if (totalTicketsNum === 0) {
      console.log('📭 No tickets sold - contract will skip this draw automatically');
      // We still execute - the contract will handle skipping and creating next draw
    } else {
      console.log(`🎫 ${totalTicketsNum} ticket(s) sold - proceeding with draw execution`);
    }

    // 7. Execute draw (draw time has passed and not executed)
    console.log('🎲 Executing hourly draw...');

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

    // Get current nonce to avoid "nonce too low" errors
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });

    console.log(`  - Executor address: ${account.address}`);
    console.log(`  - Current nonce: ${nonce}`);

    // Call executeHourlyDraw() with Pyth Entropy VRF fee
    // Fee from Pyth Entropy contract on BASE: ~0.000005 ETH
    const vrfFee = BigInt('10000000000000'); // 0.00001 ETH (2x actual fee for safety margin)
    const hash = await walletClient.writeContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'executeHourlyDraw',
      value: vrfFee,
      nonce
    });

    console.log(`  - VRF Fee sent: ${vrfFee} wei (0.00001 ETH)`);

    console.log(`  - Transaction sent: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`  - Status: ${receipt.status === 'success' ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  - Gas used: ${receipt.gasUsed}`);

    // 8. Get new draw info
    const newDrawId = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'currentHourlyDrawId'
    });

    console.log('🎉 Hourly draw executed successfully!');
    console.log(`  - Old Draw ID: ${currentDrawId}`);
    console.log(`  - New Draw ID: ${newDrawId}`);

    return NextResponse.json({
      success: true,
      message: 'Hourly draw executed successfully',
      oldDrawId: Number(currentDrawId),
      newDrawId: Number(newDrawId),
      txHash: hash,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error: any) {
    console.error('❌ Error executing hourly draw:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute hourly draw',
        details: error.message
      },
      { status: 500 }
    );
  }
}
