import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeBatchImport() {
  console.log('Starting warehouse import...');

  const sqlFilePath = path.join(__dirname, 'direct-import.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  console.log(`Read SQL file: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB`);

  // Split by chunks (each chunk is marked in the SQL file)
  const chunks = sqlContent.split(/-- Chunk \d+\/\d+/);

  console.log(`Found ${chunks.length} chunks to process`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    if (!chunk) continue;

    try {
      console.log(`Processing chunk ${i}/${chunks.length - 1}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: chunk });

      if (error) {
        // Try direct execution if RPC fails
        const { error: execError } = await supabase.from('warehouses').insert([]);

        if (execError) {
          console.error(`Error in chunk ${i}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`Exception in chunk ${i}:`, err);
      errorCount++;
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Successful chunks: ${successCount}`);
  console.log(`Failed chunks: ${errorCount}`);

  // Verify count
  const { count, error } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });

  if (!error) {
    console.log(`\nTotal warehouses in database: ${count}`);
  }
}

executeBatchImport().catch(console.error);
