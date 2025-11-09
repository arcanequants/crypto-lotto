import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TESTING_FEATURES, validateTicketNumbers, validatePowerNumber } from '@/lib/config/lottery';
import { logger } from '@/lib/logging/logger';

/**
 * CHEAT MODE API (TESTING ONLY)
 *
 * Allows admin to pre-set winning numbers for the next draw.
 * ONLY available when TESTING_FEATURES.allowCheatMode is true.
 *
 * Request Body:
 * {
 *   "numbers": [1, 2, 3, 4, 5],
 *   "powerNumber": 10,
 *   "drawType": "daily" | "weekly"  // optional, defaults to "daily"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Winning numbers set for next daily draw",
 *   "drawId": 123,
 *   "winningNumbers": [1, 2, 3, 4, 5],
 *   "powerNumber": 10
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // SECURITY: Only in testing mode
    // ============================================
    if (!TESTING_FEATURES.allowCheatMode) {
      return NextResponse.json({
        error: 'Cheat mode not enabled',
        message: 'This endpoint is only available in testing mode. Set NEXT_PUBLIC_TESTING_MODE=true in .env.local',
      }, { status: 403 });
    }

    // ============================================
    // PARSE REQUEST BODY
    // ============================================
    const body = await request.json();
    const { numbers, powerNumber, drawType = 'daily' } = body;

    // ============================================
    // VALIDATION
    // ============================================

    // Validate main numbers
    const numbersValidation = validateTicketNumbers(numbers);
    if (!numbersValidation.valid) {
      return NextResponse.json({
        error: 'Invalid main numbers',
        message: numbersValidation.error,
      }, { status: 400 });
    }

    // Validate power number
    const powerValidation = validatePowerNumber(powerNumber);
    if (!powerValidation.valid) {
      return NextResponse.json({
        error: 'Invalid power number',
        message: powerValidation.error,
      }, { status: 400 });
    }

    // Validate draw type
    if (drawType !== 'daily' && drawType !== 'weekly') {
      return NextResponse.json({
        error: 'Invalid draw type',
        message: 'drawType must be "daily" or "weekly"',
      }, { status: 400 });
    }

    logger.info('Cheat mode: Setting winning numbers', {
      numbers,
      powerNumber,
      drawType,
    });

    // ============================================
    // FIND NEXT DRAW
    // ============================================

    const now = new Date().toISOString();

    const { data: nextDraw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('draw_type', drawType)
      .eq('executed', false)
      .gt('end_time', now)
      .order('end_time', { ascending: true })
      .limit(1)
      .single();

    if (drawError || !nextDraw) {
      logger.error('No upcoming draw found', { drawType, error: drawError?.message });
      return NextResponse.json({
        error: 'No upcoming draw found',
        message: `Could not find an upcoming ${drawType} draw`,
      }, { status: 404 });
    }

    // ============================================
    // UPDATE DRAW WITH PRE-SET NUMBERS
    // ============================================

    const { error: updateError } = await supabase
      .from('draws')
      .update({
        cheat_mode_winning_numbers: numbers,
        cheat_mode_power_number: powerNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nextDraw.id);

    if (updateError) {
      logger.error('Failed to set winning numbers', { error: updateError.message });
      return NextResponse.json({
        error: 'Failed to set winning numbers',
        message: updateError.message,
      }, { status: 500 });
    }

    logger.info('Cheat mode: Winning numbers set successfully', {
      drawId: nextDraw.id,
      numbers,
      powerNumber,
      endTime: nextDraw.end_time,
    });

    // ============================================
    // RETURN SUCCESS
    // ============================================

    return NextResponse.json({
      success: true,
      message: `Winning numbers set for next ${drawType} draw`,
      drawId: nextDraw.id,
      drawType: nextDraw.draw_type,
      endTime: nextDraw.end_time,
      winningNumbers: numbers,
      powerNumber: powerNumber,
    });

  } catch (error) {
    logger.error('Error in set-winning-numbers API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET endpoint to view if cheat mode numbers are set for next draw
 */
export async function GET(request: NextRequest) {
  try {
    // ============================================
    // SECURITY: Only in testing mode
    // ============================================
    if (!TESTING_FEATURES.allowCheatMode) {
      return NextResponse.json({
        error: 'Cheat mode not enabled',
      }, { status: 403 });
    }

    // Parse query params
    const url = new URL(request.url);
    const drawType = url.searchParams.get('drawType') || 'daily';

    // ============================================
    // FIND NEXT DRAW
    // ============================================

    const now = new Date().toISOString();

    const { data: nextDraw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('draw_type', drawType)
      .eq('executed', false)
      .gt('end_time', now)
      .order('end_time', { ascending: true })
      .limit(1)
      .single();

    if (drawError || !nextDraw) {
      return NextResponse.json({
        error: 'No upcoming draw found',
        message: `Could not find an upcoming ${drawType} draw`,
      }, { status: 404 });
    }

    // ============================================
    // RETURN CHEAT MODE STATUS
    // ============================================

    return NextResponse.json({
      success: true,
      drawId: nextDraw.id,
      drawType: nextDraw.draw_type,
      endTime: nextDraw.end_time,
      cheatModeActive: !!(nextDraw.cheat_mode_winning_numbers && nextDraw.cheat_mode_power_number),
      winningNumbers: nextDraw.cheat_mode_winning_numbers || null,
      powerNumber: nextDraw.cheat_mode_power_number || null,
    });

  } catch (error) {
    logger.error('Error in get cheat mode status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
