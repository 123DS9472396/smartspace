import { supabase } from '../client/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

interface CSVWarehouse {
  'Warehouse Name': string;
  'Warehouse Licence Number': string;
  'Warehouse Address': string;
  'District': string;
  'City': string;
  'State': string;
  'Capacity (MT)': string;
  'Registration Date': string;
  'Licence Valid Upto': string;
  'Owner Name': string;
  'Contact Number': string;
  'Micro Rental Spaces': string;
  'Owner Email': string;
  'Pricing (INR/sqft/month)': string;
  'Warehouse Type': string;
  'Total Size (sqft)': string;
}

interface WarehouseData {
  warehouse_name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  warehouse_type: string;
  total_size_sqft: number;
  available_area: number;
  pricing_inr_sqft_month: number;
  amenities: string[];
  features: string[];
  connectivity: string[];
  power_backup: boolean;
  cold_storage: boolean;
  fire_safety: boolean;
  cctv_surveillance: boolean;
  loading_docks: number;
  parking_spaces: number;
  office_space: boolean;
  is_verified: boolean;
  is_active: boolean;
  owner_id: string; // Will be set to a default owner for now
}

interface OwnerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: 'owner';
  company_name: string;
  is_verified: boolean;
}

const DEFAULT_OWNER_ID = '00000000-0000-0000-0000-000000000000'; // We'll create a default owner

// Function to create default owner profiles from CSV data
async function createOwnerProfiles(csvData: CSVWarehouse[]): Promise<Map<string, string>> {
  const ownerMap = new Map<string, string>();
  const uniqueOwners = new Map<string, CSVWarehouse>();

  // Collect unique owners from CSV
  csvData.forEach(row => {
    const key = `${row['Owner Name']}_${row['Owner Email']}`;
    if (!uniqueOwners.has(key)) {
      uniqueOwners.set(key, row);
    }
  });

  console.log(`Creating ${uniqueOwners.size} unique owner profiles...`);

  // Create owner profiles in batches
  const owners: OwnerProfile[] = [];
  let ownerIndex = 0;

  for (const [key, ownerData] of uniqueOwners) {
    const ownerId = `owner-${String(ownerIndex).padStart(6, '0')}-uuid-${Date.now()}`;
    
    owners.push({
      id: ownerId,
      name: ownerData['Owner Name'],
      email: ownerData['Owner Email'],
      phone: ownerData['Contact Number'],
      user_type: 'owner',
      company_name: ownerData['Warehouse Name'],
      is_verified: true
    });

    ownerMap.set(key, ownerId);
    ownerIndex++;
  }

  // Insert owners in batches of 100
  const batchSize = 100;
  for (let i = 0; i < owners.length; i += batchSize) {
    const batch = owners.slice(i, i + batchSize);
    console.log(`Inserting owner batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(owners.length / batchSize)}`);
    
    const { error } = await supabase
      .from('profiles')
      .insert(batch);

    if (error) {
      console.error('Error inserting owner batch:', error);
      throw error;
    }
  }

  console.log(`Created ${owners.length} owner profiles`);
  return ownerMap;
}

