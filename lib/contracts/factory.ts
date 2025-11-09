import { ethers } from 'ethers';

/**
 * Factory Contract Integration
 * Multi-Lottery System - VIBECODERS
 */

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_LOTTERY_FACTORY || '';

export const FACTORY_ABI = [
  // View functions
  "function getActiveLotteries() external view returns (tuple(uint256 lotteryId, address contractAddress, string name, string description, uint256 ticketPrice, bool active, uint256 createdAt, uint256 totalVolume, uint256 totalTickets)[])",
  "function getLottery(uint256) external view returns (tuple(uint256 lotteryId, address contractAddress, string name, string description, uint256 ticketPrice, bool active, uint256 createdAt, uint256 totalVolume, uint256 totalTickets))",
  "function getAllLotteries() external view returns (tuple(uint256 lotteryId, address contractAddress, string name, string description, uint256 ticketPrice, bool active, uint256 createdAt, uint256 totalVolume, uint256 totalTickets)[])",
  "function getGlobalStats() external view returns (uint256 totalVolume, uint256 totalTickets, uint256 activeLotteriesCount)",
  "function getTotalLotteries() external view returns (uint256)",
  "function getActiveLotteriesCount() external view returns (uint256)",
  "function isRegisteredLottery(address) external view returns (bool)",

  // Admin functions (only owner)
  "function registerLottery(address,string,string) external returns (uint256)",
  "function deactivateLottery(uint256,string) external",
  "function reactivateLottery(uint256) external",
  "function updateLotteryStats(uint256,uint256,uint256) external",

  // Helper functions
  "function getLotteryCurrentDraw(address) external view returns (tuple(uint256 drawId, uint256 endTime, bool executed, uint8 winningNumber, uint256 prizePoolUSDC, uint256 prizePoolUSDT, uint64 sequenceNumber, bytes32 randomValue))",
  "function getAllActiveDraws() external view returns (address[] addresses, tuple(uint256 drawId, uint256 endTime, bool executed, uint8 winningNumber, uint256 prizePoolUSDC, uint256 prizePoolUSDT, uint64 sequenceNumber, bytes32 randomValue)[] draws)"
];

export interface LotteryInfo {
  lotteryId: string;
  contractAddress: string;
  name: string;
  description: string;
  ticketPrice: string; // In USD (formatted)
  active: boolean;
  createdAt: Date;
  totalVolume: string; // In USD (formatted)
  totalTickets: string;
}

export interface GlobalStats {
  totalVolume: string;
  totalTickets: string;
  activeLotteriesCount: number;
}

export interface Draw {
  drawId: string;
  endTime: Date;
  executed: boolean;
  winningNumber: number;
  prizePoolUSDC: string;
  prizePoolUSDT: string;
  sequenceNumber: string;
  randomValue: string;
}

/**
 * Get RPC provider
 */
function getProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    ? `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : 'https://mainnet.base.org';

  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get Factory contract instance
 */
export function getFactoryContract() {
  if (!FACTORY_ADDRESS) {
    throw new Error('FACTORY_ADDRESS not set in environment');
  }

  const provider = getProvider();
  return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
}

/**
 * Get all active lotteries
 */
export async function getActiveLotteries(): Promise<LotteryInfo[]> {
  try {
    const factory = getFactoryContract();
    const lotteries = await factory.getActiveLotteries();

    return lotteries.map((l: any) => ({
      lotteryId: l.lotteryId.toString(),
      contractAddress: l.contractAddress,
      name: l.name,
      description: l.description,
      ticketPrice: ethers.formatUnits(l.ticketPrice, 6), // USDC/USDT have 6 decimals
      active: l.active,
      createdAt: new Date(Number(l.createdAt) * 1000),
      totalVolume: ethers.formatUnits(l.totalVolume, 6),
      totalTickets: l.totalTickets.toString()
    }));
  } catch (error) {
    console.error('Error fetching active lotteries:', error);
    throw error;
  }
}

/**
 * Get specific lottery by ID
 */
export async function getLottery(lotteryId: number): Promise<LotteryInfo> {
  try {
    const factory = getFactoryContract();
    const lottery = await factory.getLottery(lotteryId);

    return {
      lotteryId: lottery.lotteryId.toString(),
      contractAddress: lottery.contractAddress,
      name: lottery.name,
      description: lottery.description,
      ticketPrice: ethers.formatUnits(lottery.ticketPrice, 6),
      active: lottery.active,
      createdAt: new Date(Number(lottery.createdAt) * 1000),
      totalVolume: ethers.formatUnits(lottery.totalVolume, 6),
      totalTickets: lottery.totalTickets.toString()
    };
  } catch (error) {
    console.error(`Error fetching lottery ${lotteryId}:`, error);
    throw error;
  }
}

/**
 * Get global stats across all lotteries
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const factory = getFactoryContract();
    const stats = await factory.getGlobalStats();

    return {
      totalVolume: ethers.formatUnits(stats[0], 6),
      totalTickets: stats[1].toString(),
      activeLotteriesCount: Number(stats[2])
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw error;
  }
}

/**
 * Get current draw for a specific lottery
 */
export async function getLotteryCurrentDraw(lotteryAddress: string): Promise<Draw> {
  try {
    const factory = getFactoryContract();
    const draw = await factory.getLotteryCurrentDraw(lotteryAddress);

    return {
      drawId: draw.drawId.toString(),
      endTime: new Date(Number(draw.endTime) * 1000),
      executed: draw.executed,
      winningNumber: Number(draw.winningNumber),
      prizePoolUSDC: ethers.formatUnits(draw.prizePoolUSDC, 6),
      prizePoolUSDT: ethers.formatUnits(draw.prizePoolUSDT, 6),
      sequenceNumber: draw.sequenceNumber.toString(),
      randomValue: draw.randomValue
    };
  } catch (error) {
    console.error(`Error fetching current draw for ${lotteryAddress}:`, error);
    throw error;
  }
}

/**
 * Get all active draws (batch)
 */
export async function getAllActiveDraws(): Promise<{ address: string; draw: Draw }[]> {
  try {
    const factory = getFactoryContract();
    const result = await factory.getAllActiveDraws();

    const addresses = result[0];
    const draws = result[1];

    return addresses.map((address: string, index: number) => {
      const draw = draws[index];
      return {
        address,
        draw: {
          drawId: draw.drawId.toString(),
          endTime: new Date(Number(draw.endTime) * 1000),
          executed: draw.executed,
          winningNumber: Number(draw.winningNumber),
          prizePoolUSDC: ethers.formatUnits(draw.prizePoolUSDC, 6),
          prizePoolUSDT: ethers.formatUnits(draw.prizePoolUSDT, 6),
          sequenceNumber: draw.sequenceNumber.toString(),
          randomValue: draw.randomValue
        }
      };
    });
  } catch (error) {
    console.error('Error fetching all active draws:', error);
    throw error;
  }
}

/**
 * Check if an address is a registered lottery
 */
export async function isRegisteredLottery(address: string): Promise<boolean> {
  try {
    const factory = getFactoryContract();
    return await factory.isRegisteredLottery(address);
  } catch (error) {
    console.error(`Error checking if ${address} is registered:`, error);
    return false;
  }
}

/**
 * Get total number of lotteries (active + inactive)
 */
export async function getTotalLotteries(): Promise<number> {
  try {
    const factory = getFactoryContract();
    const total = await factory.getTotalLotteries();
    return Number(total);
  } catch (error) {
    console.error('Error fetching total lotteries:', error);
    return 0;
  }
}
