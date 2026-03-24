/**
 * Quick Data Verification Script
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verify() {
  console.log('📋 Verifying warehouse data...\n');
  
  const { data } = await supabase
    .from('warehouses')
    .select('id, name, warehouse_type, images, occupancy, contact_phone, latitude, longitude')
    .limit(5);
  
  console.log('Sample warehouses:');
  data.forEach(w => {
    console.log(`\n${w.name}:`);
    console.log(`  Type: ${w.warehouse_type}`);
    console.log(`  Occupancy: ${(w.occupancy * 100).toFixed(0)}%`);
    console.log(`  Phone: ${w.contact_phone}`);
    console.log(`  Coords: ${w.latitude}, ${w.longitude}`);
    console.log(`  Images: ${w.images?.length || 0} photos`);
    if (w.images?.[0]) {
      console.log(`  First image: ${w.images[0].substring(0, 50)}...`);
    }
  });
  
  // Summary stats
  const { count: totalCount } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });
  
  const { count: withImages } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true })
    .not('images', 'is', null);
  
  const { count: withPhone } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true })
    .not('contact_phone', 'is', null);
  
  const { count: withCoords } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true })
    .not('latitude', 'is', null);
  
  console.log('\n📊 Summary:');
  console.log(`  Total warehouses: ${totalCount}`);
  console.log(`  With images: ${withImages} (${((withImages/totalCount)*100).toFixed(1)}%)`);
  console.log(`  With phone: ${withPhone} (${((withPhone/totalCount)*100).toFixed(1)}%)`);
  console.log(`  With coordinates: ${withCoords} (${((withCoords/totalCount)*100).toFixed(1)}%)`);
}

verify().catch(console.error);
