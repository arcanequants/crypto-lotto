// API ENDPOINT TO APPLY METRICS MIGRATION
// Call this endpoint to create RPC functions in Supabase
// GET /api/admin/apply-metrics-migration

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Supabase configuration',
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📊 Applying metrics migration...')

    // Create get_unique_user_count function
    const { error: error1 } = await supabase.rpc('exec_sql', {
      query: `
CREATE OR REPLACE FUNCTION get_unique_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT LOWER(user_wallet))
  INTO user_count
  FROM tickets;

  RETURN COALESCE(user_count, 0);
END;
$$;
      `,
    })

    if (error1) {
      console.error('Error creating get_unique_user_count:', error1)
      // Try alternative approach: execute SQL directly
      const sql1 = `
CREATE OR REPLACE FUNCTION get_unique_user_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT LOWER(user_wallet))
  INTO user_count
  FROM tickets;

  RETURN COALESCE(user_count, 0);
END;
$$;
      `

      // Note: Supabase doesn't allow CREATE FUNCTION via RPC
      // User needs to run this in SQL Editor manually
      return NextResponse.json({
        success: false,
        error: 'Cannot create functions via API. Please run the SQL migration manually.',
        instructions: [
          '1. Go to Supabase Dashboard > SQL Editor',
          '2. Open supabase-admin-metrics-functions.sql file',
          '3. Copy and paste the SQL',
          '4. Click Run',
          '5. Refresh this page',
        ],
        sql_file: 'supabase-admin-metrics-functions.sql',
        alternative: 'Or use the Supabase CLI: supabase db push',
      })
    }

    // If we got here, functions were created successfully
    const { data: testData, error: testError } = await supabase.rpc('get_user_metrics')

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully!',
      test_result: testData,
      test_error: testError,
    })
  } catch (error) {
    console.error('Error in apply-metrics-migration:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply migration',
        details: error instanceof Error ? error.message : 'Unknown error',
        instructions: [
          'Please apply the migration manually:',
          '1. Go to Supabase Dashboard',
          '2. Navigate to SQL Editor',
          '3. Run supabase-admin-metrics-functions.sql',
        ],
      },
      { status: 500 }
    )
  }
}
