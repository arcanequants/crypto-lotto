'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useContract } from '@/lib/hooks/useContract';
import { ethers } from 'ethers';
import { signPermit, createDeadline, parseTokenAmount } from '@/lib/permitSignature';

interface WithdrawModalProps {
  onClose: () => void;
}

type Token = 'USDC' | 'USDT';
type Network = 'BASE' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM' | 'AVALANCHE' | 'BSC' | 'ETHEREUM';

const NETWORKS: Record<Network, { name: string; chainId: number; rpcUrl: string }> = {
  BASE: { name: 'BASE', chainId: 8453, rpcUrl: 'https://mainnet.base.org' },
  POLYGON: { name: 'Polygon (MATIC)', chainId: 137, rpcUrl: 'https://polygon-rpc.com' },
  ARBITRUM: { name: 'Arbitrum One', chainId: 42161, rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  OPTIMISM: { name: 'Optimism', chainId: 10, rpcUrl: 'https://mainnet.optimism.io' },
  AVALANCHE: { name: 'Avalanche C-Chain', chainId: 43114, rpcUrl: 'https://api.avax.network/ext/bc/C/rpc' },
  BSC: { name: 'BNB Smart Chain', chainId: 56, rpcUrl: 'https://bsc-dataseed.binance.org' },
  ETHEREUM: { name: 'Ethereum Mainnet', chainId: 1, rpcUrl: 'https://eth.llamarpc.com' }
};

// Token contract addresses per network
const TOKEN_ADDRESSES: Record<Network, { USDC: string; USDT: string }> = {
  BASE: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'
  },
  POLYGON: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
  },
  ARBITRUM: {
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
  },
  OPTIMISM: {
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'
  },
  AVALANCHE: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'
  },
  BSC: {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955'
  },
  ETHEREUM: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  }
};

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

