import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

/**
 * API endpoint para ejecutar gasless withdrawals
 *
 * Flujo:
 * 1. Frontend genera un EIP-2612 permit signature (gratis, sin gas)
 * 2. Frontend envía la firma a este endpoint
 * 3. Backend ejecuta withdrawWithPermit() pagando el gas
 * 4. Retorna el transaction hash al frontend
 */

// ABI del contrato GaslessWithdrawals (solo la función que necesitamos)
const GASLESS_WITHDRAWALS_ABI = [
  'function withdrawWithPermit(address token, address user, address destination, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external'
];

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { token, user, destination, amount, deadline, v, r, s } = body;

    // Validaciones
    if (!token || !user || !destination || !amount || !deadline || !v || !r || !s) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validar que el gasless contract esté configurado
    const gaslessContractAddress = process.env.NEXT_PUBLIC_GASLESS_CONTRACT;
    if (!gaslessContractAddress) {
      console.error('❌ NEXT_PUBLIC_GASLESS_CONTRACT not configured');
      return NextResponse.json(
        { error: 'Gasless contract not configured' },
        { status: 500 }
      );
    }

    // Validar que la private key del executor esté configurada
    const executorPrivateKey = process.env.WITHDRAWAL_EXECUTOR_PRIVATE_KEY;
    if (!executorPrivateKey) {
      console.error('❌ WITHDRAWAL_EXECUTOR_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Executor wallet not configured' },
        { status: 500 }
      );
    }

    // Validar deadline (no expirado)
    const now = Math.floor(Date.now() / 1000);
    if (deadline < now) {
      return NextResponse.json(
        { error: 'Permit signature expired' },
        { status: 400 }
      );
    }

    console.log('💸 Processing gasless withdrawal...');
    console.log('  User:', user);
    console.log('  Destination:', destination);
    console.log('  Amount:', ethers.formatUnits(amount, 6), 'USDC/USDT');
    console.log('  Token:', token);

    // Conectar al provider de BASE mainnet
    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    const rpcUrl = alchemyApiKey && alchemyApiKey !== 'YOUR_ALCHEMY_API_KEY_HERE'
      ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://mainnet.base.org';

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Crear wallet del executor (quien paga el gas)
    const executorWallet = new ethers.Wallet(executorPrivateKey, provider);

    console.log('  Executor wallet:', executorWallet.address);

    // Verificar que el executor tenga ETH para gas
    const ethBalance = await provider.getBalance(executorWallet.address);
    console.log('  Executor ETH balance:', ethers.formatEther(ethBalance), 'ETH');

    if (ethBalance < ethers.parseEther('0.0001')) {
      console.error('❌ Executor wallet has insufficient ETH for gas');
      return NextResponse.json(
        { error: 'Server wallet has insufficient funds for gas' },
        { status: 500 }
      );
    }

    // Crear instancia del contrato GaslessWithdrawals
    const gaslessContract = new ethers.Contract(
      gaslessContractAddress,
      GASLESS_WITHDRAWALS_ABI,
      executorWallet
    );

    console.log('📤 Executing withdrawWithPermit on-chain...');

    // Ejecutar withdrawWithPermit (el executor paga el gas)
    const tx = await gaslessContract.withdrawWithPermit(
      token,
      user,
      destination,
      amount,
      deadline,
      v,
      r,
      s
    );

    console.log('⏳ Transaction sent:', tx.hash);
    console.log('   Waiting for confirmation...');

    // Esperar confirmación
    const receipt = await tx.wait();

    console.log('✅ Gasless withdrawal successful!');
    console.log('   Gas used:', receipt.gasUsed.toString());
    console.log('   Gas price:', ethers.formatUnits(receipt.gasPrice || 0, 'gwei'), 'gwei');
    console.log('   Total cost:', ethers.formatEther((receipt.gasUsed * (receipt.gasPrice || BigInt(0))).toString()), 'ETH');

    // Calcular fee (0.1%)
    const fee = (BigInt(amount) * BigInt(10)) / BigInt(10000);
    const netAmount = BigInt(amount) - fee;

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      netAmount: netAmount.toString(),
      fee: fee.toString()
    });

  } catch (error: any) {
    console.error('❌ Gasless withdrawal error:', error);

    // Errores comunes
    if (error.message?.includes('Permit expired')) {
      return NextResponse.json(
        { error: 'Permit signature expired' },
        { status: 400 }
      );
    }

    if (error.message?.includes('Token not whitelisted')) {
      return NextResponse.json(
        { error: 'Token not supported for gasless withdrawals' },
        { status: 400 }
      );
    }

    if (error.message?.includes('Amount too low')) {
      return NextResponse.json(
        { error: 'Amount below minimum withdrawal ($1.00)' },
        { status: 400 }
      );
    }

    if (error.message?.includes('insufficient funds')) {
      return NextResponse.json(
        { error: 'Insufficient token balance' },
        { status: 400 }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        error: 'Failed to execute withdrawal',
        details: error.message
      },
      { status: 500 }
    );
  }
}
