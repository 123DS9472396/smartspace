import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabase = createClient(
  'https://bsrzqffxgvdebyofmhzg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA2MTM0NywiZXhwIjoyMDcyNjM3MzQ3fQ.riHDx30ne4wC2xegEbfVoI0OzRE9Ytp_XZmgmSEwrLc'
);

// Generate realistic owner distribution
// Each owner manages ~8-15 warehouses based on their city
const ownerNames = [
  'Rajesh Kumar', 'Suresh Patel', 'Amit Shah', 'Vikram Singh', 'Mahesh Sharma',
  'Pradeep Joshi', 'Rakesh Gupta', 'Anil Verma', 'Deepak Agarwal', 'Sandeep Mehta',
  'Ramesh Iyer', 'Ganesh Rao', 'Prakash Desai', 'Sanjay Patil', 'Mohan Kulkarni',
  'Vijay Nair', 'Ashok Reddy', 'Harish Menon', 'Sunil Bhatt', 'Nitin Jain',
  'Kiran Kumar', 'Manoj Singh', 'Rohit Patel', 'Sachin Shah', 'Varun Sharma',
  'Akash Joshi', 'Pankaj Gupta', 'Rahul Verma', 'Vivek Agarwal', 'Vishal Mehta',
  'Gaurav Iyer', 'Anand Rao', 'Pranav Desai', 'Kunal Patil', 'Shashank Kulkarni',
  'Arun Nair', 'Bharat Reddy', 'Dinesh Menon', 'Girish Bhatt', 'Hemant Jain',
  'Ishaan Kumar', 'Jai Singh', 'Kartik Patel', 'Lalit Shah', 'Manish Sharma',
  'Naveen Joshi', 'Omkar Gupta', 'Piyush Verma', 'Rajat Agarwal', 'Sameer Mehta'
];

// Generate UUIDs based on index
function generateOwnerId(index) {
  // Create deterministic UUID based on index (valid 36-char UUID format)
  const hex = index.toString(16).padStart(12, '0');
  return `550e8400-e29b-41d4-a716-${hex}`;
}

async function fixOwnerIds() {
  console.log('🔧 Fixing warehouse owner_ids...\n');
  console.log('This will distribute warehouses among ~50 owners\n');
  
  // Get all warehouses
  const { data: warehouses, error: fetchError } = await supabase
    .from('warehouses')
    .select('id, wh_id, name, city')
    .order('city', { ascending: true });
  
  if (fetchError) {
    console.error('Error fetching warehouses:', fetchError.message);
    return;
  }
  
  console.log(`Found ${warehouses.length} warehouses to update\n`);
  
  // Group warehouses by city
  const warehousesByCity = {};
  warehouses.forEach(w => {
    const city = w.city || 'Unknown';
    if (!warehousesByCity[city]) {
      warehousesByCity[city] = [];
    }
    warehousesByCity[city].push(w);
  });
  
  console.log('Cities found:', Object.keys(warehousesByCity).length);
  console.log('Distribution:');
  Object.entries(warehousesByCity).forEach(([city, whs]) => {
    console.log(`  ${city}: ${whs.length} warehouses`);
  });
  
  // Assign owners to warehouses
  // Each owner gets ~10-20 warehouses within the same city
  let ownerIndex = 0;
  const updates = [];
  
  for (const [city, cityWarehouses] of Object.entries(warehousesByCity)) {
    // Split city warehouses among multiple owners
    const warehousesPerOwner = Math.ceil(cityWarehouses.length / Math.ceil(cityWarehouses.length / 12));
    
    for (let i = 0; i < cityWarehouses.length; i++) {
      const warehouse = cityWarehouses[i];
      const ownerIdxForThisWarehouse = ownerIndex + Math.floor(i / warehousesPerOwner);
      const ownerId = generateOwnerId(ownerIdxForThisWarehouse % 50);
      
      updates.push({
        id: warehouse.id,
        owner_id: ownerId
      });
    }
    
    // Move to next set of owners for next city
    ownerIndex += Math.ceil(cityWarehouses.length / warehousesPerOwner);
  }
  
  console.log(`\nPrepared ${updates.length} updates...`);
  
  // Batch update in chunks of 100
  const chunkSize = 100;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    
    for (const update of chunk) {
      const { error } = await supabase
        .from('warehouses')
        .update({ owner_id: update.owner_id })
        .eq('id', update.id);
      
      if (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`Error updating ${update.id}:`, error.message);
        }
      } else {
        successCount++;
      }
    }
    
    // Progress update
    console.log(`Progress: ${Math.min(i + chunkSize, updates.length)}/${updates.length}`);
  }
  
  console.log(`\n✅ Updated ${successCount} warehouses`);
  if (errorCount > 0) {
    console.log(`❌ Failed ${errorCount} updates`);
  }
  
  // Verify the fix
  console.log('\n📊 Verification...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('warehouses')
    .select('owner_id')
    .limit(1000);
  
  if (!verifyError && verifyData) {
    const uniqueOwners = [...new Set(verifyData.map(w => w.owner_id))];
    console.log(`Now have ${uniqueOwners.length} unique owners`);
    
    // Show distribution
    const distribution = {};
    verifyData.forEach(w => {
      distribution[w.owner_id] = (distribution[w.owner_id] || 0) + 1;
    });
    
    console.log('\nSample owner distribution:');
    Object.entries(distribution).slice(0, 10).forEach(([ownerId, count]) => {
      console.log(`  ${ownerId}: ${count} warehouses`);
    });
  }
}

fixOwnerIds();
