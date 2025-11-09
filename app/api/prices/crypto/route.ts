import { NextRequest, NextResponse } from 'next/server';

// Coinbase Advanced Trade API (free, no auth needed para precios públicos)
const COINBASE_API = 'https://api.coinbase.com/v2/prices';

interface CryptoPrices {
  btc: number;
  eth: number;
  sol: number;
  [key: string]: number; // Permite tokens dinámicos adicionales
  timestamp: number;
}

// ============================================================
// TOKENS COMPATIBLES CON SOLANA SPL (Smart Contract)
// Actualizado: Enero 2025
// ============================================================

// Tokens 100% compatibles con Solana (SPL o Wrapped via Wormhole con alta liquidez)
const SUPPORTED_MONTHLY_TOKENS = [
  // === BTC SIEMPRE DISPONIBLE (opción permanente de votación) ===
  'BTC',    // WBTC (cbBTC de Coinbase) - $1B+ TVL en Solana

  // === Wrapped Tokens (Bridged a Solana con alta liquidez) ===
  'DOGE',   // Dogecoin - $35B nativamente bridged via Wormhole NTT

  // === Solana Native DeFi (SPL Tokens) ===
  'JUP',    // Jupiter - DEX aggregator líder de Solana
  'RAY',    // Raydium - AMM/DEX con más volumen
  'JTO',    // Jito - Liquid staking + MEV rewards
  'PYTH',   // Pyth Network - Oracle de precios
  'ORCA',   // Orca - DEX con mejor UX

  // === Solana Meme Coins (Súper populares) ===
  'BONK',   // Bonk - Meme coin #1 de Solana
  'WIF',    // dogwifhat - Perro con gorro, Top 50
  'POPCAT', // Popcat - Meme cat popular

  // === Stablecoins (Por si acaso) ===
  'USDC',   // USD Coin - Stablecoin
  'USDT',   // Tether - Stablecoin
];

// ⚠️ NOTA: XRP, ADA, AVAX, DOT, LINK, MATIC, UNI, LTC, NEAR, APT, ARB, FTM,
// AAVE, ATOM, OP, INJ, PEPE fueron REMOVIDOS porque:
// - No tienen versión SPL en Solana, o
// - Su versión wrapped tiene muy baja liquidez/volumen
// Ver: SOLANA-SPL-TOKENS-COMPATIBLES.md para más detalles

/**
 * GET /api/prices/crypto?symbols=BTC,ETH,SOL,LINK
 *
 * Obtiene precios actuales de cryptos desde Coinbase API
 * Soporta tokens dinámicos vía query parameter
 *
 * Response:
 * {
 *   btc: 67234.50,
 *   eth: 2845.23,
 *   sol: 178.45,
 *   link: 14.32,  // Si se solicitó
 *   timestamp: 1729459200000
 * }
 *
 * Cache: 10 segundos (suficiente para live updates sin abusar de API)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');

    // Default: BTC, ETH, SOL. Si se pasan symbols, agregar adicionales
    let symbols = ['BTC', 'ETH', 'SOL'];

    if (symbolsParam) {
      const additionalSymbols = symbolsParam
        .toUpperCase()
        .split(',')
        .map(s => s.trim())
        .filter(s => SUPPORTED_MONTHLY_TOKENS.includes(s) && !symbols.includes(s));

      symbols = [...symbols, ...additionalSymbols];
    }

    // Fetch prices in parallel para máxima velocidad
    const fetchPromises = symbols.map(symbol =>
      fetch(`${COINBASE_API}/${symbol}-USD/spot`, {
        headers: {
          'Accept': 'application/json',
        },
      })
    );

    const responses = await Promise.all(fetchPromises);

    // Check for errors
    if (responses.some(res => !res.ok)) {
      throw new Error('Failed to fetch prices from Coinbase');
    }

    const dataArray = await Promise.all(responses.map(res => res.json()));

    // Parse prices
    const prices: CryptoPrices = {
      timestamp: Date.now(),
    } as CryptoPrices;

    symbols.forEach((symbol, index) => {
      const priceValue = parseFloat(dataArray[index].data.amount);
      prices[symbol.toLowerCase()] = priceValue;
    });

    // Validate all prices
    const allPricesValid = symbols.every(symbol => {
      const price = prices[symbol.toLowerCase()];
      return !isNaN(price) && price > 0;
    });

    if (!allPricesValid) {
      throw new Error('Invalid price data received');
    }

    // Return with cache headers (10 seconds TTL)
    return NextResponse.json(prices, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch crypto prices',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
