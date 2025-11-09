import { logger } from '@/lib/logging/logger';

/**
 * In-memory price cache
 * Prevents excessive API calls to price feeds
 * Cache duration: 1 minute (prices update frequently but not every second)
 */

interface PriceCacheEntry {
  price: number;
  expires: number;
  source: string;
}

class PriceCache {
  private cache = new Map<string, PriceCacheEntry>();
  private readonly DEFAULT_TTL = 60000; // 1 minute in milliseconds

  /**
   * Get cached price or fetch new one
   *
   * @param symbol - Token symbol (e.g., 'BTC', 'ETH', 'MATIC')
   * @param fetcher - Async function to fetch price if not cached
   * @param ttl - Time to live in milliseconds (default: 60000ms = 1 minute)
   * @returns Price in USD
   */
  async get(
    symbol: string,
    fetcher: () => Promise<number>,
    ttl: number = this.DEFAULT_TTL
  ): Promise<number> {
    const normalizedSymbol = symbol.toUpperCase();
    const cached = this.cache.get(normalizedSymbol);
    const now = Date.now();

    // Return cached price if still valid
    if (cached && now < cached.expires) {
      logger.performance('Price cache hit', {
        symbol: normalizedSymbol,
        price: cached.price,
        source: cached.source,
        remainingTTL: Math.floor((cached.expires - now) / 1000),
      });
      return cached.price;
    }

    // Cache miss or expired - fetch new price
    try {
      const startTime = Date.now();
      const price = await fetcher();
      const fetchDuration = Date.now() - startTime;

      // Store in cache
      this.cache.set(normalizedSymbol, {
        price,
        expires: now + ttl,
        source: 'api',
      });

      logger.info('Price fetched and cached', {
        symbol: normalizedSymbol,
        price,
        fetchDuration,
        ttl,
      });

      return price;
    } catch (error) {
      logger.error('Price fetch failed', {
        symbol: normalizedSymbol,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // If fetch fails but we have stale cache, return it
      if (cached) {
        logger.warn('Using stale cached price due to fetch failure', {
          symbol: normalizedSymbol,
          price: cached.price,
          age: Math.floor((now - (cached.expires - ttl)) / 1000),
        });
        return cached.price;
      }

      throw error;
    }
  }

  /**
   * Manually set a price in cache
   * Useful for testing or manual overrides
   *
   * @param symbol - Token symbol
   * @param price - Price in USD
   * @param ttl - Time to live in milliseconds
   */
  set(symbol: string, price: number, ttl: number = this.DEFAULT_TTL): void {
    const normalizedSymbol = symbol.toUpperCase();
    this.cache.set(normalizedSymbol, {
      price,
      expires: Date.now() + ttl,
      source: 'manual',
    });

    logger.info('Price manually set in cache', {
      symbol: normalizedSymbol,
      price,
      ttl,
    });
  }

  /**
   * Clear cache for a specific symbol or entire cache
   *
   * @param symbol - Token symbol (optional, clears all if not provided)
   */
  clear(symbol?: string): void {
    if (symbol) {
      const normalizedSymbol = symbol.toUpperCase();
      this.cache.delete(normalizedSymbol);
      logger.info('Price cache cleared for symbol', { symbol: normalizedSymbol });
    } else {
      this.cache.clear();
      logger.info('Entire price cache cleared');
    }
  }

  /**
   * Get all cached prices
   * Useful for debugging
   */
  getAll(): Record<string, { price: number; expiresIn: number }> {
    const now = Date.now();
    const result: Record<string, { price: number; expiresIn: number }> = {};

    for (const [symbol, entry] of this.cache.entries()) {
      result[symbol] = {
        price: entry.price,
        expiresIn: Math.max(0, Math.floor((entry.expires - now) / 1000)),
      };
    }

    return result;
  }

  /**
   * Clean up expired entries
   * Run periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [symbol, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(symbol);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Price cache cleanup completed', { entriesRemoved: cleaned });
    }
  }
}

// Singleton instance
export const priceCache = new PriceCache();

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  // Only run on server-side
  setInterval(() => {
    priceCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Example usage:
 *
 * // Fetch BTC price (cached for 1 minute)
 * const btcPrice = await priceCache.get('BTC', async () => {
 *   const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
 *   const data = await response.json();
 *   return data.bitcoin.usd;
 * });
 *
 * // Fetch multiple prices efficiently
 * const [btcPrice, ethPrice, maticPrice] = await Promise.all([
 *   priceCache.get('BTC', fetchBTCPrice),
 *   priceCache.get('ETH', fetchETHPrice),
 *   priceCache.get('MATIC', fetchMATICPrice),
 * ]);
 */

/**
 * Helper: Fetch price from CoinGecko API
 * Use this as a fallback or default price fetcher
 */
export async function fetchPriceFromCoinGecko(symbol: string): Promise<number> {
  const symbolMap: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    MATIC: 'matic-network',
    USDC: 'usd-coin',
    USDT: 'tether',
    CBBTC: 'bitcoin', // cbBTC tracks BTC
    WETH: 'ethereum', // WETH tracks ETH
  };

  const coinId = symbolMap[symbol.toUpperCase()];
  if (!coinId) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
    { next: { revalidate: 60 } } // Next.js cache for 60 seconds
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const price = data[coinId]?.usd;

  if (!price) {
    throw new Error(`Price not found for ${symbol}`);
  }

  return price;
}

/**
 * Helper: Get multiple prices efficiently
 * Uses Promise.all for parallel fetching
 */
export async function getMultiplePrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const prices = await Promise.all(
    symbols.map((symbol) =>
      priceCache.get(symbol, () => fetchPriceFromCoinGecko(symbol))
    )
  );

  const result: Record<string, number> = {};
  symbols.forEach((symbol, index) => {
    result[symbol.toUpperCase()] = prices[index];
  });

  return result;
}
