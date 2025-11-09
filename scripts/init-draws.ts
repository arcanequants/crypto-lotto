import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initDraws() {
  console.log('🎰 Initializing lottery draws...');

  // Get current time
  const now = new Date();

  // Create DAILY draw (ends in 12 hours)
  const dailyEndTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  // Create WEEKLY draw (ends in 3 days)
  const weeklyEndTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    // Insert DAILY draw
    const { data: dailyDraw, error: dailyError } = await supabase
      .from('draws')
      .insert({
        draw_id: 1,
        draw_type: 'daily',
        end_time: dailyEndTime.toISOString(),
        executed: false,
        total_prize_usd: 15250.50,
        total_tickets: 2847,
        cbbtc_amount: 0.05234,
        weth_amount: 1.2567,
        token_amount: 3450.75,
        month_token: 'MATIC'
      })
      .select()
      .single();

    if (dailyError) {
      console.error('❌ Error creating daily draw:', dailyError);
    } else {
      console.log('✅ Daily draw created:', dailyDraw);
    }

    // Insert WEEKLY draw
    const { data: weeklyDraw, error: weeklyError } = await supabase
      .from('draws')
      .insert({
        draw_id: 1,
        draw_type: 'weekly',
        end_time: weeklyEndTime.toISOString(),
        executed: false,
        total_prize_usd: 87650.25,
        total_tickets: 18923,
        cbbtc_amount: 0.35678,
        weth_amount: 8.9234,
        token_amount: 25780.50,
        month_token: 'MATIC'
      })
      .select()
      .single();

    if (weeklyError) {
      console.error('❌ Error creating weekly draw:', weeklyError);
    } else {
      console.log('✅ Weekly draw created:', weeklyDraw);
    }

    console.log('\n🎉 Draws initialized successfully!');
    console.log(`Daily draw ends: ${dailyEndTime.toLocaleString()}`);
    console.log(`Weekly draw ends: ${weeklyEndTime.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

initDraws();
