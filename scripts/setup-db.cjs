const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://dgcdprcxizhfubwihslj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnY2RwcmN4aXpoZnVid2loc2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzOTE1MjQsImV4cCI6MjA1MTk2NzUyNH0.5A8WVOGrJ9gQXl1_HJ5n3FaLgZoEKxTrJ_LIZNDz8E0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createWarehousesTable() {
  console.log('🏗️  Creating warehouses table...');
  
  // First, let's check if the table exists by trying to query it
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('id')
      .limit(1);
    
    if (error && error.message.includes('relation "public.warehouses" does not exist')) {
      console.log('❌ Warehouses table does not exist. It needs to be created manually in Supabase.');
      console.log('📋 Please go to your Supabase dashboard and create the table with the following structure:');
      console.log(`
CREATE TABLE warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_name TEXT NOT NULL,
  warehouse_licence_number TEXT NOT NULL,
  warehouse_address TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  capacity_mt INTEGER NOT NULL,
  registration_date DATE NOT NULL,
  licence_valid_upto DATE NOT NULL,
  owner_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  micro_rental_spaces INTEGER NOT NULL,
  owner_email TEXT NOT NULL,
  pricing_inr_sqft_month INTEGER NOT NULL,
  warehouse_type TEXT NOT NULL,
  total_size_sqft INTEGER NOT NULL,
  latitude REAL,
  longitude REAL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON warehouses FOR SELECT USING (true);
      `);
      return false;
    } else if (error) {
      console.log('⚠️  Error checking table:', error.message);
      return false;
    } else {
      console.log('✅ Warehouses table exists and is accessible');
      return true;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testInsert() {
  console.log('🧪 Testing warehouse insert...');
  
  const testWarehouse = {
    warehouse_name: "Test Warehouse",
    warehouse_licence_number: "TEST_LIC_001",
    warehouse_address: "Test Address, Test City",
    district: "Test District",
    city: "Test City",
    state: "Maharashtra",
    capacity_mt: 100,
    registration_date: "2024-01-01",
    licence_valid_upto: "2025-12-31",
    owner_name: "Test Owner",
    contact_number: "+919876543210",
    micro_rental_spaces: 10,
    owner_email: "test@example.com",
    pricing_inr_sqft_month: 25,
    warehouse_type: "General Storage",
    total_size_sqft: 1000,
    latitude: 19.0760,
    longitude: 72.8777,
    is_verified: true,
    is_active: true
  };
  
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .insert([testWarehouse])
      .select();
    
    if (error) {
      console.log('❌ Test insert failed:', error.message);
      console.log('Error details:', error);
      return false;
    } else {
      console.log('✅ Test insert successful');
      console.log('Inserted record ID:', data[0]?.id);
      
      // Clean up test record
      await supabase
        .from('warehouses')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test record cleaned up');
      return true;
    }
  } catch (error) {
    console.error('❌ Test insert exception:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Warehouse Table Setup & Test');
  console.log('================================\n');
  
  const tableExists = await createWarehousesTable();
  
  if (tableExists) {
    const insertWorks = await testInsert();
    
    if (insertWorks) {
      console.log('\n🎉 Database is ready for warehouse import!');
      console.log('You can now run: npm run import-warehouses');
    } else {
      console.log('\n❌ Database has issues. Please check the table structure.');
    }
  } else {
    console.log('\n⚠️  Please create the warehouses table first using the SQL provided above.');
    console.log('Then run this script again to test the setup.');
  }
}

main().catch(console.error);
