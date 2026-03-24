import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bsrzqffxgvdebyofmhzg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjEzNDcsImV4cCI6MjA3MjYzNzM0N30.VyCEg70kLhTV2l8ZyG9CfPb00FBdVrlVBcBUhyI88Z8'
);

async function checkOwnerIds() {
  console.log('Checking warehouse owner_ids...\n');
  
  // Get sample of warehouses with owner_id
  const { data, error } = await supabase
    .from('warehouses')
    .select('id, wh_id, name, owner_id')
    .limit(20);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  console.log('Sample warehouses:');
  data.forEach(w => {
    console.log(`  ${w.wh_id}: owner_id = ${w.owner_id}`);
  });
  
  // Check unique owner_ids
  const { data: allData, error: err2 } = await supabase
    .from('warehouses')
    .select('owner_id')
    .limit(1000);
  
  if (err2) {
    console.log('Error:', err2.message);
    return;
  }
  
  const uniqueOwners = [...new Set(allData.map(w => w.owner_id))];
  console.log('\n--- SUMMARY ---');
  console.log('Total warehouses checked:', allData.length);
  console.log('Unique owner_ids:', uniqueOwners.length);
  console.log('Owner IDs:', uniqueOwners);
  
  // Check count per owner
  uniqueOwners.forEach(ownerId => {
    const count = allData.filter(w => w.owner_id === ownerId).length;
    console.log(`Owner ${ownerId}: ${count} warehouses`);
  });
}

checkOwnerIds();
