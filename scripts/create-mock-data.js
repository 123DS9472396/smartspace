import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const csvPath = join(__dirname, '..', 'Maharashtra_Warehouse_Dataset_50000.csv');

// Load environment variables
config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key in environment variables');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);
console.log(`CSV Path: ${csvPath}`);

// Create mock data if we can't connect to Supabase
async function createMockDataFile() {
  console.log('Creating mock data file for use with the app...');

  // Create a sample of warehouses from the CSV
  const parser = fs.createReadStream(csvPath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true
    }));

  const warehouses = [];
  let count = 0;

  for await (const row of parser) {
    // Only take first 100 records for our mock data
    if (count >= 100) break;
    
    // Convert CSV row to warehouse format
    const warehouse = {
      id: row.ID || `wh-${Math.random().toString(36).substring(2, 10)}`,
      name: row.Name || `Warehouse ${count + 1}`,
      description: row.Description || 'General warehouse for storage and distribution',
      address: row.Address || '123 Industrial Area',
      city: row.City || 'Mumbai',
      state: 'Maharashtra',
      pincode: row.Pincode || '400001',
      latitude: parseFloat(row.Latitude) || null,
      longitude: parseFloat(row.Longitude) || null,
      total_area: parseFloat(row.Total_Area_sqft) || 10000 + Math.floor(Math.random() * 90000),
      price_per_sqft: parseFloat(row.Price_Per_Sqft) || 15 + Math.floor(Math.random() * 35),
      images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80'],
      amenities: (row.Amenities || 'Storage,Security,Parking').split(','),
      features: (row.Features || 'Loading Bay,Office Space').split(','),
      status: 'approved',
      occupancy: Math.floor(Math.random() * 100),
      rating: 3.5 + Math.random() * 1.5,
      reviews_count: Math.floor(Math.random() * 50),
      total_blocks: Math.floor(Math.random() * 10) + 1,
      available_blocks: Math.floor(Math.random() * 5) + 1,
      grid_rows: 10,
      grid_cols: 10,
      owner_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    warehouses.push(warehouse);
    count++;
  }

  // Save to a mock data file for the app to use
  const mockDataPath = join(__dirname, '..', 'client', 'data', 'mock-warehouses.json');
  fs.writeFileSync(mockDataPath, JSON.stringify(warehouses, null, 2));
  
  console.log(`Created mock data with ${warehouses.length} warehouses at ${mockDataPath}`);
  return warehouses;
}

// Create the mock data file
createMockDataFile()
  .then(() => console.log('Mock data created successfully'))
  .catch(err => console.error('Error creating mock data:', err));
