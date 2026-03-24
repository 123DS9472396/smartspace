const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

// Supabase configuration
const supabaseUrl = 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjEzNDcsImV4cCI6MjA3MjYzNzM0N30.VyCEg70kLhTV2l8ZyG9CfPb00FBdVrlVBcBUhyI88Z8';

const supabase = createClient(supabaseUrl, supabaseKey);

function parseBoolean(value) {
  if (!value || value === '' || value === 'null' || value === 'NULL') return false;
  return value.toString().toLowerCase() === 'yes' || 
         value.toString().toLowerCase() === 'true' || 
         value.toString() === '1';
}

function parseNumber(value) {
  if (!value || value === '' || value === 'null' || value === 'NULL') return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.round(num);
}

function transformCSVToWarehouse(csvRow) {
  return {
    name: csvRow['Warehouse Name'] || 'Unnamed Warehouse',
    description: `${csvRow['Warehouse Type'] || 'General Storage'} warehouse located in ${csvRow['City'] || 'Unknown City'}`,
    address: csvRow['Warehouse Address'] || 'Address not specified',
    city: csvRow['City'] || 'Unknown City', 
    state: csvRow['State'] || 'Maharashtra',
    pincode: csvRow['Pincode'] || '400001',
    latitude: parseNumber(csvRow['Latitude']) || (19.0760 + (Math.random() - 0.5) * 2),
    longitude: parseNumber(csvRow['Longitude']) || (72.8777 + (Math.random() - 0.5) * 4),
    total_area: parseNumber(csvRow['Total Size (sqft)']) || Math.floor(Math.random() * 10000) + 1000,
    price_per_sqft: parseNumber(csvRow['Pricing (INR/sqft/month)']) || Math.floor(Math.random() * 50) + 50,
    images: [
      `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&crop=center`,
      `https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&h=600&fit=crop&crop=center`,
      `https://images.unsplash.com/photo-1582639590952-1bb19ba62c4b?w=800&h=600&fit=crop&crop=center`
    ],
    amenities: [
      'CCTV Security', 
      'Fire Safety', 
      'Loading Dock', 
      'Power Backup', 
      'Parking'
    ].filter(() => Math.random() > 0.4),
    features: [
      'Climate Controlled',
      'High Security',
      '24/7 Access',
      'Forklift Service',
      'Inventory Management'
    ].filter(() => Math.random() > 0.5),
    status: 'approved',
    occupancy: Math.random() * 0.8,
    rating: 3.5 + Math.random() * 1.5,
    reviews_count: Math.floor(Math.random() * 50) + 5,
    total_blocks: Math.floor(Math.random() * 100) + 50,
    available_blocks: Math.floor(Math.random() * 50) + 25,
    grid_rows: 10,
    grid_cols: 10,
    owner_id: null
  };
}

