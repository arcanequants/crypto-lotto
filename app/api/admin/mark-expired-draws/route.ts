import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * ADMIN UTILITY: Mark Expired Draws as Executed
 *
 * This endpoint marks all draws with past end_time as executed=true
 * so the CRON job can create fresh draws.
 */
export async function GET() {
  try {
    const now = new Date().toISOString();

    // Find all expired draws (past end_time) that are not yet executed
    const { data: expiredDraws, error: fetchError } = await supabase
      .from('draws')
      .select('id, draw_id, draw_type, end_time')
      .lt('end_time', now)
      .eq('executed', false);

    if (fetchError) {
      console.error('Error fetching expired draws:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredDraws || expiredDraws.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired draws found',
        count: 0,
      });
    }

    console.log(`Found ${expiredDraws.length} expired draws:`, expiredDraws);

    // Mark them as executed
    const { error: updateError } = await supabase
      .from('draws')
      .update({ executed: true })
      .lt('end_time', now)
      .eq('executed', false);

    if (updateError) {
      console.error('Error updating draws:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${expiredDraws.length} expired draws as executed`,
      count: expiredDraws.length,
      draws: expiredDraws,
    });

  } catch (error) {
    console.error('Error in mark-expired-draws:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