export function WithdrawModal({ onClose }: WithdrawModalProps) {
  const { user } = usePrivy();
  const { wallets, ready } = useWallets();
  const { checkTokenBalance, walletAddress } = useContract(); // USE walletAddress from useContract!

  const [selectedToken, setSelectedToken] = useState<Token>('USDC');
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('BASE');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [balanceUSDC, setBalanceUSDC] = useState<string>('...');
  const [balanceUSDT, setBalanceUSDT] = useState<string>('...');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState('');
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);

  // Load balances on mount
  useEffect(() => {
    if (walletAddress) {
      loadBalances();
    }
  }, [walletAddress]);

  // Calculate fee when amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const amountNum = parseFloat(amount);
      const fee = amountNum * 0.001; // 0.1%
      const netAmount = amountNum - fee;
      setEstimatedFee(`$${fee.toFixed(2)} (0.1%) → You receive $${netAmount.toFixed(2)}`);
    } else {
      setEstimatedFee(null);
    }
  }, [amount]);

  const loadBalances = async () => {
    if (!walletAddress) return;
    setLoadingBalance(true);
    try {
      // For now, we'll get balances directly from the blockchain
      // instead of using the lottery contract (which isn't deployed yet)
      await loadBalancesFromBlockchain();
    } catch (err) {
      console.error('Error loading balances:', err);
      setBalanceUSDC('0.00');
      setBalanceUSDT('0.00');
    }
    setLoadingBalance(false);
  };

  const loadBalancesFromBlockchain = async () => {
    if (!wallets || wallets.length === 0 || !walletAddress) return;

    try {
      const wallet = wallets[0];

      // Get provider using Privy's method
      const ethereumProvider = await wallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);

      // USDC contract on BASE
      const usdcContract = new ethers.Contract(
        TOKEN_ADDRESSES.BASE.USDC,
        ERC20_ABI,
        provider
      );

      // USDT contract on BASE
      const usdtContract = new ethers.Contract(
        TOKEN_ADDRESSES.BASE.USDT,
        ERC20_ABI,
        provider
      );

      const [usdcBalance, usdtBalance, usdcDecimals, usdtDecimals] = await Promise.all([
        usdcContract.balanceOf(walletAddress),
        usdtContract.balanceOf(walletAddress),
        usdcContract.decimals(),
        usdtContract.decimals()
      ]);

      setBalanceUSDC(parseFloat(ethers.formatUnits(usdcBalance, usdcDecimals)).toFixed(2));
      setBalanceUSDT(parseFloat(ethers.formatUnits(usdtBalance, usdtDecimals)).toFixed(2));
    } catch (err) {
      console.error('Error loading balances from blockchain:', err);
      // Set to 0 if can't load (user might not have any tokens)
      setBalanceUSDC('0.00');
      setBalanceUSDT('0.00');
    }
  };

  const validateAddress = (address: string): boolean => {
    try {
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleWithdraw = async () => {
    setError('');

    // Validations
    if (!destinationAddress) {
      setError('Please enter a destination address');
      return;
    }

    if (!validateAddress(destinationAddress)) {
      setError('Invalid Ethereum address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Minimum $1.00 (contract requirement)
    if (parseFloat(amount) < 1.00) {
      setError('Minimum withdrawal amount is $1.00');
      return;
    }

    const balance = selectedToken === 'USDC' ? parseFloat(balanceUSDC) : parseFloat(balanceUSDT);
    if (parseFloat(amount) > balance) {
      setError(`Insufficient ${selectedToken} balance`);
      return;
    }

    if (!wallets || wallets.length === 0) {
      setError('No wallet connected');
      return;
    }

    // Solo permitimos withdrawals en BASE
    if (selectedNetwork !== 'BASE') {
      setError('Withdrawals are only available on BASE network. Please select BASE.');
      return;
    }

    // Verificar que el gasless contract esté configurado
    const gaslessContractAddress = process.env.NEXT_PUBLIC_GASLESS_CONTRACT || '';
    if (!gaslessContractAddress) {
      setError('Gasless contract not configured');
      return;
    }

    try {
      setWithdrawing(true);

      console.log('💸 Starting gasless withdrawal (NO gas fees required)...');

      // Get the embedded wallet from Privy
      const wallet = wallets[0];

      // Make sure we're on BASE network
      await wallet.switchChain(NETWORKS.BASE.chainId);

      // Get the provider using Privy's method
      const ethereumProvider = await wallet.getEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereumProvider);

      // Get token contract address on BASE
      const tokenAddress = TOKEN_ADDRESSES.BASE[selectedToken];

      // Convert amount to token units (6 decimals for USDC/USDT)
      const amountBigInt = parseTokenAmount(amount, 6);

      // Create deadline (20 minutes from now)
      const deadline = createDeadline(20);

      console.log('✍️ Generating EIP-2612 permit signature (no gas)...');

      // Generate permit signature (GASLESS - just a signature, no transaction)
      const signature = await signPermit(
        provider,
        tokenAddress,
        walletAddress!,
        gaslessContractAddress,
        amountBigInt,
        deadline
      );

      console.log('📤 Sending withdrawal request to backend...');

      // Send to backend API to execute gasless withdrawal
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenAddress,
          user: walletAddress,
          destination: destinationAddress,
          amount: amountBigInt.toString(),
          deadline: signature.deadline,
          v: signature.v,
          r: signature.r,
          s: signature.s
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Withdrawal failed');
      }

      const result = await response.json();

      console.log('✅ Gasless withdrawal successful!', result);

      // Reload balances
      await loadBalances();

      // Show success message
      alert(`✅ Gasless withdrawal successful!\n\n` +
        `Sent: ${amount} ${selectedToken}\n` +
        `To: ${destinationAddress.slice(0, 6)}...${destinationAddress.slice(-4)}\n` +
        `Fee: 0.1% (${(parseFloat(amount) * 0.001).toFixed(2)} ${selectedToken})\n\n` +
        `Tx: ${result.txHash || 'Processing...'}`
      );

      // Close modal
      onClose();

    } catch (err: any) {
      console.error('❌ Withdrawal error:', err);

      if (err.code === 'ACTION_REJECTED' || err.message?.includes('User rejected')) {
        setError('Signature was rejected');
      } else if (err.message?.includes('Permit expired')) {
        setError('Permit signature expired. Please try again.');
      } else if (err.message?.includes('Insufficient balance')) {
        setError(`Insufficient ${selectedToken} balance`);
      } else {
        setError(err.message || 'Failed to withdraw. Please try again.');
      }
    } finally {
      setWithdrawing(false);
    }
  };

  const handleMaxClick = () => {
    const balance = selectedToken === 'USDC' ? balanceUSDC : balanceUSDT;
    setAmount(balance);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
          borderRadius: '24px',
          padding: '32px',
          maxWidth: '550px',
          width: '100%',
          border: '2px solid rgba(255, 100, 100, 0.3)',
          boxShadow: '0 20px 60px rgba(255, 100, 100, 0.3)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '28px',
              background: 'linear-gradient(135deg, #ff6464, #ff3333)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700
            }}
          >
            💸 Withdraw Crypto
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', margin: 0 }}>
            Send your USDC or USDT to any wallet or exchange
          </p>
        </div>

        {/* Current Balance */}
        <div
          style={{
            background: 'rgba(255, 100, 100, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 100, 100, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
              Available Balance (BASE Network)
            </span>
            <button
              onClick={loadBalances}
              disabled={loadingBalance}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6464',
                cursor: 'pointer',
                fontSize: '12px',
                opacity: loadingBalance ? 0.5 : 1
              }}
            >
              🔄 Refresh
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>USDC</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00f0ff', fontFamily: "'Orbitron', sans-serif" }}>
                ${balanceUSDC}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>USDT</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#26a17b', fontFamily: "'Orbitron', sans-serif" }}>
                ${balanceUSDT}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Select Token */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            1. Select Token
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedToken('USDC')}
              style={{
                flex: 1,
                padding: '14px',
                background: selectedToken === 'USDC' ? 'linear-gradient(135deg, #00f0ff, #0080ff)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedToken === 'USDC' ? '2px solid #00f0ff' : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              💎 USDC
            </button>
            <button
              onClick={() => setSelectedToken('USDT')}
              style={{
                flex: 1,
                padding: '14px',
                background: selectedToken === 'USDT' ? 'linear-gradient(135deg, #26a17b, #1c9c6e)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedToken === 'USDT' ? '2px solid #26a17b' : '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              💚 USDT
            </button>
          </div>
        </div>

        {/* Step 2: Select Network */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            2. Select Network
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.entries(NETWORKS).map(([key, network]) => (
              <button
                key={key}
                onClick={() => setSelectedNetwork(key as Network)}
                style={{
                  padding: '12px',
                  background: selectedNetwork === key ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedNetwork === key ? '2px solid #ff6464' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                <div>{network.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Destination Address */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            3. Destination Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '13px',
              fontFamily: "'Courier New', monospace",
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6464'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          />
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '6px' }}>
            Enter the wallet address where you want to receive your funds
          </div>
        </div>

        {/* Step 4: Amount */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '8px' }}>
            4. Amount
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                paddingRight: '70px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 600,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ff6464'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
            <button
              onClick={handleMaxClick}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '6px 12px',
                background: '#ff6464',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              MAX
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Available: {selectedToken === 'USDC' ? balanceUSDC : balanceUSDT} {selectedToken}
              </span>
            </div>
            {estimatedFee && (
              <div style={{ color: '#00ff96', fontSize: '12px', fontWeight: 600 }}>
                Fee: {estimatedFee}
              </div>
            )}
          </div>
        </div>

        {/* Gasless Withdrawals Info */}
        <div
          style={{
            background: 'rgba(0, 240, 255, 0.05)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#00f0ff'
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>✨ Gasless Withdrawals</div>
          <div style={{ lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.8)' }}>
            <strong>No ETH needed:</strong> You don't need ETH for gas! We pay the gas fees for you.
            <br />
            <strong>Small fee:</strong> We charge only 0.1% (basis points: 10) to cover the gas costs.
            <br />
            <strong>How it works:</strong> You sign a gasless permit, we execute the withdrawal.
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: 'rgba(255, 100, 100, 0.1)',
              border: '1px solid rgba(255, 100, 100, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#ff6464'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Warning */}
        <div
          style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '11px',
            lineHeight: '1.6'
          }}
        >
          <div style={{ fontWeight: 700, color: '#ffd700', marginBottom: '6px' }}>
            ⚠️ Important:
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: 'rgba(255, 255, 255, 0.8)' }}>
            <li>Send only <strong>{selectedToken}</strong> to this address</li>
            <li>Double-check the destination address - transactions cannot be reversed</li>
            <li>NO ETH needed for gas - this is a gasless withdrawal!</li>
            <li>Small 0.1% fee to cover gas costs</li>
            <li>Minimum withdrawal: $1.00</li>
          </ul>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={withdrawing}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: withdrawing ? 'not-allowed' : 'pointer',
              opacity: withdrawing ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={withdrawing || !walletAddress}
            style={{
              flex: 1,
              padding: '14px',
              background: withdrawing ? 'rgba(255, 100, 100, 0.3)' : 'linear-gradient(135deg, #ff6464, #ff3333)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              cursor: withdrawing || !walletAddress ? 'not-allowed' : 'pointer',
              opacity: withdrawing || !walletAddress ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {withdrawing ? '⏳ Withdrawing...' : '💸 Withdraw'}
          </button>
        </div>
      </div>
    </div>
  );
}
