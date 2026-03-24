import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dgcdprcxizhfubwihslj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnY2RwcmN4aXpoZnVid2loc2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzOTE1MjQsImV4cCI6MjA1MTk2NzUyNH0.5A8WVOGrJ9gQXl1_HJ5n3FaLgZoEKxTrJ_LIZNDz8E0';

const supabase = createClient(supabaseUrl, supabaseKey);

interface CSVWarehouse {
  Warehouse_ID: string;
  Warehouse_Name: string;
  Location: string;
  City: string;
  State: string;
  Pincode: string;
  Total_Size_SqFt: string;
  Available_Size_SqFt: string;
  Pricing_INR_SqFt_Month: string;
  Warehouse_Type: string;
  Cold_Storage: string;
  Temperature_Controlled: string;
  Security_Level: string;
  Accessibility_Road: string;
  Parking_Availability: string;
  Loading_Dock: string;
  Crane_Availability: string;
  Fire_Safety: string;
  Surveillance_System: string;
  Power_Backup: string;
  Distance_to_Highway_km: string;
  Distance_to_Port_km: string;
  Distance_to_Airport_km: string;
  Distance_to_Railway_km: string;
  Internet_Connectivity: string;
  Compliance_Certifications: string;
}

interface WarehouseRecord {
  warehouse_id: string;
  warehouse_name: string;
  location: string;
  city: string;
  state: string;
  pincode: string;
  total_size_sqft: number;
  available_size_sqft: number;
  pricing_inr_sqft_month: number;
  warehouse_type: string;
  cold_storage: boolean;
  temperature_controlled: boolean;
  security_level: string;
  accessibility_road: string;
  parking_availability: boolean;
  loading_dock: boolean;
  crane_availability: boolean;
  fire_safety: boolean;
  surveillance_system: boolean;
  power_backup: boolean;
  distance_to_highway_km: number;
  distance_to_port_km: number;
  distance_to_airport_km: number;
  distance_to_railway_km: number;
  internet_connectivity: boolean;
  compliance_certifications: string;
  is_verified: boolean;
  created_at: string;
  available_area?: number;
}

function parseBoolean(value: string): boolean {
  return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1';
}

