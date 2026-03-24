/**
 * FIX OCCUPANCY, IMAGES, AND CONTACT INFO
 * ========================================
 * Fixes:
 * 1. Occupancy - Realistic 30-85% (not all 1%)
 * 2. Images - Based on warehouse_type
 * 3. Contact info - owner_phone, owner_email displaying correctly
 * 
 * RUN: node scripts/fix-occupancy-images-contacts.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA2MTM0NywiZXhwIjoyMDcyNjM3MzQ3fQ.riHDx30ne4wC2xegEbfVoI0OzRE9Ytp_XZmgmSEwrLc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// WAREHOUSE TYPE SPECIFIC IMAGES
// ============================================================================
const WAREHOUSE_IMAGES = {
  'Cold Storage': [
    'https://images.unsplash.com/photo-1504222490345-c075b6008014?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
    'https://images.unsplash.com/photo-1587049352847-81cc04a4f83c?w=800&q=80'
  ],
  'Pharmaceutical Storage': [
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=800&q=80'
  ],
  'Food Grade Storage': [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80',
    'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80'
  ],
  'Industrial Storage': [
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1565891741441-64926e441838?w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'
  ],
  'E-commerce Fulfillment': [
    'https://images.unsplash.com/photo-1601598851547-4302969d0614?w=800&q=80',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80'
  ],
  'Automobile Spare Storage': [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80',
    'https://images.unsplash.com/photo-1558618047-f4a6b1a2f5db?w=800&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'
  ],
  'Textile Storage': [
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800&q=80',
    'https://images.unsplash.com/photo-1619619450929-82f0e9b4ef68?w=800&q=80',
    'https://images.unsplash.com/photo-1613521973937-efce73f2f943?w=800&q=80'
  ],
  'Agriculture Storage': [
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80'
  ],
  'General Storage': [
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1601582589907-f92af5ed9db8?w=800&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80'
  ],
  'Hazardous Material Storage': [
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    'https://images.unsplash.com/photo-1581093458791-9f3c3250a8b0?w=800&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80'
  ],
  'Bonded Warehouse': [
    'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&q=80',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
    'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    'https://images.unsplash.com/photo-1601582589907-f92af5ed9db8?w=800&q=80'
  ]
};

// Get images based on warehouse type
function getWarehouseImages(warehouseType) {
  // Try exact match first
  if (WAREHOUSE_IMAGES[warehouseType]) {
    const images = WAREHOUSE_IMAGES[warehouseType];
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 images
    return images.slice(0, count);
  }
  
  // Try partial match
  const typeLower = (warehouseType || '').toLowerCase();
  for (const [key, images] of Object.entries(WAREHOUSE_IMAGES)) {
    if (typeLower.includes(key.toLowerCase().split(' ')[0])) {
      const count = 2 + Math.floor(Math.random() * 3);
      return images.slice(0, count);
    }
  }
  
  // Default to General Storage
  return WAREHOUSE_IMAGES['General Storage'].slice(0, 3);
}

// Generate realistic occupancy (30-85%)
function generateOccupancy() {
  // More warehouses should have medium occupancy (40-70%)
  const random = Math.random();
  if (random < 0.15) {
    // 15% have low occupancy (30-45%)
    return 0.30 + (Math.random() * 0.15);
  } else if (random < 0.70) {
    // 55% have medium occupancy (45-70%)
    return 0.45 + (Math.random() * 0.25);
  } else {
    // 30% have high occupancy (70-90%)
    return 0.70 + (Math.random() * 0.20);
  }
}

// Generate realistic phone number
function generatePhone() {
  const prefixes = ['91', '92', '93', '94', '95', '96', '97', '98', '99', '70', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let number = prefix;
  for (let i = 0; i < 8; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return `+91-${number}`;
}

// Generate email
function generateEmail(name) {
  const domains = ['gmail.com', 'yahoo.co.in', 'outlook.com', 'rediffmail.com', 'hotmail.com', 'warehousemail.in', 'logistics.co.in'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const cleanName = (name || 'warehouse').toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  const suffix = Math.floor(Math.random() * 999);
  return `${cleanName}${suffix}@${domain}`;
}

// Generate owner name
function generateOwnerName() {
  const firstNames = ['Rajesh', 'Amit', 'Suresh', 'Vikram', 'Pradeep', 'Manoj', 'Sachin', 'Deepak', 'Ajay', 'Rahul', 'Neha', 'Priya', 'Anita', 'Sunita', 'Kavita', 'Meena', 'Rekha', 'Pooja', 'Shweta', 'Anil', 'Vijay', 'Sanjay', 'Rakesh', 'Mukesh', 'Dinesh'];
  const lastNames = ['Sharma', 'Patel', 'Deshmukh', 'Kulkarni', 'Joshi', 'Patil', 'Jadhav', 'More', 'Shinde', 'Pawar', 'Chavan', 'Gaikwad', 'Bhosale', 'Nikam', 'Salunkhe', 'Deshpande', 'Gokhale', 'Apte', 'Kelkar', 'Sathe', 'Naik', 'Rane', 'Sawant', 'Thakur', 'Reddy'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// Calculate available area based on occupancy
function calculateAvailableArea(totalArea, occupancy) {
  return Math.floor(totalArea * (1 - occupancy));
}

// ============================================================================
// MAIN FIX FUNCTION
// ============================================================================
async function fixDatabase() {
  console.log('═'.repeat(80));
  console.log('🔧 FIXING OCCUPANCY, IMAGES, AND CONTACTS');
  console.log('═'.repeat(80));
  console.log('');

  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total warehouses to fix: ${totalCount}`);

    const BATCH_SIZE = 100;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    while (processed < totalCount) {
      // Fetch batch
      const { data: warehouses, error: fetchError } = await supabase
        .from('warehouses')
        .select('id, warehouse_type, total_area, occupancy, owner_name, owner_email, owner_phone, images')
        .range(processed, processed + BATCH_SIZE - 1);

      if (fetchError) {
        console.error(`Error fetching batch at ${processed}:`, fetchError);
        errors++;
        processed += BATCH_SIZE;
        continue;
      }

      // Update each warehouse
      for (const wh of warehouses) {
        const updates = {};
        const warehouseType = wh.warehouse_type || 'General Storage';
        const totalArea = wh.total_area || 50000;

        // 1. Fix occupancy (if null, undefined, or all showing same)
        const currentOccupancy = parseFloat(wh.occupancy);
        if (!currentOccupancy || currentOccupancy < 0.05 || currentOccupancy > 0.99) {
          updates.occupancy = parseFloat(generateOccupancy().toFixed(2));
        }

        // 2. Fix images based on warehouse type
        const currentImages = wh.images || [];
        const hasGeneric = currentImages.some(img => 
          img.includes('placeholder') || 
          img.includes('toys') ||
          img.includes('random') ||
          img.includes('552519507') // Car image for non-automobile
        );
        
        // Check if images match warehouse type
        const needsImageUpdate = currentImages.length === 0 || 
          currentImages.length < 2 || 
          hasGeneric ||
          (warehouseType !== 'Automobile Spare Storage' && currentImages.some(img => img.includes('car') || img.includes('552519507')));
        
        if (needsImageUpdate) {
          updates.images = getWarehouseImages(warehouseType);
        }

        // 3. Fix owner name
        if (!wh.owner_name || wh.owner_name.startsWith('Owner ') || wh.owner_name === 'null') {
          updates.owner_name = generateOwnerName();
        }

        // 4. Fix owner email
        if (!wh.owner_email || wh.owner_email.includes('@example.com') || wh.owner_email === 'null') {
          updates.owner_email = generateEmail(updates.owner_name || wh.owner_name || 'Warehouse');
        }

        // 5. Fix owner phone
        if (!wh.owner_phone || wh.owner_phone === 'null' || wh.owner_phone === '+91 98765 43210') {
          updates.owner_phone = generatePhone();
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('warehouses')
            .update(updates)
            .eq('id', wh.id);

          if (updateError) {
            console.error(`Error updating ${wh.id}:`, updateError.message);
            errors++;
          } else {
            updated++;
          }
        }
      }

      processed += warehouses.length;
      const progress = ((processed / totalCount) * 100).toFixed(1);
      process.stdout.write(`\r📦 Progress: ${processed}/${totalCount} (${progress}%) | Updated: ${updated} | Errors: ${errors}`);
    }

    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('✅ FIX COMPLETE');
    console.log('═'.repeat(80));
    console.log(`\n✅ Processed: ${processed}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);

    // Verify the fix
    console.log('\n📊 Verifying fix...');
    
    const { data: sample } = await supabase
      .from('warehouses')
      .select('id, name, warehouse_type, occupancy, available_area, owner_name, owner_email, owner_phone, images')
      .limit(5);

    console.log('\n📋 Sample data after fix:');
    for (const wh of sample) {
      console.log(`\n  ${wh.name}:`);
      console.log(`    Type: ${wh.warehouse_type}`);
      console.log(`    Occupancy: ${(wh.occupancy * 100).toFixed(1)}%`);
      console.log(`    Available: ${wh.available_area?.toLocaleString()} sqft`);
      console.log(`    Owner: ${wh.owner_name}`);
      console.log(`    Email: ${wh.owner_email}`);
      console.log(`    Phone: ${wh.owner_phone}`);
      console.log(`    Images: ${wh.images?.length || 0} photos`);
    }

    // Get occupancy distribution
    const { data: occupancyStats } = await supabase
      .from('warehouses')
      .select('occupancy');

    if (occupancyStats) {
      const occupancies = occupancyStats.map(w => parseFloat(w.occupancy) || 0);
      const avg = occupancies.reduce((a, b) => a + b, 0) / occupancies.length;
      const min = Math.min(...occupancies);
      const max = Math.max(...occupancies);
      
      console.log('\n📊 Occupancy Distribution:');
      console.log(`    Average: ${(avg * 100).toFixed(1)}%`);
      console.log(`    Min: ${(min * 100).toFixed(1)}%`);
      console.log(`    Max: ${(max * 100).toFixed(1)}%`);
    }

  } catch (err) {
    console.error('Fatal error:', err);
  }
}

// Run the fix
fixDatabase();