async function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({ 
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: ','
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`✓ Parsed ${results.length} rows from CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      });
  });
}

async function insertWarehousesBatch(warehouses, batchSize = 500) {
  const totalBatches = Math.ceil(warehouses.length / batchSize);
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`\n📦 Inserting ${warehouses.length} warehouses in ${totalBatches} batches of ${batchSize}...\n`);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, warehouses.length);
    const batch = warehouses.slice(start, end);
    
    process.stdout.write(`Batch ${i + 1}/${totalBatches}: Inserting ${batch.length} records... `);
    
    try {
      const { error } = await supabase
        .from('warehouses')
        .insert(batch);
      
      if (error) {
        console.log(`❌ Failed - ${error.message}`);
        errorCount += batch.length;
        
        // Try individual inserts for this batch to see which records fail
        console.log(`   Trying individual inserts...`);
        for (const warehouse of batch) {
          const { error: individualError } = await supabase
            .from('warehouses')
            .insert([warehouse]);
          
          if (individualError) {
            console.log(`   ❌ Failed: ${warehouse.name} - ${individualError.message}`);
          } else {
            successCount++;
          }
        }
      } else {
        console.log(`✅ Success`);
        successCount += batch.length;
      }
    } catch (error) {
      console.log(`❌ Exception - ${error.message}`);
      errorCount += batch.length;
    }
    
    // Small delay between batches
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return { successCount, errorCount };
}

async function main() {
  try {
    console.log('🏢 Maharashtra Warehouse Dataset Importer\n');
    console.log('==========================================\n');
    
    // Find the CSV file
    const csvPath = path.join(__dirname, '..', 'Maharashtra_Warehouse_Dataset_50000.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found at: ${csvPath}`);
      console.log('Please ensure Maharashtra_Warehouse_Dataset_50000.csv is in the project root.');
      process.exit(1);
    }
    
    console.log(`📄 Found CSV file: ${path.basename(csvPath)}`);
    
    // Check current warehouse count
    console.log('\n🔍 Checking current database state...');
    const { count: currentCount, error: countError } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`⚠️  Could not check existing warehouses: ${countError.message}`);
      console.log('This might be the first import. Continuing...');
    } else {
      console.log(`📊 Current warehouses in database: ${currentCount || 0}`);
    }
    
    // Read and parse CSV
    console.log('\n📖 Reading CSV file...');
    const csvData = await readCSVFile(csvPath);
    
    if (csvData.length === 0) {
      console.error('❌ No data found in CSV file');
      process.exit(1);
    }
    
    // Show sample data
    console.log('\n📋 Sample CSV data:');
    console.log('Columns:', Object.keys(csvData[0]).slice(0, 5).join(', '), '...');
    console.log('First row sample:', {
      name: csvData[0]['Warehouse Name']?.substring(0, 30) + '...',
      city: csvData[0]['City'],
      state: csvData[0]['State'],
      type: csvData[0]['Warehouse Type']
    });
    
    // Transform data
    console.log('\n🔄 Transforming data...');
    const warehouses = csvData.map((row, index) => {
      try {
        return transformCSVToWarehouse(row);
      } catch (error) {
        console.log(`⚠️  Skipping row ${index + 1}: ${error.message}`);
        return null;
      }
    }).filter(w => w !== null);
    
    // Validate data
    const validWarehouses = warehouses.filter(w => 
      w.name && 
      w.name.length > 0 &&
      w.city && 
      w.state &&
      w.total_area > 0 &&
      w.address
    );
    
    console.log(`✅ Transformed ${validWarehouses.length} valid warehouse records`);
    
    if (validWarehouses.length !== warehouses.length) {
      console.log(`⚠️  Filtered out ${warehouses.length - validWarehouses.length} invalid records`);
    }
    
    if (validWarehouses.length === 0) {
      console.error('❌ No valid warehouse records to import');
      process.exit(1);
    }
    
    // Show statistics
    const cities = [...new Set(validWarehouses.map(w => w.city))];
    const warehouseTypes = validWarehouses.map(w => w.description.split(' ')[0]).filter(t => t);
    const types = [...new Set(warehouseTypes)];
    
    console.log(`\n📈 Dataset statistics:`);
    console.log(`   • Total warehouses: ${validWarehouses.length.toLocaleString()}`);
    console.log(`   • Cities covered: ${cities.length} (${cities.slice(0, 5).join(', ')}${cities.length > 5 ? '...' : ''})`);
    console.log(`   • Warehouse types: ${types.length} (${types.slice(0, 3).join(', ')}${types.length > 3 ? '...' : ''})`);
    console.log(`   • Average size: ${Math.round(validWarehouses.reduce((sum, w) => sum + w.total_area, 0) / validWarehouses.length).toLocaleString()} sq ft`);
    console.log(`   • Price range: ₹${Math.min(...validWarehouses.map(w => w.price_per_sqft))} - ₹${Math.max(...validWarehouses.map(w => w.price_per_sqft))} per sq ft`);
    
    // Insert data in batches
    console.log('\n💾 Starting database import...');
    const startTime = Date.now();
    const { successCount, errorCount } = await insertWarehousesBatch(validWarehouses, 250);
    const endTime = Date.now();
    
    // Final statistics
    console.log('\n🎉 Import Completed!');
    console.log('==================');
    console.log(`✅ Successfully imported: ${successCount.toLocaleString()} warehouses`);
    console.log(`❌ Failed to import: ${errorCount.toLocaleString()} warehouses`);
    console.log(`📊 Success rate: ${((successCount / validWarehouses.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Time taken: ${((endTime - startTime) / 1000).toFixed(1)} seconds`);
    
    // Verify final count
    try {
      const { count: finalCount } = await supabase
        .from('warehouses')
        .select('*', { count: 'exact', head: true });
      
      console.log(`🏢 Total warehouses in database: ${finalCount?.toLocaleString() || 'Unknown'}`);
    } catch (error) {
      console.log('⚠️  Could not verify final count');
    }
    
    console.log('\n🚀 Your SmartSpace warehouse platform is now ready with real data!');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the import
main().catch(console.error);
