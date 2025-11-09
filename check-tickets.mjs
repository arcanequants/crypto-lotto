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
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'tickets',
    outputs: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'player', type: 'address' },
      { name: 'ticketNumber', type: 'uint8' },
      { name: 'drawId', type: 'uint256' },
      { name: 'claimed', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'ticketCounter',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/qRGYsr1605ww6yfIxEFww')
});

async function checkTickets() {
  console.log('═══════════════════════════════════════');
  console.log('CHECKING TICKETS AND DRAWS');
  console.log('═══════════════════════════════════════\n');
  
  // Get ticket counter
  const ticketCounter = await publicClient.readContract({
    address: LOTTERY_ADDRESS,
    abi: ABI,
    functionName: 'ticketCounter'
  });
  
  console.log('Total tickets purchased:', ticketCounter.toString());
  
  // Get current draw ID
  const currentDrawId = await publicClient.readContract({
    address: LOTTERY_ADDRESS,
    abi: ABI,
    functionName: 'currentHourlyDrawId'
  });
  
  console.log('Current draw ID:', currentDrawId.toString());
  console.log('');
  
  // Check all tickets
  if (ticketCounter > 0n) {
    console.log('TICKETS:');
    for (let i = 0n; i < ticketCounter && i < 10n; i++) {
      try {
        const ticket = await publicClient.readContract({
          address: LOTTERY_ADDRESS,
          abi: ABI,
          functionName: 'tickets',
          args: [i]
        });
        
        console.log(`  Ticket #${i}:`);
        console.log(`    player: ${ticket[1]}`);
        console.log(`    number: ${ticket[2]}`);
        console.log(`    drawId: ${ticket[3]}`);
        console.log(`    claimed: ${ticket[4]}`);
        console.log('');
      } catch (error) {
        console.log(`  Ticket #${i}: Error -`, error.message);
      }
    }
  }
  
  // Check draw 1
  console.log('DRAW #1 DETAILS:');
  const draw1 = await publicClient.readContract({
    address: LOTTERY_ADDRESS,
    abi: ABI,
    functionName: 'hourlyDraws',
    args: [1n]
  });
  
  console.log('  drawId:', draw1[0].toString());
  console.log('  winningNumber:', draw1[1].toString());
  console.log('  drawTime:', draw1[2].toString());
  if (draw1[2] > 0n) {
    console.log('  drawTime (date):', new Date(Number(draw1[2]) * 1000).toISOString());
  }
  console.log('  totalPrize:', (Number(draw1[3]) / 1e18).toFixed(6), 'ETH');
  console.log('  winner:', draw1[4]);
  console.log('  claimed:', draw1[5]);
  
  console.log('\n═══════════════════════════════════════');
}

checkTickets();
