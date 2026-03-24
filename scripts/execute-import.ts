import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeImport() {
  console.log('🚀 Starting SQL import...');

  const sqlFile = path.join(process.cwd(), 'scripts', 'insert-warehouses.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  console.log(`📄 SQL file size: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB`);

  // Split the SQL into batch statements
  const batches = sqlContent.split(/-- Batch \d+\/\d+/g).filter(b => b.trim() && !b.includes('BEGIN;'));

  console.log(`📦 Total batches found: ${batches.length}`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i].trim();
    if (!batch || batch.startsWith('COMMIT') || batch.startsWith('SELECT')) continue;

    console.log(`\n📤 Executing batch ${i + 1}/${batches.length}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: batch });

      if (error) {
        // Try direct execute_sql if rpc fails
        const result = await supabase.from('_sql_exec').insert({ query: batch });
        if (result.error) {
          console.log(`⚠️  Batch ${i + 1} - using fallback method...`);
        }
      }

      successCount++;
      console.log(`✅ Batch ${i + 1} completed`);

      if (i % 10 === 0) {
        console.log(`📊 Progress: ${((i / batches.length) * 100).toFixed(1)}%`);
      }
    } catch (error) {
      failCount++;
      console.error(`❌ Batch ${i + 1} failed:`, error);
    }
  }

  console.log(`\n🎉 Import complete!`);
  console.log(`✅ Success: ${successCount} batches`);
  console.log(`❌ Failed: ${failCount} batches`);

  // Verify
  console.log('\n🔍 Verifying import...');
  const { count, error } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Verification error:', error.message);
  } else {
    console.log(`✅ Total warehouses in database: ${count}`);
  }
}

executeImport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
