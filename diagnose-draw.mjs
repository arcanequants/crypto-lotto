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

async function diagnose() {
  const currentDrawId = await publicClient.readContract({
    address: LOTTERY_ADDRESS,
    abi: ABI,
    functionName: 'currentHourlyDrawId'
  });
  
  console.log('═══════════════════════════════════════');
  console.log('LOTTERY CONTRACT DIAGNOSTICS');
  console.log('═══════════════════════════════════════');
  console.log('Current Hourly Draw ID:', currentDrawId.toString());
  console.log('');
  
  // Check draw 1
  try {
    const draw1 = await publicClient.readContract({
      address: LOTTERY_ADDRESS,
      abi: ABI,
      functionName: 'hourlyDraws',
      args: [1n]
    });
    
    console.log('DRAW #1:');
    console.log('  drawId:', draw1[0]?.toString() || 'N/A');
    console.log('  winningNumber:', draw1[1]?.toString() || 'N/A');
    console.log('  drawTime (unix):', draw1[2]?.toString() || 'N/A');
    
    if (draw1[2] && draw1[2] > 0n) {
      const dt = Number(draw1[2]);
      console.log('  drawTime (date):', new Date(dt * 1000).toISOString());
      console.log('  has passed?:', Date.now() / 1000 > dt);
    } else {
      console.log('  drawTime (date): NOT SET');
    }
    
    console.log('  totalPrize (wei):', draw1[3]?.toString() || 'N/A');
    console.log('  totalPrize (ETH):', (Number(draw1[3] || 0n) / 1e18).toFixed(6));
    console.log('  winner:', draw1[4] || 'N/A');
    console.log('  claimed:', draw1[5]?.toString() || 'N/A');
    console.log('');
    
    // Analysis
    console.log('ANALYSIS:');
    if (draw1[1] > 0) {
      console.log('  ✅ Draw has been EXECUTED (has winning number)');
    } else if (draw1[2] && draw1[2] > 0n) {
      const dt = Number(draw1[2]);
      const now = Date.now() / 1000;
      if (now < dt) {
        console.log('  ⏰ Draw is SCHEDULED but not yet time to execute');
        console.log('     Time remaining:', Math.round(dt - now), 'seconds');
      } else {
        console.log('  ⚠️  Draw time has PASSED but not executed yet');
        console.log('     Overdue by:', Math.round(now - dt), 'seconds');
      }
    } else {
      console.log('  ℹ️  Draw is WAITING FOR FIRST TICKET');
      console.log('     Draw time will be set when first ticket is purchased');
    }
    
  } catch (error) {
    console.error('Error reading draw 1:', error.message);
  }
  
  console.log('═══════════════════════════════════════');
}

diagnose();
