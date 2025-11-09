import { ethers } from 'ethers';

/**
 * Genera una firma EIP-2612 Permit para gasless withdrawals
 *
 * @param provider - Ethers provider de la wallet del usuario
 * @param tokenAddress - Dirección del token (USDC o USDT)
 * @param ownerAddress - Dirección del usuario que firma
 * @param spenderAddress - Dirección del contrato GaslessWithdrawals
 * @param value - Monto a permitir (en unidades base del token)
 * @param deadline - Timestamp de expiración
 * @returns Firma en formato { v, r, s }
 */
export async function signPermit(
  provider: ethers.BrowserProvider,
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  value: bigint,
  deadline: number
): Promise<{ v: number; r: string; s: string; deadline: number }> {

  const signer = await provider.getSigner();

  // Get token name for EIP-712 domain
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function name() view returns (string)', 'function nonces(address) view returns (uint256)'],
    provider
  );

  const [name, nonce] = await Promise.all([
    tokenContract.name(),
    tokenContract.nonces(ownerAddress)
  ]);

  // Get chainId
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  // EIP-712 Domain
  // USDC en BASE usa version "2" (no "1" como en Ethereum mainnet)
  const domain = {
    name,
    version: '2',
    chainId,
    verifyingContract: tokenAddress
  };

  // EIP-712 Types
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  // Values
  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value: value.toString(),
    nonce: nonce.toString(),
    deadline
  };

  // Sign typed data (EIP-712)
  const signature = await signer.signTypedData(domain, types, message);

  // Split signature into v, r, s
  const sig = ethers.Signature.from(signature);

  return {
    v: sig.v,
    r: sig.r,
    s: sig.s,
    deadline
  };
}

/**
 * Crea un deadline para la firma (tiempo de expiración)
 * @param minutesFromNow - Minutos desde ahora hasta que expire
 * @returns Timestamp Unix
 */
export function createDeadline(minutesFromNow: number = 20): number {
  return Math.floor(Date.now() / 1000) + (minutesFromNow * 60);
}

/**
 * Formatea el monto del token a su representación en unidades base
 * @param amount - Monto en formato decimal (ej: "100.50")
 * @param decimals - Decimales del token (6 para USDC/USDT)
 * @returns BigInt en unidades base
 */
export function parseTokenAmount(amount: string, decimals: number = 6): bigint {
  return ethers.parseUnits(amount, decimals);
}
