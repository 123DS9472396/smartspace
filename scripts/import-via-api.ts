import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface WarehouseRow {
  wh_id: string;
  name: string;
  description: string;
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

function parseSQLValue(value: string): any {
  if (value === 'NULL') return null;
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('ARRAY[')) {
    const content = value.slice(6, -1);
    if (!content) return [];
    return content.split(',').map(v => {
      const trimmed = v.trim();
      if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1).replace(/''/g, "'");
      }
      return trimmed;
    });
  }
  return value;
}

function parseWarehouseRow(rowText: string): WarehouseRow | null {
  try {
    // Remove leading/trailing parentheses and split by commas (respecting nested arrays)
    const cleaned = rowText.trim();
    if (!cleaned.startsWith('(') || !cleaned.endsWith(')')) {
      return null;
    }

    const content = cleaned.slice(1, -1);

    // Simple regex-based parser for SQL INSERT values
    const values: string[] = [];
    let current = '';
    let inQuote = false;
    let inArray = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (char === "'" && content[i - 1] !== '\\') {
        if (inQuote && nextChar === "'") {
          current += "''";
          i++;
        } else {
          inQuote = !inQuote;
          current += char;
        }
      } else if (char === '[' && !inQuote) {
        inArray++;
        current += char;
      } else if (char === ']' && !inQuote) {
        inArray--;
        current += char;
      } else if (char === ',' && !inQuote && inArray === 0) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      values.push(current.trim());
    }

    if (values.length < 33) {
      console.error('⚠️  Row has insufficient fields:', values.length);
      return null;
    }

    return {
      wh_id: parseSQLValue(values[0]),
      name: parseSQLValue(values[1]),
      description: parseSQLValue(values[2]),
      address: parseSQLValue(values[3]),
      city: parseSQLValue(values[4]),
      district: parseSQLValue(values[5]),
      state: parseSQLValue(values[6]),
      pincode: parseSQLValue(values[7]),
      latitude: parseSQLValue(values[8]),
      longitude: parseSQLValue(values[9]),
      total_area: parseInt(parseSQLValue(values[10])),
      capacity: parseInt(parseSQLValue(values[11])),
      price_per_sqft: parseFloat(parseSQLValue(values[12])),
      micro_rental_spaces: parseInt(parseSQLValue(values[13])),
      images: parseSQLValue(values[14]),
      amenities: parseSQLValue(values[15]),
      features: parseSQLValue(values[16]),
      status: parseSQLValue(values[17]),
      occupancy: parseFloat(parseSQLValue(values[18])),
      rating: parseFloat(parseSQLValue(values[19])),
      reviews_count: parseInt(parseSQLValue(values[20])),
      warehouse_type: parseSQLValue(values[21]),
      ownership_certificate: parseSQLValue(values[22]),
      owner_name: parseSQLValue(values[23]),
      owner_email: parseSQLValue(values[24]),
      owner_phone: parseSQLValue(values[25]),
      registration_date: parseSQLValue(values[26]),
      license_valid_upto: parseSQLValue(values[27]),
      total_blocks: parseInt(parseSQLValue(values[28])),
      available_blocks: parseInt(parseSQLValue(values[29])),
      grid_rows: parseInt(parseSQLValue(values[30])),
      grid_cols: parseInt(parseSQLValue(values[31])),
    };
  } catch (error) {
    console.error('❌ Error parsing row:', error);
    return null;
  }
}

async function ensureTableExists() {
  console.log('🔍 Checking if warehouses table exists...');

  const { error } = await supabase
    .from('warehouses')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message.includes('does not exist')) {
      console.error('\n❌ Table "warehouses" does not exist!');
      console.error('📝 Please run the migration first:');
      console.error('   File: supabase/migrations/20251002100000_create_warehouses_full.sql\n');
      return false;
    }
  }

  console.log('✅ Table exists');
  return true;
}

async function importWarehouses() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   WAREHOUSE IMPORT - 10,000 WAREHOUSES            ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Check table exists
  const tableExists = await ensureTableExists();
  if (!tableExists) {
    process.exit(1);
  }

  // Read SQL file
  const sqlPath = join(process.cwd(), 'scripts', 'direct-import.sql');
  console.log('📂 Reading SQL file:', sqlPath);

  const sqlContent = readFileSync(sqlPath, 'utf-8');

  // Extract all value rows
  console.log('🔍 Parsing SQL file...');
  const valuePattern = /\('LIC\d+',[\s\S]*?\)(?=,\n|;\n|\nON)/g;
  const matches = sqlContent.match(valuePattern);

  if (!matches) {
    console.error('❌ No warehouse data found in SQL file');
    process.exit(1);
  }

  console.log(`📦 Found ${matches.length} warehouses to import\n`);

  const warehouses: WarehouseRow[] = [];
  let parseErrors = 0;

  for (const match of matches) {
    const parsed = parseWarehouseRow(match);
    if (parsed) {
      warehouses.push(parsed);
    } else {
      parseErrors++;
    }
  }

  if (parseErrors > 0) {
    console.log(`⚠️  ${parseErrors} rows failed to parse (will be skipped)\n`);
  }

  console.log(`✅ Successfully parsed ${warehouses.length} warehouses\n`);

  // Import in batches
  const batchSize = 100;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < warehouses.length; i += batchSize) {
    const batch = warehouses.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(warehouses.length / batchSize);

    process.stdout.write(`📤 Batch ${batchNum}/${totalBatches} (${batch.length} warehouses)... `);

    try {
      const { error } = await supabase
        .from('warehouses')
        .upsert(batch, {
          onConflict: 'wh_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.log(`❌ FAILED`);
        console.error(`   Error: ${error.message}`);
        failed += batch.length;
      } else {
        console.log(`✅ SUCCESS`);
        imported += batch.length;
      }
    } catch (error: any) {
      console.log(`❌ FAILED`);
      console.error(`   Exception: ${error.message}`);
      failed += batch.length;
    }

    // Progress
    const progress = ((i + batch.length) / warehouses.length * 100).toFixed(1);
    console.log(`   Progress: ${progress}% | ✅ ${imported} imported | ❌ ${failed} failed\n`);
  }

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   IMPORT COMPLETE                                  ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log(`✅ Successfully imported: ${imported} warehouses`);
  console.log(`❌ Failed: ${failed} warehouses\n`);

  // Verify
  console.log('🔍 Verifying database...');
  const { count, error } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error verifying:', error.message);
  } else {
    console.log(`📊 Total warehouses in database: ${count}\n`);
  }

  console.log('✨ All done! Refresh your app to see the data.\n');
}

importWarehouses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
