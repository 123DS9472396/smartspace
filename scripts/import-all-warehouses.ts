import { createClient } from '@supabase/supabase-js';
import { allMaharashtraWarehouses, type WarehouseData } from '../client/data/enhanced-warehouses';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SupabaseWarehouse {
  wh_id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  total_area: number;
  capacity: number;
  price_per_sqft: number;
  micro_rental_spaces: number;
  images: string[];
  amenities: string[];
  features: string[];
  status: string;
  occupancy: number;
  rating: number;
  reviews_count: number;
  warehouse_type: string;
  ownership_certificate: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  registration_date: string;
  license_valid_upto: string;
  total_blocks: number;
  available_blocks: number;
  grid_rows: number;
  grid_cols: number;
}

function convertToSupabaseFormat(warehouse: WarehouseData): SupabaseWarehouse {
  const totalBlocks = Math.ceil(warehouse.size / 1000);
  const availableBlocks = Math.ceil(totalBlocks * (1 - warehouse.occupancy / 100));

  return {
    wh_id: warehouse.whId,
    name: warehouse.name,
    description: warehouse.description || `${warehouse.warehouseType} facility located in ${warehouse.district}, Maharashtra. Offering ${warehouse.capacity.toLocaleString()} MT capacity across ${warehouse.size.toLocaleString()} sq ft of premium storage space.`,
    address: warehouse.address,
    city: warehouse.city,
    district: warehouse.district,
    state: warehouse.state,
    pincode: warehouse.address.match(/\d{6}/)?.[0] || '400001',
    latitude: null,
    longitude: null,
    total_area: warehouse.size,
    capacity: warehouse.capacity,
    price_per_sqft: warehouse.pricing,
    micro_rental_spaces: warehouse.microRentalSpaces,
    images: [warehouse.image],
    amenities: warehouse.amenities || [],
    features: [warehouse.warehouseType],
    status: warehouse.status.toLowerCase(),
    occupancy: warehouse.occupancy / 100,
    rating: warehouse.rating,
    reviews_count: warehouse.reviews,
    warehouse_type: warehouse.warehouseType,
    ownership_certificate: warehouse.ownershipCertificate,
    owner_name: warehouse.ownerName,
    owner_email: warehouse.ownerEmail,
    owner_phone: warehouse.contactNumber,
    registration_date: warehouse.registrationDate,
    license_valid_upto: warehouse.licenseValidUpto,
    total_blocks: totalBlocks,
    available_blocks: availableBlocks,
    grid_rows: Math.ceil(Math.sqrt(totalBlocks)),
    grid_cols: Math.ceil(Math.sqrt(totalBlocks))
  };
}

async function importWarehouses() {
  console.log('🚀 Starting warehouse import...');
  console.log(`📦 Total warehouses to import: ${allMaharashtraWarehouses.length}`);

  // Convert all warehouses
  const warehousesToImport = allMaharashtraWarehouses.map(convertToSupabaseFormat);

  // Import in batches of 1000 for better performance
  const batchSize = 1000;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < warehousesToImport.length; i += batchSize) {
    const batch = warehousesToImport.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(warehousesToImport.length / batchSize);

    console.log(`\n📤 Importing batch ${batchNumber}/${totalBatches} (${batch.length} warehouses)...`);

    try {
      const { data, error } = await supabase
        .from('warehouses')
        .upsert(batch, {
          onConflict: 'wh_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Error in batch ${batchNumber}:`, error.message);
        failed += batch.length;
      } else {
        imported += batch.length;
        console.log(`✅ Batch ${batchNumber} imported successfully`);
      }
    } catch (error) {
      console.error(`❌ Exception in batch ${batchNumber}:`, error);
      failed += batch.length;
    }

    // Progress update
    const progress = ((i + batch.length) / warehousesToImport.length * 100).toFixed(1);
    console.log(`📊 Progress: ${progress}% (${imported} imported, ${failed} failed)`);
  }

  console.log('\n🎉 Import complete!');
  console.log(`✅ Successfully imported: ${imported} warehouses`);
  console.log(`❌ Failed: ${failed} warehouses`);

  // Verify import
  console.log('\n🔍 Verifying import...');
  const { count, error } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error verifying import:', error.message);
  } else {
    console.log(`✅ Total warehouses in database: ${count}`);
  }
}

// Run the import
importWarehouses()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
