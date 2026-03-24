import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('🔍 Checking database data...\n');
  
  const { data, error } = await supabase
    .from('warehouses')
    .select('id, occupancy, contact_phone, contact_email, images, warehouse_type')
    .limit(10);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  console.log('📊 Sample warehouse data:\n');
  data.forEach((w, i) => {
    console.log(`--- Warehouse ${i + 1} ---`);
    console.log(`  ID: ${w.id.substring(0, 8)}...`);
    console.log(`  Occupancy: ${w.occupancy} (${typeof w.occupancy})`);
    console.log(`  Contact Phone: ${w.contact_phone}`);
    console.log(`  Contact Email: ${w.contact_email}`);
    console.log(`  Warehouse Type: ${w.warehouse_type}`);
    console.log(`  Images: ${Array.isArray(w.images) ? w.images.length + ' images' : w.images}`);
    if (w.images && w.images[0]) {
      console.log(`  First Image: ${w.images[0].substring(0, 50)}...`);
    }
    console.log('');
  });
  
  // Check occupancy distribution
  const { data: stats } = await supabase
    .from('warehouses')
    .select('occupancy')
    .limit(1000);
  
  if (stats) {
    const below1Percent = stats.filter(w => w.occupancy < 0.01).length;
    const between1And50 = stats.filter(w => w.occupancy >= 0.01 && w.occupancy < 0.5).length;
    const between50And100 = stats.filter(w => w.occupancy >= 0.5 && w.occupancy <= 1).length;
    const above100 = stats.filter(w => w.occupancy > 1).length;
    
    console.log('📈 Occupancy Distribution (first 1000 records):');
    console.log(`  Below 1% (0.01): ${below1Percent}`);
    console.log(`  1-50%: ${between1And50}`);
    console.log(`  50-100%: ${between50And100}`);
    console.log(`  Above 100% (stored as percentage): ${above100}`);
  }
}

checkData();
