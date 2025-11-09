import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = 'https://fjxbuyxephlfoivcpckd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeGJ1eXhlcGhsZm9pdmNwY2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODk5ODUsImV4cCI6MjA3NjQ2NTk4NX0.rG9bnI_MaAnpimEi5C9MFwYRaH-3Het0hJby9m2LlF8';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting Live Prize Pools migration...\n');

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase-migration-live-prize-pools.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📝 SQL length:', migrationSQL.length, 'characters\n');

    // Note: Supabase JS client doesn't support raw SQL execution
    // We need to use the Supabase REST API or PostgreSQL client
    // For now, let's use the REST API approach

    console.log('⚠️  Note: Cannot execute raw SQL via JS client');
    console.log('📋 Please execute the SQL manually in Supabase Dashboard:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd/sql');
    console.log('2. Copy the contents of: supabase-migration-live-prize-pools.sql');
    console.log('3. Paste and run in the SQL Editor\n');

    console.log('💡 Alternative: Execute migration via PostgreSQL client');
    console.log('   We can try using the Supabase API endpoint instead...\n');

    // Try using fetch to call Supabase's SQL endpoint (if available)
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n📋 Manual steps required:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Execute the migration file manually');
      return;
    }

    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', data);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Please execute manually in Supabase Dashboard');
  }
}

runMigration();
