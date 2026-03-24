import { allMaharashtraWarehouses, type WarehouseData } from '../client/data/enhanced-warehouses';
import * as fs from 'fs';
import * as path from 'path';

function escapeSQL(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (Array.isArray(value)) {
    const escapedItems = value.map(item => `'${String(item).replace(/'/g, "''")}'`);
    return `ARRAY[${escapedItems.join(', ')}]`;
  }
  // String - escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`;
}

function generateInsertStatement(warehouse: WarehouseData): string {
  const totalBlocks = Math.ceil(warehouse.size / 1000);
  const availableBlocks = Math.ceil(totalBlocks * (1 - warehouse.occupancy / 100));
  const pincode = warehouse.address.match(/\d{6}/)?.[0] || '400001';
  const description = warehouse.description || `${warehouse.warehouseType} facility located in ${warehouse.district}, Maharashtra. Offering ${warehouse.capacity.toLocaleString()} MT capacity across ${warehouse.size.toLocaleString()} sq ft of premium storage space.`;

  const values = [
    escapeSQL(warehouse.whId), // wh_id
    escapeSQL(warehouse.name), // name
    escapeSQL(description), // description
    escapeSQL(warehouse.address), // address
    escapeSQL(warehouse.city), // city
    escapeSQL(warehouse.district), // district
    escapeSQL(warehouse.state), // state
    escapeSQL(pincode), // pincode
    'NULL', // latitude
    'NULL', // longitude
    warehouse.size, // total_area
    warehouse.capacity, // capacity
    warehouse.pricing, // price_per_sqft
    warehouse.microRentalSpaces, // micro_rental_spaces
    escapeSQL([warehouse.image]), // images
    escapeSQL(warehouse.amenities || []), // amenities
    escapeSQL([warehouse.warehouseType]), // features
    escapeSQL(warehouse.status.toLowerCase()), // status
    (warehouse.occupancy / 100).toFixed(2), // occupancy
    warehouse.rating.toFixed(1), // rating
    warehouse.reviews, // reviews_count
    escapeSQL(warehouse.warehouseType), // warehouse_type
    escapeSQL(warehouse.ownershipCertificate), // ownership_certificate
    escapeSQL(warehouse.ownerName), // owner_name
    escapeSQL(warehouse.ownerEmail), // owner_email
    escapeSQL(warehouse.contactNumber), // owner_phone
    escapeSQL(warehouse.registrationDate), // registration_date
    escapeSQL(warehouse.licenseValidUpto), // license_valid_upto
    totalBlocks, // total_blocks
    availableBlocks, // available_blocks
    Math.ceil(Math.sqrt(totalBlocks)), // grid_rows
    Math.ceil(Math.sqrt(totalBlocks)), // grid_cols
    'NULL' // owner_id
  ];

  return `(${values.join(', ')})`;
}

console.log('🚀 Generating SQL insert statements...');
console.log(`📦 Total warehouses: ${allMaharashtraWarehouses.length}`);

const sqlFilePath = path.join(process.cwd(), 'scripts', 'insert-warehouses.sql');

// Create SQL header
let sql = `-- Insert all ${allMaharashtraWarehouses.length} warehouses from Maharashtra dataset
-- Generated automatically from enhanced-warehouses.ts
-- Execute this file in your Supabase SQL editor

BEGIN;

`;

// Generate inserts in batches for better readability
const batchSize = 100;
for (let i = 0; i < allMaharashtraWarehouses.length; i += batchSize) {
  const batch = allMaharashtraWarehouses.slice(i, i + batchSize);
  const batchNumber = Math.floor(i / batchSize) + 1;
  const totalBatches = Math.ceil(allMaharashtraWarehouses.length / batchSize);

  sql += `-- Batch ${batchNumber}/${totalBatches} (warehouses ${i + 1} to ${Math.min(i + batchSize, allMaharashtraWarehouses.length)})\n`;
  sql += `INSERT INTO warehouses (
  wh_id, name, description, address, city, district, state, pincode,
  latitude, longitude, total_area, capacity, price_per_sqft, micro_rental_spaces,
  images, amenities, features, status, occupancy, rating, reviews_count,
  warehouse_type, ownership_certificate, owner_name, owner_email, owner_phone,
  registration_date, license_valid_upto, total_blocks, available_blocks,
  grid_rows, grid_cols, owner_id
) VALUES\n`;

  const values = batch.map(wh => generateInsertStatement(wh));
  sql += values.join(',\n');
  sql += '\nON CONFLICT (wh_id) DO UPDATE SET\n';
  sql += `  name = EXCLUDED.name,
  description = EXCLUDED.description,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  district = EXCLUDED.district,
  state = EXCLUDED.state,
  pincode = EXCLUDED.pincode,
  total_area = EXCLUDED.total_area,
  capacity = EXCLUDED.capacity,
  price_per_sqft = EXCLUDED.price_per_sqft,
  micro_rental_spaces = EXCLUDED.micro_rental_spaces,
  images = EXCLUDED.images,
  amenities = EXCLUDED.amenities,
  features = EXCLUDED.features,
  status = EXCLUDED.status,
  occupancy = EXCLUDED.occupancy,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  warehouse_type = EXCLUDED.warehouse_type,
  ownership_certificate = EXCLUDED.ownership_certificate,
  owner_name = EXCLUDED.owner_name,
  owner_email = EXCLUDED.owner_email,
  owner_phone = EXCLUDED.owner_phone,
  registration_date = EXCLUDED.registration_date,
  license_valid_upto = EXCLUDED.license_valid_upto,
  total_blocks = EXCLUDED.total_blocks,
  available_blocks = EXCLUDED.available_blocks,
  grid_rows = EXCLUDED.grid_rows,
  grid_cols = EXCLUDED.grid_cols,
  updated_at = now();\n\n`;

  console.log(`✅ Generated batch ${batchNumber}/${totalBatches}`);
}

sql += `
COMMIT;

-- Verify the import
SELECT
  COUNT(*) as total_warehouses,
  COUNT(DISTINCT district) as total_districts,
  COUNT(DISTINCT warehouse_type) as warehouse_types,
  ROUND(AVG(rating)::numeric, 2) as avg_rating,
  ROUND(AVG(price_per_sqft)::numeric, 2) as avg_price_per_sqft,
  SUM(total_area) as total_area_sqft,
  SUM(capacity) as total_capacity_mt
FROM warehouses;

SELECT
  district,
  COUNT(*) as count,
  ROUND(AVG(rating)::numeric, 2) as avg_rating,
  ROUND(AVG(price_per_sqft)::numeric, 2) as avg_price
FROM warehouses
GROUP BY district
ORDER BY count DESC;
`;

// Write to file
fs.writeFileSync(sqlFilePath, sql, 'utf8');

console.log(`\n✅ SQL file generated successfully!`);
console.log(`📄 File location: ${sqlFilePath}`);
console.log(`📊 File size: ${(fs.statSync(sqlFilePath).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`\n📝 Instructions:`);
console.log(`1. Open your Supabase dashboard`);
console.log(`2. Go to SQL Editor`);
console.log(`3. Copy and paste the contents of scripts/insert-warehouses.sql`);
console.log(`4. Click "Run" to execute the import`);
console.log(`\n⏱️  The import will take a few minutes to complete.`);
