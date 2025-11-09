'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { createPublicClient, createWalletClient, custom, parseUnits, formatUnits, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Smart contract addresses (update after deployment)
const LOTTERY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LOTTERY_CONTRACT as `0x${string}` || '0x0000000000000000000000000000000000000000';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`; // BASE mainnet
const USDT_ADDRESS = '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`; // BASE mainnet

// Production RPC using Alchemy (300M compute units/month free)
// Falls back to default if API key not configured
const getAlchemyRpcUrl = () => {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (apiKey && apiKey !== 'YOUR_ALCHEMY_API_KEY_HERE') {
    return `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
  }
  // Fallback to default viem RPC if Alchemy not configured
  return undefined;
};

// Both USDC and USDT have 6 decimals
const TOKEN_DECIMALS = 6;
const TICKET_PRICE = '0.10'; // $0.10 - ULTRA SIMPLE mode

export type PaymentToken = 'USDC' | 'USDT';

const TOKEN_ADDRESSES: Record<PaymentToken, `0x${string}`> = {
  USDC: USDC_ADDRESS,
  USDT: USDT_ADDRESS
};

// LotteryDualCrypto ABI - Only accepts USDC (hardcoded in contract)
// Contract deployed Nov 6, 2025: 0x424B72AAcA06D494De1D89C9778D533104786648
const LOTTERY_ABI = [
  {
    name: 'buyTicket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_number', type: 'uint8' }
      // NOTE: No _paymentToken parameter - contract only accepts USDC
    ],
    outputs: []
  },
  {
    name: 'buyTicketsBulk',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_numbers', type: 'uint8[]' }
      // NOTE: No _paymentToken parameter - contract only accepts USDC
    ],
    outputs: []
  },
  {
    name: 'checkAllowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getUserBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'claimHourlyPrize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'convertToUSDC', type: 'bool' }
    ],
    outputs: []
  },
  {
    name: 'claimDailyPrize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'convertToUSDC', type: 'bool' }
    ],
    outputs: []
  }
] as const;

const USDC_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export interface Ticket {
  id: string;
  numbers: number[];
  powerNumber: number;
}

export function useContract() {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DEBUG: Log ALL wallet addresses to see what Privy is creating
  console.log('🔍 DEBUG - All wallets:', {
    'wallets[0]?.address': wallets?.[0]?.address,
    'wallets[0]?.walletClientType': wallets?.[0]?.walletClientType,
    'user.wallet?.address': user?.wallet?.address,
    'smartWalletClient?.account?.address': smartWalletClient?.account?.address,
    'Total wallets': wallets?.length
  });

  // Use SMART WALLET address (ERC-4337 account with gas sponsorship)
  // This is the address that holds funds and has Coinbase Paymaster configured
  // NOT the embedded wallet address (which is just the signer)
  const walletAddress = smartWalletClient?.account?.address as `0x${string}` | undefined;
  const chain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? base : baseSepolia;

  /**
   * Get wallet client for signing transactions
   * Uses Privy's smart wallet client with gas sponsorship
   */
  const getWalletClient = async () => {
    // Use the smart wallet client from Privy's SmartWalletsProvider
    // This client has gas sponsorship configured automatically
    if (!smartWalletClient) {
      throw new Error('Smart wallet not initialized');
    }

    return smartWalletClient;
  };

  /**
   * Get user's token balance (USDC or USDT)
   * Checks the smart wallet address (ERC-4337 account)
   */
  const checkTokenBalance = async (token: PaymentToken): Promise<string> => {
    if (!walletAddress) throw new Error('Smart wallet not ready');

    try {
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      console.log('🔍 Checking balance for smart wallet:', walletAddress);

      const balance = await publicClient.readContract({
        address: TOKEN_ADDRESSES[token],
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });

      const balanceFormatted = formatUnits(balance, TOKEN_DECIMALS);
      console.log(`  💰 ${token} balance:`, balanceFormatted);

      return balanceFormatted;
    } catch (err) {
      console.error(`Error checking ${token} balance:`, err);
      throw new Error(`Failed to check ${token} balance`);
    }
  };

  /**
   * Check if user has approved enough tokens
   */
  const checkTokenAllowance = async (token: PaymentToken, amount?: string): Promise<boolean> => {
    if (!walletAddress) return false;

    try {
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      console.log('🔍 Checking USDC allowance...');
      console.log('   Owner (your wallet):', walletAddress);
      console.log('   Spender (lottery contract):', LOTTERY_CONTRACT_ADDRESS);

      const allowance = await publicClient.readContract({
        address: TOKEN_ADDRESSES[token],
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [walletAddress, LOTTERY_CONTRACT_ADDRESS]
      });

      const requiredAmount = parseUnits(amount || TICKET_PRICE, TOKEN_DECIMALS);

      console.log('   Current allowance:', formatUnits(allowance, TOKEN_DECIMALS), token);
      console.log('   Required amount:', formatUnits(requiredAmount, TOKEN_DECIMALS), token);
      console.log('   Has enough allowance?', allowance >= requiredAmount);

      return allowance >= requiredAmount;
    } catch (err) {
      console.error('Error checking allowance:', err);
      return false;
    }
  };

  /**
   * Approve token to lottery contract
   * APPROVES INFINITE AMOUNT so user only needs to approve ONCE
   */
  const approveToken = async (token: PaymentToken): Promise<string> => {
    if (!walletAddress || !authenticated) throw new Error('Wallet not connected');

    setLoading(true);
    setError(null);

    try {
      // Get wallet client (smart wallet or embedded wallet)
      const walletClient = await getWalletClient();

      // Approve MAX amount (2^256 - 1) so user only approves ONCE
      // This is standard practice for DEXs and dApps
      const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

      console.log('💎 Approving infinite allowance for', token);

      const hash = await walletClient.writeContract({
        address: TOKEN_ADDRESSES[token],
        abi: USDC_ABI,
        functionName: 'approve',
        args: [LOTTERY_CONTRACT_ADDRESS, MAX_UINT256]
      });

      // Wait for transaction
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      await publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Infinite approval confirmed!');

      setLoading(false);
      return hash;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || `Failed to approve ${token}`);
      throw err;
    }
  };

  /**
   * Transfer tokens from embedded wallet to smart wallet
   * TEMPORARY: Only for testing when funds are stuck in embedded wallet
   */
  const transferToSmartWallet = async (token: PaymentToken, amount: string): Promise<string> => {
    if (!walletAddress || !authenticated) throw new Error('Wallet not connected');

    setLoading(true);
    setError(null);

    try {
      console.log(`💸 Transferring ${amount} ${token} from embedded wallet to smart wallet`);

      // Get embedded wallet client
      const embeddedWalletClient = await getEmbeddedWalletClient();

      // Transfer tokens to smart wallet
      const amountWei = parseUnits(amount, TOKEN_DECIMALS);

      const hash = await embeddedWalletClient.writeContract({
        address: TOKEN_ADDRESSES[token],
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [walletAddress, amountWei]
      });

      // Wait for transaction
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      await publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Transfer successful!');

      setLoading(false);
      return hash;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || `Failed to transfer ${token}`);
      throw err;
    }
  };

  /**
   * Buy single ticket (LotteryDualCrypto only accepts USDC)
   * Uses Privy smart wallet (ERC-4337 with gas sponsorship via Coinbase Paymaster)
   */
  const buyTicket = async (ticket: Ticket, token: PaymentToken = 'USDC'): Promise<void> => {
    if (!walletAddress || !authenticated) throw new Error('Smart wallet not ready');

    setLoading(true);
    setError(null);

    try {
      // Use Privy's smart wallet client (ERC-4337 with automatic gas sponsorship)
      console.log('🎫 Buying ticket with Privy smart wallet (gas sponsored by Coinbase Paymaster)');
      console.log('   Number:', ticket.numbers[0]);
      console.log('   Smart Wallet:', walletAddress);

      const walletClient = await getWalletClient();

      const hash = await walletClient.writeContract({
        address: LOTTERY_CONTRACT_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: 'buyTicket',
        args: [
          ticket.numbers[0] // Only 1 number from 1-100, no payment token (contract only accepts USDC)
        ]
        // NOTE: Do NOT set gas manually - Privy smart wallets calculate it automatically
      });

      // Wait for transaction
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      await publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Ticket purchased successfully!');

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to buy ticket');
      throw err;
    }
  };

  /**
   * Get embedded wallet client (for when funds are in embedded wallet)
   */
  const getEmbeddedWalletClient = async () => {
    if (!wallets || wallets.length === 0) {
      throw new Error('No wallet connected');
    }

    const embeddedWallet = wallets.find((wallet) =>
      wallet.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      throw new Error('Privy wallet not found');
    }

    const embeddedWalletAddress = user?.wallet?.address as `0x${string}` | undefined;
    if (!embeddedWalletAddress) {
      throw new Error('No embedded wallet address');
    }

    const provider = await embeddedWallet.getEthereumProvider();

    if (!provider) {
      throw new Error('Failed to get Ethereum provider from Privy wallet');
    }

    const walletClient = createWalletClient({
      account: embeddedWalletAddress,
      chain,
      transport: custom(provider)
    });

    return walletClient;
  };

  /**
   * Buy multiple tickets in bulk (LotteryDualCrypto only accepts USDC)
   */
  const buyTicketsBulk = async (tickets: Ticket[], token: PaymentToken = 'USDC'): Promise<string> => {
    if (!walletAddress || !authenticated) throw new Error('Wallet not connected');
    if (tickets.length === 0) throw new Error('No tickets provided');
    if (tickets.length > 50000) throw new Error('Max 50000 tickets per transaction');

    setLoading(true);
    setError(null);

    try {
      console.log('🎫 Buying', tickets.length, 'tickets in bulk');
      console.log('   Smart Wallet:', walletAddress);

      // Get wallet client (smart wallet or embedded wallet)
      const walletClient = await getWalletClient();

      // Prepare arrays - only numbers from 1-100 (no power numbers)
      const numbersArray = tickets.map(t => t.numbers[0]); // Only first number

      const hash = await walletClient.writeContract({
        address: LOTTERY_CONTRACT_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: 'buyTicketsBulk',
        args: [numbersArray] // No payment token - contract only accepts USDC
        // NOTE: Do NOT set gas manually - Privy smart wallets calculate it automatically
      });

      // Wait for transaction
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      await publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Bulk tickets purchased successfully!');

      setLoading(false);
      return hash;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to buy tickets');
      throw err;
    }
  };

  /**
   * Calculate total cost for tickets
   */
  const calculateTotalCost = (ticketCount: number): string => {
    const total = Number(TICKET_PRICE) * ticketCount;
    return total.toFixed(2);
  };

  /**
   * Claim hourly prize (winner takes all)
   * Uses Coinbase Paymaster for GASLESS claiming (user pays $0 gas)
   * @param ticketId The winning ticket ID
   * @param convertToUSDC If true, auto-swaps all crypto to USDC for maximum simplicity
   */
  const claimHourlyPrize = async (ticketId: number, convertToUSDC: boolean = false): Promise<string> => {
    if (!walletAddress || !authenticated) throw new Error('Smart wallet not ready');

    setLoading(true);
    setError(null);

    try {
      console.log(`🏆 Claiming hourly prize (GAS GRATIS - Coinbase Paymaster) ${convertToUSDC ? '[AUTO-SWAP to USDC]' : '[BTC+ETH+BNB]'}`);

      const walletClient = await getWalletClient();

      const hash = await walletClient.writeContract({
        address: LOTTERY_CONTRACT_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: 'claimHourlyPrize',
        args: [BigInt(ticketId), convertToUSDC]
      });

      // Wait for transaction
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      await publicClient.waitForTransactionReceipt({ hash });

      if (convertToUSDC) {
        console.log('✅ Hourly prize claimed! You received 100% USDC');
      } else {
        console.log('✅ Hourly prize claimed! You received BTC + ETH + WBNB');
      }

      setLoading(false);
      return hash;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to claim hourly prize');
      throw err;
    }
  };

  /**
   * Claim daily prize (winner takes all)
   * Uses Coinbase Paymaster for GASLESS claiming (user pays $0 gas)
   * @param ticketId The winning ticket ID
   * @param convertToUSDC If true, auto-swaps all crypto to USDC for maximum simplicity
   */
  const claimDailyPrize = async (ticketId: number, convertToUSDC: boolean = false): Promise<string> => {
    if (!walletAddress || !authenticated) throw new Error('Smart wallet not ready');

    setLoading(true);
    setError(null);

    try {
      console.log(`🏆 Claiming daily prize (GAS GRATIS - Coinbase Paymaster) ${convertToUSDC ? '[AUTO-SWAP to USDC]' : '[BTC+ETH+BNB]'}`);

      const walletClient = await getWalletClient();

      const hash = await walletClient.writeContract({
        address: LOTTERY_CONTRACT_ADDRESS,
        abi: LOTTERY_ABI,
        functionName: 'claimDailyPrize',
        args: [BigInt(ticketId), convertToUSDC]
      });

      // Wait for transaction
      const rpcUrl = getAlchemyRpcUrl();
      const publicClient = createPublicClient({
        chain,
        transport: rpcUrl ? http(rpcUrl) : http()
      });

      await publicClient.waitForTransactionReceipt({ hash });

      if (convertToUSDC) {
        console.log('✅ Daily prize claimed! You received 100% USDC');
      } else {
        console.log('✅ Daily prize claimed! You received BTC + ETH + WBNB');
      }

      setLoading(false);
      return hash;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to claim daily prize');
      throw err;
    }
  };

  return {
    // State
    loading,
    error,
    walletAddress,
    authenticated,

    // Constants
    TICKET_PRICE,
    LOTTERY_CONTRACT_ADDRESS,
    TOKEN_ADDRESSES,

    // Functions
    checkTokenBalance,
    checkTokenAllowance,
    approveToken,
    transferToSmartWallet,
    buyTicket,
    buyTicketsBulk,
    calculateTotalCost,
    claimHourlyPrize,
    claimDailyPrize
  };
}