function parseNumber(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

function transformCSVToWarehouse(csvRow: CSVWarehouse): WarehouseRecord {
  return {
    warehouse_id: csvRow.Warehouse_ID,
    warehouse_name: csvRow.Warehouse_Name,
    location: csvRow.Location,
    city: csvRow.City,
    state: csvRow.State,
    pincode: csvRow.Pincode,
    total_size_sqft: parseNumber(csvRow.Total_Size_SqFt),
    available_size_sqft: parseNumber(csvRow.Available_Size_SqFt),
    available_area: parseNumber(csvRow.Available_Size_SqFt), // Alias for available_size_sqft
    pricing_inr_sqft_month: parseNumber(csvRow.Pricing_INR_SqFt_Month),
    warehouse_type: csvRow.Warehouse_Type,
    cold_storage: parseBoolean(csvRow.Cold_Storage),
    temperature_controlled: parseBoolean(csvRow.Temperature_Controlled),
    security_level: csvRow.Security_Level,
    accessibility_road: csvRow.Accessibility_Road,
    parking_availability: parseBoolean(csvRow.Parking_Availability),
    loading_dock: parseBoolean(csvRow.Loading_Dock),
    crane_availability: parseBoolean(csvRow.Crane_Availability),
    fire_safety: parseBoolean(csvRow.Fire_Safety),
    surveillance_system: parseBoolean(csvRow.Surveillance_System),
    power_backup: parseBoolean(csvRow.Power_Backup),
    distance_to_highway_km: parseNumber(csvRow.Distance_to_Highway_km),
    distance_to_port_km: parseNumber(csvRow.Distance_to_Port_km),
    distance_to_airport_km: parseNumber(csvRow.Distance_to_Airport_km),
    distance_to_railway_km: parseNumber(csvRow.Distance_to_Railway_km),
    internet_connectivity: parseBoolean(csvRow.Internet_Connectivity),
    compliance_certifications: csvRow.Compliance_Certifications,
    is_verified: Math.random() > 0.3, // Random verification status (70% verified)
    created_at: new Date().toISOString(),
  };
}

async function createTables() {
  console.log('Creating warehouse table...');
  
  // First, create the warehouses table if it doesn't exist
  const { error: tableError } = await supabase.rpc('create_warehouses_table');
  
  if (tableError && !tableError.message.includes('already exists')) {
    console.error('Error creating table:', tableError);
    // If RPC doesn't exist, we'll proceed anyway
  }
  
  console.log('Table creation completed (or already exists)');
}

async function readCSVFile(filePath: string): Promise<CSVWarehouse[]> {
  return new Promise((resolve, reject) => {
    const results: CSVWarehouse[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv.parse({ 
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`Parsed ${results.length} rows from CSV`);
        resolve(results);
      })
      .on('error', reject);
  });
}

async function insertWarehousesBatch(warehouses: WarehouseRecord[], batchSize = 1000) {
  const totalBatches = Math.ceil(warehouses.length / batchSize);
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, warehouses.length);
    const batch = warehouses.slice(start, end);
    
    console.log(`Inserting batch ${i + 1}/${totalBatches} (${batch.length} records)...`);
    
    try {
      const { error } = await supabase
        .from('warehouses')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i + 1}:`, error);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✓ Successfully inserted batch ${i + 1}`);
      }
    } catch (error) {
      console.error(`Exception in batch ${i + 1}:`, error);
      errorCount += batch.length;
    }
    
    // Small delay between batches to avoid overwhelming the database
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return { successCount, errorCount };
}

async function main() {
  try {
    console.log('🏢 Starting Maharashtra Warehouse Dataset Import...\n');
    
    // Find the CSV file
    const csvPath = path.join(__dirname, '..', 'Maharashtra_Warehouse_Dataset_50000.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found at: ${csvPath}`);
      process.exit(1);
    }
    
    console.log(`📄 Found CSV file: ${csvPath}`);
    
    // Create tables
    await createTables();
    
    // Check if data already exists
    const { count } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true });
    
    if (count && count > 0) {
      console.log(`⚠️  Database already contains ${count} warehouse records.`);
      console.log('Do you want to continue? This will add more records.');
      // For now, we'll continue. In production, you might want to ask for confirmation.
    }
    
    // Read and parse CSV
    console.log('\n📖 Reading CSV file...');
    const csvData = await readCSVFile(csvPath);
    
    if (csvData.length === 0) {
      console.error('❌ No data found in CSV file');
      process.exit(1);
    }
    
    console.log(`✓ Successfully parsed ${csvData.length} warehouse records`);
    
    // Transform data
    console.log('\n🔄 Transforming data...');
    const warehouses: WarehouseRecord[] = csvData.map(transformCSVToWarehouse);
    
    // Validate data
    const validWarehouses = warehouses.filter(w => w.warehouse_name && w.city && w.state);
    console.log(`✓ ${validWarehouses.length} valid warehouse records ready for import`);
    
    if (validWarehouses.length !== warehouses.length) {
      console.log(`⚠️  Filtered out ${warehouses.length - validWarehouses.length} invalid records`);
    }
    
    // Insert data in batches
    console.log('\n💾 Inserting warehouses into database...');
    const { successCount, errorCount } = await insertWarehousesBatch(validWarehouses);
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} warehouses`);
    console.log(`❌ Failed to import: ${errorCount} warehouses`);
    console.log(`📈 Success rate: ${((successCount / validWarehouses.length) * 100).toFixed(1)}%`);
    
    // Verify final count
    const { count: finalCount } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n🎉 Total warehouses in database: ${finalCount}`);
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main();
}

export { main as importWarehouses };
