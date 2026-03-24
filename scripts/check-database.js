import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

// Load environment variables from .env file
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  config({ path: envPath });
} else {
  console.log('No .env file found');
}

// Use Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`Using Supabase URL: ${supabaseUrl}`);

async function checkDatabase() {
  console.log('Checking Supabase database connection...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First, check connection by getting the table schema
    console.log('Checking database schema...');
    const { data: tables, error: schemaError } = await supabase.from('warehouses').select('id').limit(1);
    
    if (schemaError) {
      console.error('Error connecting to database:', schemaError.message);
      return;
    }
    
    console.log('Database connection successful!');
    
    // Check if there are any warehouses
    const { data: warehouses, error, count } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.error('Error fetching warehouses:', error.message);
      return;
    }
    
    console.log(`Total warehouses in database: ${count || 0}`);
    
    if (warehouses && warehouses.length > 0) {
      console.log('Sample warehouse data:');
      console.log(JSON.stringify(warehouses[0], null, 2));
    } else {
      console.log('No warehouses found in the database.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabase();
