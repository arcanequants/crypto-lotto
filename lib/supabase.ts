import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables

// NEW: Lottery type
export type Lottery = {
  lottery_id: number;
  name: string;
  contract_address: string;
  ticket_price: number;
  description: string;
  draw_duration: string;
  number_range: string;
  lottery_type: 'simple' | 'powerball' | 'custom';
  active: boolean;
  created_at: string;
  deactivated_at?: string;
  deactivation_reason?: string;
  total_volume?: number;
  total_tickets?: number;
  last_updated?: string;
};

export type Draw = {
  id: number;
  lottery_id: number; // NEW: FK to lotteries
  draw_number: number;
  draw_date: string;
  winning_numbers: number[];
  power_number: number;
  prize_pool: number;
  status: 'open' | 'pending' | 'drawn' | 'completed';
  draw_type: 'daily' | 'weekly';
  // Crypto amounts (Live Prize Pools)
  wbtc_amount?: number;
  eth_amount?: number;
  cbbtc_amount?: number; // BASE uses cbBTC
  weth_amount?: number;
  token_amount?: number;
  token_symbol?: string;
  total_prize_usd?: number;
  // Dual lottery specific
  rollover_tier_5_1?: number;
  rollover_tier_5_0?: number;
  rollover_tier_4_1?: number;
  month_token?: string;
  executed_at?: string;
  platform_fee_collected?: number;
  created_at: string;
};

export type Ticket = {
  id: number;
  lottery_id: number; // NEW: FK to lotteries
  ticket_id?: string;
  draw_id: number;
  wallet_address: string; // FIXED: era user_wallet
  numbers: number[]; // FIXED: era selected_numbers
  power_number: number;
  claimed?: boolean; // Columna antigua
  prize_tier?: number;
  created_at: string; // FIXED: era purchase_date
  claim_status: 'pending' | 'claimed';
  claimed_at: string | null;
  prize_amount: number;
  price_paid: number;
  matches?: number;
  prize_won?: number;

  // Dual lottery fields
  assigned_daily_draw_id?: number;
  assigned_weekly_draw_id?: number;

  // Daily lottery results
  daily_processed?: boolean;
  daily_winner?: boolean;
  daily_tier?: string;
  daily_prize_amount?: number;
  daily_claimed?: boolean;
  daily_claimed_at?: string;

  // Weekly lottery results
  weekly_processed?: boolean;
  weekly_winner?: boolean;
  weekly_tier?: string;
  weekly_prize_amount?: number;
  weekly_claimed?: boolean;
  weekly_claimed_at?: string;

  // Optional draw info (populated when joining with draws table)
  draw?: {
    status: 'pending' | 'drawn' | 'completed';
    draw_date?: string;
    winning_numbers?: number[];
    power_number?: number;
  };
};
