import { supabase } from '../lib/supabase';

interface CSVWarehouseRecord {
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

export const parseCSV = (csvText: string): CSVWarehouseRecord[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const record: any = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    return record as CSVWarehouseRecord;
  });
};

export const convertCSVRecordToWarehouse = (record: CSVWarehouseRecord) => {
  return {
    warehouse_name: record['Warehouse Name'],
    warehouse_licence_number: record['Warehouse Licence Number'],
    warehouse_address: record['Warehouse Address'],
    district: record['District'],
    city: record['City'],
    state: record['State'],
    capacity_mt: parseInt(record['Capacity (MT)']) || 0,
    registration_date: record['Registration Date'],
    licence_valid_upto: record['Licence Valid Upto'],
    owner_name: record['Owner Name'],
    contact_number: record['Contact Number'],
    micro_rental_spaces: parseInt(record['Micro Rental Spaces']) || 0,
    owner_email: record['Owner Email'],
    pricing_inr_sqft_month: parseFloat(record['Pricing (INR/sqft/month)']) || 0,
    warehouse_type: record['Warehouse Type'],
    total_size_sqft: parseInt(record['Total Size (sqft)']) || 0,
    latitude: null,
    longitude: null,
    is_verified: true, // CSV data is pre-verified
    is_active: true,
    owner_id: null, // Will be set when owners register
  };
};

export const uploadWarehousesToSupabase = async (warehouses: any[], batchSize = 50) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process in batches to avoid hitting database limits
  for (let i = 0; i < warehouses.length; i += batchSize) {
    const batch = warehouses.slice(i, i + batchSize);
    
    try {
      const { error } = await supabase
        .from('warehouses')
        .insert(batch);

      if (error) {
        results.failed += batch.length;
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      } else {
        results.success += batch.length;
        console.log(`Successfully inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      }
    } catch (err) {
      results.failed += batch.length;
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${errorMsg}`);
      console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, err);
    }

    // Add a small delay between batches to avoid overwhelming the database
    if (i + batchSize < warehouses.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
};

export const processCSVFile = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      resolve(csvText);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read CSV file'));
    };
    
    reader.readAsText(file);
  });
};

export const importWarehousesFromCSV = async (csvText: string) => {
  try {
    const records = parseCSV(csvText);
    const warehouses = records.map(convertCSVRecordToWarehouse);
    
    console.log(`Parsed ${warehouses.length} warehouse records from CSV`);
    
    const results = await uploadWarehousesToSupabase(warehouses);
    
    return {
      totalRecords: warehouses.length,
      ...results,
    };
  } catch (error) {
    console.error('Error importing warehouses from CSV:', error);
    throw error;
  }
};

// Function to get unique cities from warehouses for filters
export const getUniqueCities = async () => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('city')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    const cities = [...new Set(data.map(w => w.city))].sort();
    return cities;
  } catch (error) {
    console.error('Error getting unique cities:', error);
    return [];
  }
};

// Function to get unique warehouse types for filters
export const getUniqueWarehouseTypes = async () => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('warehouse_type')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    const types = [...new Set(data.map(w => w.warehouse_type))].sort();
    return types;
  } catch (error) {
    console.error('Error getting unique warehouse types:', error);
    return [];
  }
};
