import { ethers } from 'ethers';
import { logger } from '@/lib/logging/logger';

/**
 * Normalize an Ethereum address to lowercase checksummed format
 * This prevents case-sensitivity issues and ensures consistency across the app
 *
 * @param address - The Ethereum address to normalize
 * @returns Normalized lowercase address
 * @throws Error if address is invalid
 */
export function normalizeAddress(address: string): string {
  try {
    // 1. Validate format
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid address format: ${address}`);
    }

    // 2. Convert to checksum format (validates integrity)
    const checksummed = ethers.getAddress(address);

    // 3. Convert to lowercase for consistent database storage
    // This prevents issues like:
    // - 0xAbC... and 0xabc... being treated as different users
    // - Case-sensitive SQL queries failing
    return checksummed.toLowerCase();
  } catch (error) {
    logger.security('Address normalization failed', {
      address,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
}

/**
 * Validate and normalize multiple addresses
 * Useful for batch operations
 *
 * @param addresses - Array of addresses to normalize
 * @returns Array of normalized addresses
 * @throws Error if any address is invalid
 */
export function normalizeAddresses(addresses: string[]): string[] {
  return addresses.map((addr) => normalizeAddress(addr));
}

/**
 * Check if two addresses are equal (case-insensitive)
 *
 * @param addr1 - First address
 * @param addr2 - Second address
 * @returns True if addresses are equal
 */
export function addressesEqual(addr1: string, addr2: string): boolean {
  try {
    return normalizeAddress(addr1) === normalizeAddress(addr2);
  } catch {
    return false;
  }
}

/**
 * Validate address format without normalization
 * Useful for quick checks without throwing errors
 *
 * @param address - Address to validate
 * @returns True if valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Truncate address for display purposes
 * Example: 0x1234...5678
 *
 * @param address - Address to truncate
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated address
 */
export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!isValidAddress(address)) {
    return address;
  }

  const normalized = normalizeAddress(address);
  return `${normalized.slice(0, startChars)}...${normalized.slice(-endChars)}`;
}

/**
 * Check if address is zero address (0x0000...0000)
 *
 * @param address - Address to check
 * @returns True if zero address
 */
export function isZeroAddress(address: string): boolean {
  try {
    const normalized = normalizeAddress(address);
    return normalized === '0x0000000000000000000000000000000000000000';
  } catch {
    return false;
  }
}

/**
 * Constants
 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const MAX_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff';
