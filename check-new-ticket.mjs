import { createPublicClient, http, parseAbiItem } from 'viem';
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
    inputs: [],
    name: 'nextTicketId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'uint256' }],
    name: 'tickets',
    outputs: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'number', type: 'uint8' },
      { name: 'hourlyDrawId', type: 'uint256' },
      { name: 'dailyDrawId', type: 'uint256' },
      { name: 'hourlyClaimed', type: 'bool' },
      { name: 'dailyClaimed', type: 'bool' },
      { name: 'purchaseTime', type: 'uint256' }
    ],
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
      { name: 'claimed', type: 'bool' },
      { name: 'executed', type: 'bool' },
      { name: 'totalTickets', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/qRGYsr1605ww6yfIxEFww')
});

async function checkTicket() {
  console.log('═══════════════════════════════════════');
  console.log('CHECKING YOUR TICKET PURCHASE');
  console.log('═══════════════════════════════════════\n');
  
  // Get total tickets
  const nextTicketId = await publicClient.readContract({
    address: LOTTERY_ADDRESS,
    abi: ABI,
    functionName: 'nextTicketId'
  });
  
  console.log('Total Tickets Purchased:', nextTicketId.toString());
  
  if (nextTicketId > 0n) {
    // Get the last ticket
    const lastTicketId = nextTicketId - 1n;
    const ticket = await publicClient.readContract({
      address: LOTTERY_ADDRESS,
      abi: ABI,
      functionName: 'tickets',
      args: [lastTicketId]
    });
    
    console.log('\nLast Ticket (ID #' + lastTicketId.toString() + '):');
    console.log('  Owner:', ticket[1]);
    console.log('  Number:', ticket[2].toString());
    console.log('  Hourly Draw ID:', ticket[3].toString());
    console.log('  Daily Draw ID:', ticket[4].toString());
    console.log('  Purchase Time:', new Date(Number(ticket[7]) * 1000).toISOString());
    console.log('  Hourly Claimed:', ticket[5]);
    console.log('  Daily Claimed:', ticket[6]);
    
    // Get the draw info
    const hourlyDrawId = ticket[3];
    const draw = await publicClient.readContract({
      address: LOTTERY_ADDRESS,
      abi: ABI,
      functionName: 'hourlyDraws',
      args: [hourlyDrawId]
    });
    
    console.log('\nDraw #' + hourlyDrawId.toString() + ' Info:');
    console.log('  Draw Time:', draw[2] > 0n ? new Date(Number(draw[2]) * 1000).toISOString() : 'NOT SET');
    console.log('  Total Tickets:', draw[7].toString());
    console.log('  Executed:', draw[6]);
    console.log('  Winning Number:', draw[1].toString(), draw[1] > 0 ? (draw[1] <= 100 ? '✅' : '❌ INVALID') : '⏳ Pending');
    
    const now = Math.floor(Date.now() / 1000);
    const drawTime = Number(draw[2]);
    
    if (drawTime > 0) {
      const timeUntil = drawTime - now;
      if (timeUntil > 0) {
        const minutes = Math.floor(timeUntil / 60);
        const seconds = timeUntil % 60;
        console.log('\n⏰ Time until draw:', minutes, 'min', seconds, 'sec');
      } else {
        console.log('\n✅ Draw time has passed! Ready to execute.');
        console.log('   Overdue by:', Math.abs(timeUntil), 'seconds');
      }
    }
  }
  
  // Get current draw ID
  const currentDrawId = await publicClient.readContract({
    address: LOTTERY_ADDRESS,
    abi: ABI,
    functionName: 'currentHourlyDrawId'
  });
  
  console.log('\nCurrent Hourly Draw ID:', currentDrawId.toString());
  
  // Check for recent TicketPurchased events
  console.log('\n🔍 Searching for recent ticket purchase events...');
  try {
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock - 100n; // Last ~100 blocks (5 minutes)
    
    const events = await publicClient.getLogs({
      address: LOTTERY_ADDRESS,
      event: parseAbiItem('event TicketPurchased(uint256 indexed ticketId, address indexed buyer, uint8 number, uint256 hourlyDrawId, uint256 dailyDrawId, uint256 timestamp)'),
      fromBlock,
      toBlock: 'latest'
    });
    
    console.log('Found', events.length, 'ticket purchase(s) in last ~5 minutes:');
    events.forEach((event, i) => {
      console.log(`\n  Purchase #${i + 1}:`);
      console.log('    Ticket ID:', event.args.ticketId?.toString());
      console.log('    Buyer:', event.args.buyer);
      console.log('    Number:', event.args.number?.toString());
      console.log('    Hourly Draw:', event.args.hourlyDrawId?.toString());
      console.log('    Tx:', event.transactionHash);
    });
  } catch (error) {
    console.log('Could not fetch events (may need larger block range)');
  }
  
  console.log('\n═══════════════════════════════════════');
}

checkTicket();
