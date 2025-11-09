import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_ADDRESS = '0xB8D7DEf776C1D3C96DeB6b2193408B82dca99aE3';

const ABI = [
  {
    inputs: [{ name: 'drawId', type: 'uint256' }],
    name: 'getHourlyDraw',
    outputs: [{
      components: [
        { name: 'drawId', type: 'uint256' },
        { name: 'drawTime', type: 'uint256' },
        { name: 'winningNumber', type: 'uint8' },
        { name: 'executed', type: 'bool' },
        { name: 'totalTickets', type: 'uint256' },
        { name: 'winner', type: 'address' },
        { name: 'vrfSequenceNumber', type: 'uint256' },
        { name: 'totalWinners', type: 'uint256' },
        { name: 'btcPrizeSnapshot', type: 'uint256' },
        { name: 'ethPrizeSnapshot', type: 'uint256' },
        { name: 'usdcPrizeSnapshot', type: 'uint256' }
      ],
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function'
  }
];

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/qRGYsr1605ww6yfIxEFww')
});

async function debug() {
  try {
    const draw = await publicClient.readContract({
      address: LOTTERY_ADDRESS,
      abi: ABI,
      functionName: 'getHourlyDraw',
      args: [2n]
    });
    
    console.log('Full Draw #2 Info:');
    console.log('  drawId:', draw.drawId.toString());
    console.log('  drawTime:', draw.drawTime.toString());
    console.log('  winningNumber:', draw.winningNumber.toString());
    console.log('  executed:', draw.executed);
    console.log('  totalTickets:', draw.totalTickets.toString());
    console.log('  winner:', draw.winner);
  } catch (error) {
    console.log('getHourlyDraw failed:', error.message);
  }
}

debug();
