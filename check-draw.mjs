import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_ADDRESS = '0xB8D7DEf776C1D3C96DeB6b2193408B82dca99aE3';

const ABI = [
  {
    inputs: [],
    name: 'currentHourlyDrawId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'hourlyDraws',
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'totalPrize', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'claimed', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/qRGYsr1605ww6yfIxEFww')
});

async function checkDraw() {
  try {
    const currentDrawId = await publicClient.readContract({
      address: LOTTERY_ADDRESS,
      abi: ABI,
      functionName: 'currentHourlyDrawId'
    });
    
    console.log('Current Hourly Draw ID:', currentDrawId.toString());
    
    if (currentDrawId > 0n) {
      // Check the current draw
      const draw = await publicClient.readContract({
        address: LOTTERY_ADDRESS,
        abi: ABI,
        functionName: 'hourlyDraws',
        args: [currentDrawId]
      });
      
      console.log('\nDraw #' + currentDrawId.toString() + ' Status:');
      console.log('  Winning Number:', draw.winningNumber.toString());
      console.log('  Draw Time:', draw.drawTime.toString());
      if (draw.drawTime > 0n) {
        console.log('  Draw Time (Date):', new Date(Number(draw.drawTime) * 1000).toISOString());
      }
      console.log('  Total Prize:', (Number(draw.totalPrize) / 1e18).toFixed(6), 'ETH');
      console.log('  Winner:', draw.winner);
      console.log('  Claimed:', draw.claimed);
    }
    
    // Also check draw 1
    if (currentDrawId >= 1n) {
      const draw1 = await publicClient.readContract({
        address: LOTTERY_ADDRESS,
        abi: ABI,
        functionName: 'hourlyDraws',
        args: [1n]
      });
      
      console.log('\nDraw #1 Status:');
      console.log('  Winning Number:', draw1.winningNumber.toString());
      console.log('  Draw Time:', draw1.drawTime.toString());
      if (draw1.drawTime > 0n) {
        console.log('  Draw Time (Date):', new Date(Number(draw1.drawTime) * 1000).toISOString());
      }
      console.log('  Total Prize:', (Number(draw1.totalPrize) / 1e18).toFixed(6), 'ETH');
      console.log('  Winner:', draw1.winner);
      console.log('  Claimed:', draw1.claimed);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDraw();
