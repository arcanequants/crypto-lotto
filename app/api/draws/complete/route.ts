import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CompleteDrawRequest {
  drawId: number;
}

/**
 * POST /api/draws/complete
 *
 * Marca un draw como completado y crea un nuevo draw del mismo tipo.
 *
 * Este endpoint se llama después de:
 * - Se ejecutó el draw (se generaron winning numbers)
 * - Se calcularon los ganadores
 * - Todos los premios fueron distribuidos (o después de X días)
 *
 * Flujo:
 * 1. Marca el draw actual como 'completed'
 * 2. Obtiene el draw_type (daily o weekly)
 * 3. Crea un nuevo draw del mismo tipo con prize pool = 0
 * 4. Calcula la próxima draw_date basado en el tipo
 *
 * Request body:
 * {
 *   drawId: 1
 * }
 *
 * Response:
 * {
 *   success: true,
 *   completedDraw: { id: 1, ... },
 *   newDraw: { id: 2, ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CompleteDrawRequest = await request.json();
    const { drawId } = body;

    if (!drawId) {
      return NextResponse.json(
        { error: 'Draw ID required' },
        { status: 400 }
      );
    }

    // 1. Get current draw info
    const { data: currentDraw, error: fetchError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (fetchError || !currentDraw) {
      console.error('Error fetching draw:', fetchError);
      return NextResponse.json(
        { error: 'Draw not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    // 2. Mark current draw as completed
    const { error: updateError } = await supabase
      .from('draws')
      .update({ status: 'completed' })
      .eq('id', drawId);

    if (updateError) {
      console.error('Error updating draw status:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete draw', details: updateError.message },
        { status: 500 }
      );
    }

    // 3. Calculate next draw date
    const drawType = currentDraw.draw_type || 'weekly';
    const nextDrawDate = getNextDrawDate(drawType);

    // 4. Get next draw_number
    const { data: latestDraw } = await supabase
      .from('draws')
      .select('draw_number')
      .order('draw_number', { ascending: false })
      .limit(1)
      .single();

    const nextDrawNumber = (latestDraw?.draw_number || 0) + 1;

    // 5. Create new draw
    const { data: newDraw, error: insertError } = await supabase
      .from('draws')
      .insert({
        draw_number: nextDrawNumber,
        draw_type: drawType,
        draw_date: nextDrawDate,
        status: 'open',
        winning_numbers: null,
        power_number: null,
        wbtc_amount: 0,
        eth_amount: 0,
        token_amount: 0,
        token_symbol: 'SOL', // Default to SOL, can be changed later
        total_prize_usd: 0,
        total_tickets: 0,
        prize_pool: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new draw:', insertError);
      return NextResponse.json(
        { error: 'Failed to create new draw', details: insertError.message },
        { status: 500 }
      );
    }

    // 6. Return success response
    return NextResponse.json({
      success: true,
      completedDraw: {
        id: currentDraw.id,
        draw_number: currentDraw.draw_number,
        status: 'completed',
      },
      newDraw: {
        id: newDraw.id,
        draw_number: newDraw.draw_number,
        draw_type: newDraw.draw_type,
        draw_date: newDraw.draw_date,
        status: newDraw.status,
      },
      message: `Draw #${currentDraw.draw_number} completed. New ${drawType} draw #${nextDrawNumber} created.`,
    });

  } catch (error) {
    console.error('Error in /api/draws/complete:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate next draw date based on draw type
 */
function getNextDrawDate(drawType: 'daily' | 'weekly'): string {
  const now = new Date();

  if (drawType === 'daily') {
    // Next draw: Tomorrow at 8:00 PM
    now.setDate(now.getDate() + 1);
    now.setHours(20, 0, 0, 0);
  } else {
    // Next draw: Next Sunday at 8:00 PM
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    now.setDate(now.getDate() + daysUntilSunday);
    now.setHours(20, 0, 0, 0);
  }

  return now.toISOString();
}
