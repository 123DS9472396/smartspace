import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabase = createClient(
  'https://bsrzqffxgvdebyofmhzg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA2MTM0NywiZXhwIjoyMDcyNjM3MzQ3fQ.riHDx30ne4wC2xegEbfVoI0OzRE9Ytp_XZmgmSEwrLc'
);

// Generate valid UUIDs for owners
function generateOwnerId(index) {
  // Create deterministic valid UUID
  const hex = (index + 1).toString(16).padStart(12, '0');
  return `550e8400-e29b-41d4-a716-${hex}`;
}

async function fixAllOwnerIds() {
  console.log('🔧 Fixing ALL warehouse owner_ids...\n');
  
  // Get total count first
  const { count, error: countError } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error getting count:', countError.message);
    return;
  }
  
  console.log(`Total warehouses in database: ${count}\n`);
  
  // Fetch ALL warehouses in batches
  const batchSize = 1000;
  const allWarehouses = [];
  
  for (let offset = 0; offset < count; offset += batchSize) {
    console.log(`Fetching warehouses ${offset} to ${offset + batchSize}...`);
    
    const { data, error } = await supabase
      .from('warehouses')
      .select('id, wh_id, name, city')
      .range(offset, offset + batchSize - 1)
      .order('city', { ascending: true });
    
    if (error) {
      console.error(`Error fetching batch at ${offset}:`, error.message);
      continue;
    }
    
    allWarehouses.push(...data);
  }
  
  console.log(`\nFetched ${allWarehouses.length} warehouses total\n`);
  
  // Group by city
  const warehousesByCity = {};
  allWarehouses.forEach(w => {
    const city = w.city || 'Unknown';
    if (!warehousesByCity[city]) {
      warehousesByCity[city] = [];
    }
    warehousesByCity[city].push(w);
  });
  
  const cities = Object.keys(warehousesByCity);
  console.log(`Found ${cities.length} cities:`);
  cities.forEach(city => {
    console.log(`  ${city}: ${warehousesByCity[city].length} warehouses`);
  });
  
  // Assign owners: each owner manages 10-15 warehouses in their city
  // Different cities have different owners
  let globalOwnerIndex = 0;
  const updates = [];
  
  for (const city of cities) {
    const cityWarehouses = warehousesByCity[city];
    const warehousesPerOwner = 12; // Each owner manages ~12 warehouses
    const ownersForCity = Math.ceil(cityWarehouses.length / warehousesPerOwner);
    
    console.log(`\n${city}: Assigning to ${ownersForCity} owners`);
    
    for (let i = 0; i < cityWarehouses.length; i++) {
      const warehouse = cityWarehouses[i];
      const localOwnerIdx = Math.floor(i / warehousesPerOwner);
      const ownerId = generateOwnerId(globalOwnerIndex + localOwnerIdx);
      
      updates.push({
        id: warehouse.id,
        owner_id: ownerId
      });
    }
    
    // Move global index for next city
    globalOwnerIndex += ownersForCity;
  }
  
  console.log(`\n📊 Will create approximately ${globalOwnerIndex} unique owners`);
  console.log(`📦 Prepared ${updates.length} warehouse updates`);
  
  // Perform updates in batches
  console.log('\n🔄 Updating database...');
  
  let successCount = 0;
  let errorCount = 0;
  const chunkSize = 50;
  
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    
    // Update each warehouse
    const promises = chunk.map(update => 
      supabase
        .from('warehouses')
        .update({ owner_id: update.owner_id })
        .eq('id', update.id)
    );
    
    const results = await Promise.all(promises);
    
    results.forEach((result, idx) => {
      if (result.error) {
        errorCount++;
        if (errorCount <= 3) {
          console.error(`  Error: ${result.error.message}`);
        }
      } else {
        successCount++;
      }
    });
    
    // Progress every 500
    if ((i + chunkSize) % 500 === 0 || i + chunkSize >= updates.length) {
      console.log(`  Progress: ${Math.min(i + chunkSize, updates.length)}/${updates.length} (${successCount} success, ${errorCount} errors)`);
    }
  }
  
  console.log(`\n✅ Successfully updated ${successCount} warehouses`);
  if (errorCount > 0) {
    console.log(`❌ Failed ${errorCount} updates`);
  }
  
  // Final verification
  console.log('\n📊 Final Verification...');
  
  const { data: verifyData, error: verifyError } = await supabase
    .from('warehouses')
    .select('owner_id, city')
    .limit(5000);
  
  if (!verifyError && verifyData) {
    const uniqueOwners = [...new Set(verifyData.map(w => w.owner_id))];
    console.log(`Unique owners: ${uniqueOwners.length}`);
    
    // Show sample distribution
    const distribution = {};
    verifyData.forEach(w => {
      distribution[w.owner_id] = (distribution[w.owner_id] || 0) + 1;
    });
    
    console.log('\nOwner distribution (first 15):');
    const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
    sorted.slice(0, 15).forEach(([ownerId, count]) => {
      console.log(`  ${ownerId}: ${count} warehouses`);
    });
  }
  
  console.log('\n✅ DONE! View All Properties should now work correctly.');
}

fixAllOwnerIds();
