import { allMaharashtraWarehouses } from '../client/data/enhanced-warehouses';
import * as fs from 'fs';

console.log('🚀 Generating direct import SQL...');
console.log(`📦 Total warehouses: ${allMaharashtraWarehouses.length}`);

// Generate a single large INSERT with all warehouses
const values = allMaharashtraWarehouses.map((wh, idx) => {
  const totalBlocks = Math.ceil(wh.size / 1000);
  const availableBlocks = Math.ceil(totalBlocks * (1 - wh.occupancy / 100));
  const pincode = wh.address.match(/\d{6}/)?.[0] || '400001';
  const description = wh.description || `${wh.warehouseType} facility located in ${wh.district}, Maharashtra. Offering ${wh.capacity.toLocaleString()} MT capacity across ${wh.size.toLocaleString()} sq ft of premium storage space.`;

  const amenitiesStr = wh.amenities.map(a => `'${a.replace(/'/g, "''")}'`).join(', ');

  return `('${wh.whId}', '${wh.name.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', '${wh.address.replace(/'/g, "''")}', '${wh.city}', '${wh.district}', '${wh.state}', '${pincode}', NULL, NULL, ${wh.size}, ${wh.capacity}, ${wh.pricing}, ${wh.microRentalSpaces}, ARRAY['${wh.image}'], ARRAY[${amenitiesStr}], ARRAY['${wh.warehouseType}'], '${wh.status.toLowerCase()}', ${(wh.occupancy / 100).toFixed(2)}, ${wh.rating.toFixed(1)}, ${wh.reviews}, '${wh.warehouseType}', '${wh.ownershipCertificate}', '${wh.ownerName.replace(/'/g, "''")}', '${wh.ownerEmail}', '${wh.contactNumber}', '${wh.registrationDate}', '${wh.licenseValidUpto}', ${totalBlocks}, ${availableBlocks}, ${Math.ceil(Math.sqrt(totalBlocks))}, ${Math.ceil(Math.sqrt(totalBlocks))}, NULL)`;
});

// Generate SQL in chunks of 500 to avoid too large queries
const chunkSize = 500;
let sql = `-- Direct import of all ${allMaharashtraWarehouses.length} warehouses\n\n`;

for (let i = 0; i < values.length; i += chunkSize) {
  const chunk = values.slice(i, Math.min(i + chunkSize, values.length));
  const chunkNum = Math.floor(i / chunkSize) + 1;
  const totalChunks = Math.ceil(values.length / chunkSize);

  sql += `-- Chunk ${chunkNum}/${totalChunks} (warehouses ${i + 1} to ${Math.min(i + chunkSize, values.length)})\n`;
  sql += `INSERT INTO warehouses (
  wh_id, name, description, address, city, district, state, pincode,
  latitude, longitude, total_area, capacity, price_per_sqft, micro_rental_spaces,
  images, amenities, features, status, occupancy, rating, reviews_count,
  warehouse_type, ownership_certificate, owner_name, owner_email, owner_phone,
  registration_date, license_valid_upto, total_blocks, available_blocks,
  grid_rows, grid_cols, owner_id
) VALUES\n`;

  sql += chunk.join(',\n');
  sql += `\nON CONFLICT (wh_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  total_area = EXCLUDED.total_area,
  capacity = EXCLUDED.capacity,
  price_per_sqft = EXCLUDED.price_per_sqft,
  occupancy = EXCLUDED.occupancy,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  updated_at = now();\n\n`;
}

sql += `-- Verification\nSELECT COUNT(*) as total FROM warehouses;\n`;

// Write to file
const outputPath = '/tmp/cc-agent/57874081/project/scripts/direct-import.sql';
fs.writeFileSync(outputPath, sql, 'utf8');

const sizeInMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
console.log(`\n✅ SQL generated successfully!`);
console.log(`📄 File: ${outputPath}`);
console.log(`📊 Size: ${sizeInMB} MB`);
console.log(`\n✨ Ready to import ${allMaharashtraWarehouses.length} warehouses!`);
