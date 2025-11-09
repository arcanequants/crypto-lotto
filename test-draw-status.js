const { ethers } = require('ethers');

const LOTTERY_ADDRESS = '0xB8D7DEf776C1D3C96DeB6b2193408B82dca99aE3';
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const ABI = [
  'function currentHourlyDrawId() view returns (uint256)',
  'function hourlyDraws(uint256) view returns (uint256 drawId, uint8 winningNumber, uint256 drawTime, uint256 totalPrize, address winner, bool claimed)'
];

async function checkDrawStatus() {
  const provider = new ethers.JsonRpcProvider(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
  const contract = new ethers.Contract(LOTTERY_ADDRESS, ABI, provider);
  
  const currentDrawId = await contract.currentHourlyDrawId();
  console.log('Current Hourly Draw ID:', currentDrawId.toString());
  
  // Check draw 1 (the one that should have executed)
  const draw1 = await contract.hourlyDraws(1);
  console.log('\nDraw #1 Status:');
  console.log('  Draw ID:', draw1.drawId.toString());
  console.log('  Winning Number:', draw1.winningNumber.toString());
  console.log('  Draw Time:', draw1.drawTime.toString());
  console.log('  Draw Time (Date):', new Date(Number(draw1.drawTime) * 1000).toISOString());
  console.log('  Total Prize:', ethers.formatEther(draw1.totalPrize), 'ETH');
  console.log('  Winner:', draw1.winner);
  console.log('  Claimed:', draw1.claimed);
}

checkDrawStatus().catch(console.error);