// Function to transform CSV row to warehouse data
function transformCSVToWarehouse(row: CSVWarehouse, ownerId: string): WarehouseData {
  const totalSize = parseInt(row['Total Size (sqft)']) || 0;
  const microSpaces = parseInt(row['Micro Rental Spaces']) || 0;
  const availableArea = Math.max(Math.floor(totalSize * 0.7), microSpaces * 100); // Estimate available area
  
  // Extract pincode from address (last 6 digits)
  const pincodeMatch = row['Warehouse Address'].match(/(\d{6})/);
  const pincode = pincodeMatch ? pincodeMatch[1] : '400001';

  // Determine features based on warehouse type
  const warehouseType = row['Warehouse Type'];
  const features: string[] = ['24x7 Security', 'Loading Dock'];
  const amenities: string[] = ['Parking', 'Power Backup'];
  const connectivity: string[] = ['Road Access'];

  let coldStorage = false;
  let powerBackup = true;
  let fireSafety = true;
  let cctvSurveillance = true;

  if (warehouseType.toLowerCase().includes('cold')) {
    coldStorage = true;
    features.push('Temperature Controlled');
    amenities.push('Cold Storage Facility');
  }

  if (warehouseType.toLowerCase().includes('pharma')) {
    features.push('Pharma Compliant', 'Climate Controlled');
    amenities.push('Medical Grade Storage');
  }

  if (warehouseType.toLowerCase().includes('industrial')) {
    features.push('Heavy Machinery Access', 'High Ceiling');
    amenities.push('Industrial Power Supply');
    connectivity.push('Railway Access');
  }

  if (warehouseType.toLowerCase().includes('logistics')) {
    features.push('Cross Docking', 'Sortation Area');
    connectivity.push('Highway Access');
  }

  return {
    warehouse_name: row['Warehouse Name'],
    description: `${row['Warehouse Type']} facility located in ${row['City']}, ${row['State']}. Licensed warehouse with capacity of ${row['Capacity (MT)']} MT.`,
    address: row['Warehouse Address'],
    city: row['City'],
    state: row['State'],
    pincode: pincode,
    warehouse_type: warehouseType,
    total_size_sqft: totalSize,
    available_area: availableArea,
    pricing_inr_sqft_month: parseFloat(row['Pricing (INR/sqft/month)']) || 50,
    amenities: amenities,
    features: features,
    connectivity: connectivity,
    power_backup: powerBackup,
    cold_storage: coldStorage,
    fire_safety: fireSafety,
    cctv_surveillance: cctvSurveillance,
    loading_docks: Math.max(1, Math.floor(totalSize / 10000)), // 1 dock per 10k sqft
    parking_spaces: Math.max(5, Math.floor(totalSize / 5000)), // 1 space per 5k sqft
    office_space: totalSize > 50000,
    is_verified: true,
    is_active: true,
    owner_id: ownerId
  };
}

// Main import function
export async function importWarehousesFromCSV(): Promise<void> {
  try {
    console.log('Starting warehouse import from CSV...');
    
    const csvFilePath = path.resolve('./Maharashtra_Warehouse_Dataset_50000.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    // Read and parse CSV
    const csvData: CSVWarehouse[] = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row: CSVWarehouse) => {
          csvData.push(row);
        })
        .on('end', async () => {
          try {
            console.log(`Parsed ${csvData.length} warehouse records from CSV`);

            // Create owner profiles first
            const ownerMap = await createOwnerProfiles(csvData);

            // Transform and prepare warehouse data
            const warehouses: WarehouseData[] = csvData.map(row => {
              const ownerKey = `${row['Owner Name']}_${row['Owner Email']}`;
              const ownerId = ownerMap.get(ownerKey) || DEFAULT_OWNER_ID;
              return transformCSVToWarehouse(row, ownerId);
            });

            console.log(`Prepared ${warehouses.length} warehouse records for import`);

            // Insert warehouses in batches
            const batchSize = 100;
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < warehouses.length; i += batchSize) {
              const batch = warehouses.slice(i, i + batchSize);
              console.log(`Inserting warehouse batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(warehouses.length / batchSize)}`);

              try {
                const { error } = await supabase
                  .from('warehouses')
                  .insert(batch);

                if (error) {
                  console.error('Error inserting warehouse batch:', error);
                  errorCount += batch.length;
                } else {
                  successCount += batch.length;
                }
              } catch (err) {
                console.error('Batch insertion error:', err);
                errorCount += batch.length;
              }

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`\n=== Import Complete ===`);
            console.log(`Successfully imported: ${successCount} warehouses`);
            console.log(`Errors: ${errorCount} warehouses`);
            console.log(`Total processed: ${warehouses.length} warehouses`);
            
            resolve();
          } catch (error) {
            console.error('Error during import:', error);
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importWarehousesFromCSV()
    .then(() => {
      console.log('Import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}
