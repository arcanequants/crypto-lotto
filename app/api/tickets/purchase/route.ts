import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logging/logger';
import { priceCache, fetchPriceFromCoinGecko } from '@/lib/cache/priceCache';
import { normalizeAddress } from '@/lib/security/address';

interface PurchaseTicket {
  numbers: number[];
  powerNumber: number;
}

interface PurchaseRequest {
  tickets: PurchaseTicket[];
  walletAddress: string;
  drawId?: number; // Optional now - we use RPC functions to get draw IDs
}

// Distribution constants
const PLATFORM_FEE_PERCENT = 25; // 25% platform fee
const DAILY_PERCENT = 20; // 20% of prize pool goes to daily
const WEEKLY_PERCENT = 80; // 80% of prize pool goes to weekly
const BTC_PERCENT = 70; // 70% BTC
const ETH_PERCENT = 25; // 25% ETH
const TOKEN_PERCENT = 5; // 5% Token of Month

/**
 * POST /api/tickets/purchase
 *
 * DUAL LOTTERY: Compra tickets que participan en AMBOS sorteos (daily + weekly)
 *
 * Flujo:
 * 1. Para cada ticket, obtiene el próximo daily_draw_id y weekly_draw_id usando RPC
 * 2. Inserta tickets con dual draw assignment
 * 3. Obtiene precios actuales de crypto (BTC, ETH, Token)
 * 4. Calcula distribución: 25% platform fee + 20% daily + 80% weekly
 * 5. Actualiza AMBOS draws usando RPC update_dual_draw_prize_pools
 *
 * Request body:
 * {
 *   tickets: [{ numbers: [1,2,3,4,5], powerNumber: 10 }],
 *   walletAddress: "0x123..."
 * }
 *
 * Response:
 * {
 *   success: true,
 *   ticketCount: 3,
 *   totalCost: 0.75,
 *   dailyDrawId: 1001,
 *   weeklyDrawId: 2000,
 *   distribution: { platformFee: 0.1875, dailyPool: 0.1125, weeklyPool: 0.45 }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json();
    const { tickets, walletAddress } = body;

    // Validate request
    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'No tickets provided' },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const TICKET_PRICE = 0.25;
    const ticketCount = tickets.length;
    const totalCost = ticketCount * TICKET_PRICE;
    const purchaseTime = new Date().toISOString();

    // 1. Get next daily and weekly draw info using RPC functions (returns JSON with id and draw_id)
    const { data: dailyDrawInfoRaw, error: dailyError } = await supabase
      .rpc('get_next_daily_draw_info', { purchase_time: purchaseTime });

    const { data: weeklyDrawInfoRaw, error: weeklyError } = await supabase
      .rpc('get_next_weekly_draw_info', { purchase_time: purchaseTime });

    if (dailyError || weeklyError) {
      console.error('Error getting draw IDs:', { dailyError, weeklyError });
      return NextResponse.json(
        { error: 'Failed to get draw IDs. Make sure draws exist in database.' },
        { status: 500 }
      );
    }

    if (!dailyDrawInfoRaw || !weeklyDrawInfoRaw) {
      return NextResponse.json(
        { error: 'No active draws available. Please create draws first.' },
        { status: 400 }
      );
    }

    // Parse JSON response from RPC functions (Supabase returns JSON as object)
    const dailyDrawInfo = typeof dailyDrawInfoRaw === 'string'
      ? JSON.parse(dailyDrawInfoRaw)
      : dailyDrawInfoRaw;
    const weeklyDrawInfo = typeof weeklyDrawInfoRaw === 'string'
      ? JSON.parse(weeklyDrawInfoRaw)
      : weeklyDrawInfoRaw;

    // Extract both id (for FK references) and draw_id (for legacy FK)
    const dailyId = dailyDrawInfo.id;
    const dailyDrawId = dailyDrawInfo.draw_id;
    const weeklyId = weeklyDrawInfo.id;
    const weeklyDrawId = weeklyDrawInfo.draw_id;

    logger.info('Ticket purchase initiated', {
      ticketCount,
      dailyDrawId,
      weeklyDrawId,
      totalCost
    });

    // 2. Insert all tickets into database with DUAL draw assignment
    const ticketsToInsert = tickets.map((ticket) => {
      const ticketId = parseInt(Date.now().toString().slice(-9)) + Math.floor(Math.random() * 100);

      return {
        ticket_id: ticketId,
        draw_id: weeklyDrawId, // Legacy FK to draws.draw_id (NOT NULL constraint)
        wallet_address: walletAddress,
        numbers: ticket.numbers,
        power_number: ticket.powerNumber,
        price_paid: TICKET_PRICE,
        claim_status: 'pending',
        prize_amount: 0,
        // DUAL LOTTERY FIELDS (FK to draws.id)
        assigned_daily_draw_id: dailyId,
        assigned_weekly_draw_id: weeklyId,
        daily_processed: false,
        weekly_processed: false,
      };
    });

    const { error: ticketError } = await supabase
      .from('tickets')
      .insert(ticketsToInsert);

    if (ticketError) {
      logger.error('Ticket insertion failed', {
        error: ticketError.message,
        code: ticketError.code,
        ticketCount: ticketsToInsert.length,
        dailyDrawId,
        weeklyDrawId,
      });
      return NextResponse.json(
        { error: 'Failed to insert tickets', details: ticketError.message },
        { status: 500 }
      );
    }

    // 3. Get current month token from weekly draw (using the id, not draw_id)
    const { data: currentDraw, error: drawError } = await supabase
      .from('draws')
      .select('month_token')
      .eq('id', weeklyId)
      .single();

    if (drawError || !currentDraw) {
      console.error('Failed to fetch draw:', drawError);
      return NextResponse.json(
        { error: 'Failed to fetch draw data' },
        { status: 500 }
      );
    }

    const tokenSymbol = currentDraw.month_token || 'MATIC'; // Default to MATIC (BASE L2)

    // 4. Get current crypto prices (BTC, ETH, Token of Month) with caching
    let updateResult: any = null;
    try {
      const [btcPrice, ethPrice, tokenPrice] = await Promise.all([
        priceCache.get('BTC', () => fetchPriceFromCoinGecko('BTC')),
        priceCache.get('ETH', () => fetchPriceFromCoinGecko('ETH')),
        priceCache.get(tokenSymbol, () => fetchPriceFromCoinGecko(tokenSymbol)),
      ]);

      logger.info('Crypto prices fetched', {
        btcPrice,
        ethPrice,
        tokenPrice,
        tokenSymbol,
        source: 'CoinGecko API (cached)'
      });

      // 5. Update DUAL draw prize pools using RPC function (using id, not draw_id)
      const { data: updateResultData, error: updateError } = await supabase.rpc('update_dual_draw_prize_pools', {
        p_daily_draw_id: dailyId,
        p_weekly_draw_id: weeklyId,
        p_ticket_price: TICKET_PRICE * ticketCount, // Total amount for all tickets
        p_platform_fee_percent: PLATFORM_FEE_PERCENT,
        p_daily_percent: DAILY_PERCENT,
        p_weekly_percent: WEEKLY_PERCENT,
        p_btc_percent: BTC_PERCENT,
        p_eth_percent: ETH_PERCENT,
        p_token_percent: TOKEN_PERCENT,
        p_btc_price: btcPrice,
        p_eth_price: ethPrice,
        p_token_price: tokenPrice,
      });

      updateResult = updateResultData;

      if (updateError) {
        logger.error('Prize pool update failed', {
          error: updateError.message,
          code: updateError.code,
          dailyDrawId,
          weeklyDrawId,
        });

        // ROLLBACK: Delete inserted tickets if prize pool update fails
        await supabase
          .from('tickets')
          .delete()
          .in('ticket_id', ticketsToInsert.map(t => t.ticket_id));

        return NextResponse.json(
          { error: 'Failed to update prize pools', details: updateError.message },
          { status: 500 }
        );
      }
    } catch (priceError) {
      // Fallback to MOCK prices if API fails
      logger.warn('Failed to fetch real prices, using fallback', {
        error: priceError instanceof Error ? priceError.message : 'Unknown error',
        tokenSymbol
      });

      const btcPrice = 108000;
      const ethPrice = 3940;
      const tokenPrice = 1.0;

      // Continue with MOCK prices
      const { data: updateResultData, error: updateError } = await supabase.rpc('update_dual_draw_prize_pools', {
        p_daily_draw_id: dailyId,
        p_weekly_draw_id: weeklyId,
        p_ticket_price: TICKET_PRICE * ticketCount,
        p_platform_fee_percent: PLATFORM_FEE_PERCENT,
        p_daily_percent: DAILY_PERCENT,
        p_weekly_percent: WEEKLY_PERCENT,
        p_btc_percent: BTC_PERCENT,
        p_eth_percent: ETH_PERCENT,
        p_token_percent: TOKEN_PERCENT,
        p_btc_price: btcPrice,
        p_eth_price: ethPrice,
        p_token_price: tokenPrice,
      });

      updateResult = updateResultData;

      if (updateError) {
        logger.error('Prize pool update failed with fallback prices', {
          error: updateError.message,
        });
        await supabase
          .from('tickets')
          .delete()
          .in('ticket_id', ticketsToInsert.map(t => t.ticket_id));

        return NextResponse.json(
          { error: 'Failed to update prize pools', details: updateError.message },
          { status: 500 }
        );
      }
    }

    // 6. Fetch updated draws to get new prize pools
    const { data: dailyDraw } = await supabase
      .from('draws')
      .select('total_prize_usd, draw_type')
      .eq('id', dailyId)
      .single();

    const { data: weeklyDraw } = await supabase
      .from('draws')
      .select('total_prize_usd, draw_type')
      .eq('id', weeklyId)
      .single();

    // 7. Return success response with DUAL lottery info
    return NextResponse.json({
      success: true,
      ticketCount,
      totalCost,
      dailyDrawId: dailyDrawId,
      weeklyDrawId: weeklyDrawId,
      dailyPrizePool: dailyDraw?.total_prize_usd || 0,
      weeklyPrizePool: weeklyDraw?.total_prize_usd || 0,
      tokenSymbol,
      distribution: updateResult || {
        platform_fee: totalCost * (PLATFORM_FEE_PERCENT / 100),
        daily_pool: totalCost * (1 - PLATFORM_FEE_PERCENT / 100) * (DAILY_PERCENT / 100),
        weekly_pool: totalCost * (1 - PLATFORM_FEE_PERCENT / 100) * (WEEKLY_PERCENT / 100),
      },
      message: `Successfully purchased ${ticketCount} ticket(s) for $${totalCost.toFixed(2)}. Participating in BOTH daily (#${dailyDrawId}) and weekly (#${weeklyDrawId}) draws!`,
    });

  } catch (error) {
    logger.error('Ticket purchase failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
