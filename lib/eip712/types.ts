/**
 * EIP-712 Type Definitions for Gasless Lottery
 *
 * Este archivo define los tipos EIP-712 para meta-transactions gasless.
 * Los usuarios firman estos mensajes offline sin pagar gas.
 */

import { TypedDataDomain, TypedDataField } from 'ethers';

/**
 * EIP-712 Domain for Lottery Contract
 * Must match the DOMAIN_SEPARATOR in the smart contract
 */
export function getLotteryDomain(
  contractAddress: string,
  chainId: number
): TypedDataDomain {
  return {
    name: 'CryptoLotto',
    version: '1',
    chainId: chainId,
    verifyingContract: contractAddress,
  };
}

/**
 * EIP-712 Types for BuyTicket message
 * Must match BUY_TICKET_TYPEHASH in smart contract
 */
export const BuyTicketTypes: Record<string, TypedDataField[]> = {
  BuyTicket: [
    { name: 'buyer', type: 'address' },
    { name: 'numbers', type: 'uint8[5]' },
    { name: 'powerNumber', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

/**
 * BuyTicket message structure
 */
export interface BuyTicketMessage {
  buyer: string;
  numbers: [number, number, number, number, number];
  powerNumber: number;
  nonce: bigint;
  deadline: number;
}

/**
 * Signature components (result of signing)
 */
export interface SignatureComponents {
  v: number;
  r: string;
  s: string;
}
