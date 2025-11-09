import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const LOTTERY_ADDRESS = '0xB8D7DEf776C1D3C96DeB6b2193408B82dca99aE3';

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/qRGYsr1605ww6yfIxEFww')
});

async function checkEvents() {
  console.log('═══════════════════════════════════════');
  console.log('CHECKING CONTRACT EVENTS');
  console.log('Contract:', LOTTERY_ADDRESS);
  console.log('═══════════════════════════════════════\n');
  
  // Get contract deployment block (approximately)
  const currentBlock = await publicClient.getBlockNumber();
  console.log('Current block:', currentBlock.toString());
  
  // Search from 1000 blocks ago to now
  const fromBlock = currentBlock - 10000n;
  
  console.log('Searching from block:', fromBlock.toString());
  console.log('');
  
  // Check TicketPurchased events
  try {
    const ticketEvents = await publicClient.getLogs({
      address: LOTTERY_ADDRESS,
      event: parseAbiItem('event TicketPurchased(address indexed player, uint256 indexed ticketId, uint256 ticketNumber, uint256 drawId)'),
      fromBlock,
      toBlock: 'latest'
    });
    
    console.log(`Found ${ticketEvents.length} TicketPurchased events:`);
    ticketEvents.forEach((event, i) => {
      console.log(`\n  Event #${i + 1}:`);
      console.log(`    Block: ${event.blockNumber}`);
      console.log(`    Player: ${event.args.player}`);
      console.log(`    Ticket ID: ${event.args.ticketId}`);
      console.log(`    Number: ${event.args.ticketNumber}`);
      console.log(`    Draw ID: ${event.args.drawId}`);
      console.log(`    Tx: ${event.transactionHash}`);
    });
  } catch (error) {
    console.log('Error fetching TicketPurchased events:', error.message);
  }
  
  console.log('\n');
  
  // Check HourlyDrawExecuted events
  try {
    const drawEvents = await publicClient.getLogs({
      address: LOTTERY_ADDRESS,
      event: parseAbiItem('event HourlyDrawExecuted(uint256 indexed drawId, uint8 winningNumber, address winner, uint256 prize)'),
      fromBlock,
      toBlock: 'latest'
    });
    
    console.log(`Found ${drawEvents.length} HourlyDrawExecuted events:`);
    drawEvents.forEach((event, i) => {
      console.log(`\n  Event #${i + 1}:`);
      console.log(`    Block: ${event.blockNumber}`);
      console.log(`    Draw ID: ${event.args.drawId}`);
      console.log(`    Winning Number: ${event.args.winningNumber}`);
      console.log(`    Winner: ${event.args.winner}`);
      console.log(`    Prize: ${event.args.prize} wei`);
      console.log(`    Tx: ${event.transactionHash}`);
    });
  } catch (error) {
    console.log('Error fetching HourlyDrawExecuted events:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════');
}

checkEvents();
