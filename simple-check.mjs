import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_ADDRESS = '0xB8D7DEf776C1D3C96DeB6b2193408B82dca99aE3';

const ABI = [
  {
    inputs: [{ name: 'drawId', type: 'uint256' }],
    name: 'getDrawTicketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
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

async function check() {
  console.log('Checking draw #1...\n');
  
  try {
    const ticketCount = await publicClient.readContract({
      address: LOTTERY_ADDRESS,
      abi: ABI,
      functionName: 'getDrawTicketCount',
      args: [1n]
    });
    
    console.log('Tickets sold for Draw #1:', ticketCount.toString());
  } catch (error) {
    console.log('getDrawTicketCount not available in this contract');
  }
  
  const draw = await publicClient.readContract({
    address: LOTTERY_ADDRESS,
    abi: ABI,
    functionName: 'hourlyDraws',
    args: [1n]
  });
  
  console.log('\nDraw #1 data:');
  console.log('  drawId:', draw[0].toString());
  console.log('  winningNumber:', draw[1].toString(), draw[1] > 100 ? '❌ INVALID' : '✅');
  console.log('  drawTime:', draw[2].toString(), draw[2] === 0n ? '❌ NOT SET' : '✅');
  console.log('  totalPrize:', (Number(draw[3]) / 1e18).toFixed(6), 'ETH');
  console.log('  winner:', draw[4]);
  console.log('  claimed:', draw[5]);
}

check();
