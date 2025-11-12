/**
 * OFFICIAL ABI for LotteryDualCrypto contract
 * Contract: 0x2aB8570632D431843F40eb48dA8cE67695BAE3D9
 *
 * ⚠️ IMPORTANT: This is the SINGLE SOURCE OF TRUTH for the contract ABI
 * All other files MUST import from here to ensure consistency
 */

export const LOTTERY_DUAL_CRYPTO_ABI = [
  // Read functions
  {
    name: 'currentHourlyDrawId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'currentDailyDrawId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getHourlyDraw',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'drawId', type: 'uint256' }],
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'executed', type: 'bool' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'totalWinners', type: 'uint256' },
      { name: 'btcPrizeSnapshot', type: 'uint256' },
      { name: 'ethPrizeSnapshot', type: 'uint256' },
      { name: 'usdcPrizeSnapshot', type: 'uint256' },
      { name: 'commitBlock', type: 'uint256' },
      { name: 'revealBlock', type: 'uint256' },
      { name: 'salesClosed', type: 'bool' }
    ]
  },
  {
    name: 'getDailyDraw',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'drawId', type: 'uint256' }],
    outputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'winningNumber', type: 'uint8' },
      { name: 'executed', type: 'bool' },
      { name: 'totalTickets', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'totalWinners', type: 'uint256' },
      { name: 'btcPrizeSnapshot', type: 'uint256' },
      { name: 'ethPrizeSnapshot', type: 'uint256' },
      { name: 'usdcPrizeSnapshot', type: 'uint256' },
      { name: 'commitBlock', type: 'uint256' },
      { name: 'revealBlock', type: 'uint256' },
      { name: 'salesClosed', type: 'bool' }
    ]
  },
  {
    name: 'getHourlyVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'btc', type: 'uint256' },
      { name: 'eth', type: 'uint256' },
      { name: 'usdc', type: 'uint256' }
    ]
  },
  {
    name: 'getDailyVault',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'btc', type: 'uint256' },
      { name: 'eth', type: 'uint256' },
      { name: 'usdc', type: 'uint256' }
    ]
  },
  {
    name: 'getTicket',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'ticketId', type: 'uint256' }],
    outputs: [
      { name: 'ticketId', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'number', type: 'uint8' },
      { name: 'hourlyDrawId', type: 'uint256' },
      { name: 'dailyDrawId', type: 'uint256' },
      { name: 'hourlyClaimed', type: 'bool' },
      { name: 'dailyClaimed', type: 'bool' },
      { name: 'purchaseTime', type: 'uint256' }
    ]
  },
  // Write functions
  {
    name: 'buyTicket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_number', type: 'uint8' }],
    outputs: []
  },
  {
    name: 'closeHourlyDraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'closeDailyDraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'executeHourlyDraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'executeDailyDraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
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
  },
  {
    name: 'refundFailedDrawTicket',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'ticketId', type: 'uint256' }
    ],
    outputs: []
  }
] as const;
