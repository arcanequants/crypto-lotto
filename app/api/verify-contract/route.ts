import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_ABI = [
  {
    name: 'nextTicketId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'currentHourlyDrawId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getHourlyVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'btc', type: 'uint256' },
      { name: 'eth', type: 'uint256' },
      { name: 'usdc', type: 'uint256' }
    ]
  },
  {
    name: 'getDailyVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'btc', type: 'uint256' },
      { name: 'eth', type: 'uint256' },
      { name: 'usdc', type: 'uint256' }
    ]
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
      { name: 'totalTickets', type: 'uint256' },
      { name: 'totalPrize', type: 'uint256' },
      { name: 'executed', type: 'bool' },
      { name: 'commitBlock', type: 'uint256' },
      { name: 'revealBlock', type: 'uint256' },
      { name: 'salesClosed', type: 'bool' }
    ]
  }
] as const;

export async function GET() {
  try {
    const LOTTERY_CONTRACT = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}`;
    const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl)
    });

    console.log('🔍 Verifying Contract:', LOTTERY_CONTRACT);

    // Check nextTicketId
    const nextTicketId = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'nextTicketId'
    });

    // Check currentHourlyDrawId
    const hourlyDrawId = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'currentHourlyDrawId'
    });

    // Check hourly vault
    const hourlyVault = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'getHourlyVault'
    }) as [bigint, bigint, bigint];

    // Check daily vault
    const dailyVault = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'getDailyVault'
    }) as [bigint, bigint, bigint];

    // Check hourly draw details
    const hourlyDraw = await publicClient.readContract({
      address: LOTTERY_CONTRACT,
      abi: LOTTERY_ABI,
      functionName: 'getHourlyDraw',
      args: [hourlyDrawId]
    }) as readonly [bigint, bigint, number, bigint, bigint, boolean, bigint, bigint, boolean];

    return NextResponse.json({
      success: true,
      contract: LOTTERY_CONTRACT,
      data: {
        nextTicketId: nextTicketId.toString(),
        currentHourlyDrawId: hourlyDrawId.toString(),
        hourlyVault: {
          btc: hourlyVault[0].toString(),
          eth: hourlyVault[1].toString(),
          usdc: hourlyVault[2].toString(),
          usdcFormatted: Number(hourlyVault[2]) / 1e6
        },
        dailyVault: {
          btc: dailyVault[0].toString(),
          eth: dailyVault[1].toString(),
          usdc: dailyVault[2].toString(),
          usdcFormatted: Number(dailyVault[2]) / 1e6
        },
        currentHourlyDraw: {
          drawId: hourlyDraw[0].toString(),
          drawTime: hourlyDraw[1] > 0n ? new Date(Number(hourlyDraw[1]) * 1000).toISOString() : 'NOT SET',
          winningNumber: hourlyDraw[2],
          totalTickets: hourlyDraw[3].toString(),
          totalPrize: hourlyDraw[4].toString(),
          executed: hourlyDraw[5],
          commitBlock: hourlyDraw[6].toString(),
          revealBlock: hourlyDraw[7].toString(),
          salesClosed: hourlyDraw[8]
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error verifying contract:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify contract',
        details: error.message
      },
      { status: 500 }
    );
  }
}
