// Run Supabase Migration Script
// Usage: npx tsx scripts/run-migration.ts

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function runMigration() {
  console.log('🚀 Running SQL migration...')
  console.log('   Supabase URL:', supabaseUrl)

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase-migration-metrics-tracking.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  console.log(`📄 Migration file loaded: ${sql.split('\n').length} lines\n`)

  // We'll use Supabase's postgres connection to run raw SQL
  // The SQL file is designed to be idempotent (CREATE IF NOT EXISTS)

  try {
    // For Supabase, we need to use the SQL Editor or run via connection string
    // Let's try using fetch to Supabase's REST API with raw SQL

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Migration failed:', error)

      // Fallback: Print instructions for manual execution
      console.log('\n⚠️ Automatic execution failed. Please run manually:')
      console.log('\n1. Open Supabase SQL Editor:')
      console.log('   https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd/editor')
      console.log('\n2. Copy and paste this SQL:\n')
      console.log('---START SQL---')
      console.log(sql)
      console.log('---END SQL---')
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ Migration completed successfully!')
    console.log('   Result:', result)
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n⚠️ Automatic execution failed. Manual steps:')
    console.log('\n1. Open: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd/editor')
    console.log('2. Copy SQL from: supabase-migration-metrics-tracking.sql')
    console.log('3. Paste and click RUN')
    process.exit(1)
  }
}

runMigration()
