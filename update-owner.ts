import { createClient } from '@supabase/supabase-js';

// Initialize Supabase. Read anon-key/url from .env or hardcode (only for this script)
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const DEMO_OWNER_ID = '550e8400-e29b-41d4-a716-446655440002'; // ID of demo.owner@smartspace.com

  console.log(`🔗 Scanning for unassigned warehouses to link to Demo Owner (${DEMO_OWNER_ID})...`);

  // First, see how many have no owner
  const { data, count, error: fetchErr } = await supabase
    .from('warehouses')
    .select('id, name', { count: 'exact', head: true })
    .is('owner_id', null);

  if (fetchErr) {
    console.error("❌ Error fetching:", fetchErr);
    process.exit(1);
  }

  console.log(`Found ${count} warehouses currently unassigned.`);

  if (count === 0) {
      console.log("Everything is already assigned.");
      process.exit(0);
  }

  // Perform bulk update
  console.log("Executing bulk update...");
  const { error: updateErr } = await supabase
    .from('warehouses')
    .update({ owner_id: DEMO_OWNER_ID })
    .is('owner_id', null);

  if (updateErr) {
    console.error("❌ Error updating:", updateErr);
    process.exit(1);
  }

  console.log("✅ Successfully linked all CSV warehouses to the Demo Owner account!");
}

main();
