import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface LivePrizeData {
  drawType: 'daily' | 'weekly';
  totalUSD: number;
  composition: {
    btc: { amount: number; usd: number; percentage: number };
    eth: { amount: number; usd: number; percentage: number };
    token: { amount: number; usd: number; symbol: string; percentage: number };
  };
  totalTickets: number;
  lastUpdate: number;
}

/**
 * GET /api/prizes/live?type=daily|weekly
 * GET /api/prizes/live?latest=true
 *
 * Obtiene el prize pool actual en tiempo real con:
 * - Valor total en USD
 * - Desglose por crypto (BTC, ETH, Token del Mes)
 * - Precios actualizados
 *
 * Parámetros:
 * - type: 'daily' | 'weekly' - Filtra por tipo de draw
 * - latest: 'true' - Devuelve el draw más reciente sin filtrar por tipo
 *
 * Response example:
 * {
 *   drawType: "weekly",
 *   totalUSD: 284523.45,
 *   composition: {
 *     btc: { amount: 0.3421, usd: 182450, percentage: 70 },
 *     eth: { amount: 1.8521, usd: 58231, percentage: 25 },
 *     token: { amount: 245, usd: 43842, symbol: "SOL", percentage: 5 }
 *   },
 *   totalTickets: 45200,
 *   lastUpdate: 1729459200000
 * }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const drawType = searchParams.get('type');
  const latest = searchParams.get('latest');

  try {
    let draw;
    let drawError;

    // 1. Get current draw from Supabase
    if (latest === 'true') {
      // Get latest draw regardless of type
      const result = await supabase
        .from('draws')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      draw = result.data;
      drawError = result.error;
    } else {
      // Get draw by type (daily or weekly)
      const type = drawType || 'weekly';

      // Validate draw type
      if (!['daily', 'weekly'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid draw type. Must be "daily" or "weekly"' },
          { status: 400 }
        );
      }

      const result = await supabase
        .from('draws')
        .select('*')
        .eq('draw_type', type)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      draw = result.data;
      drawError = result.error;
    }

    if (drawError) {
      console.error('Supabase error fetching draw:', drawError);
      return NextResponse.json(
        { error: 'Failed to fetch draw data', details: drawError.message },
        { status: 500 }
      );
    }

    if (!draw) {
      return NextResponse.json(
        { error: 'No active draw found for this type' },
        { status: 404 }
      );
    }

    // 2. Get token symbol for this draw (monthly voted token)
    const tokenSymbol = draw.token_symbol || 'SOL';

    // 3. Get current crypto prices (including dynamic monthly token)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const pricesRes = await fetch(`${baseUrl}/api/prices/crypto?symbols=${tokenSymbol}`);

    if (!pricesRes.ok) {
      throw new Error('Failed to fetch crypto prices');
    }

    const prices = await pricesRes.json();

    // 4. Calculate USD values using dynamic token price
    const btcAmount = draw.wbtc_amount || 0;
    const ethAmount = draw.eth_amount || 0;
    const tokenAmount = draw.token_amount || 0;

    const tokenPrice = prices[tokenSymbol.toLowerCase()];

    if (!tokenPrice) {
      console.error(`Price for ${tokenSymbol} not found, using 0`);
    }

    const btcUSD = btcAmount * prices.btc;
    const ethUSD = ethAmount * prices.eth;
    const tokenUSD = tokenAmount * (tokenPrice || 0); // ✅ FIXED: Dynamic token price lookup
    const totalUSD = btcUSD + ethUSD + tokenUSD;

    // 4. Build response
    const response: LivePrizeData = {
      drawType: (draw.draw_type || 'weekly') as 'daily' | 'weekly',
      totalUSD,
      composition: {
        btc: {
          amount: btcAmount,
          usd: btcUSD,
          percentage: 70, // 70% of prize pool
        },
        eth: {
          amount: ethAmount,
          usd: ethUSD,
          percentage: 25, // 25% of prize pool
        },
        token: {
          amount: tokenAmount,
          usd: tokenUSD,
          symbol: tokenSymbol,
          percentage: 5, // 5% of prize pool
        },
      },
      totalTickets: draw.total_tickets || 0,
      lastUpdate: Date.now(),
    };

    // 5. Return with cache headers (10 seconds TTL)
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching live prize:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
