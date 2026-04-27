import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const DEMO_OWNER_ID = '550e8400-e29b-41d4-a716-446655440002';

  console.log(`🔗 Scanning for unassigned warehouses to link to Demo Owner (${DEMO_OWNER_ID})...`);

  const DUMMY_CSV_OWNER = '550e8400-e29b-41d4-a716-0000000000a2';

  let { data, error: fetchErr } = await supabase
    .from('warehouses')
    .select('id, owner_id')
    .or(`owner_id.eq.${DUMMY_CSV_OWNER},owner_id.is.null,owner_id.eq.`);

  if (fetchErr) {
    console.error("❌ Error fetching:", fetchErr);
    process.exit(1);
  }

  console.log(`Found ${data?.length || 0} warehouses assigned to dummy owner or unassigned.`);

  // Perform bulk update
  console.log("Executing bulk update...");
  let { error: updateErr } = await supabase
    .from('warehouses')
    .update({ owner_id: DEMO_OWNER_ID })
    .or(`owner_id.eq.${DUMMY_CSV_OWNER},owner_id.is.null,owner_id.eq.`);

  if (updateErr) {
    console.error("❌ Error updating:", updateErr);
    process.exit(1);
  }

  console.log("✅ Successfully linked all CSV warehouses to the Demo Owner account!");
}

main();
