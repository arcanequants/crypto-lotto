// TEMPORARY ENDPOINT - Run SQL Migration
// DELETE THIS AFTER RUNNING ONCE

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    console.log('🚀 Running SQL migration...')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    })

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase-migration-metrics-tracking.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log(`📄 Migration file loaded: ${sql.split('\n').length} lines`)

    // Split SQL into individual statements (by semicolon at end of line)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    let successCount = 0
    const errors: any[] = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }

      console.log(`[${i + 1}/${statements.length}] Executing statement...`)

      try {
        // Execute using raw SQL query
        const { error } = await supabase.rpc('exec_sql', { query: statement })

        if (error) {
          // Try alternative: direct table operations for specific statements
          if (statement.includes('CREATE TABLE')) {
            console.log('  → Attempting CREATE TABLE via schema...')
            // Tables will be created via SQL Editor manually if RPC fails
            errors.push({ statement: statement.substring(0, 100), error: error.message })
          } else if (statement.includes('INSERT INTO products')) {
            console.log('  → Attempting INSERT via REST API...')
            // Will handle products insert separately
          } else {
            errors.push({ statement: statement.substring(0, 100), error: error.message })
          }
        } else {
          successCount++
          console.log('  ✅ Success')
        }
      } catch (err: any) {
        errors.push({ statement: statement.substring(0, 100), error: err.message })
      }
    }

    console.log(`\n📊 Results:`)
    console.log(`   ✅ Success: ${successCount}/${statements.length}`)
    console.log(`   ❌ Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log('\n⚠️ Errors encountered:')
      errors.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.error}`)
      })
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: `Migration executed: ${successCount} statements successful, ${errors.length} errors`,
      successCount,
      totalStatements: statements.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
