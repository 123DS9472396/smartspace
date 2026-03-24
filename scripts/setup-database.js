#!/usr/bin/env node

/**
 * Database Setup Script for SmartWarehouse
 * 
 * This script helps set up the database tables and policies for the warehouse management system.
 * Run this script after setting up your Supabase project.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please add these to your .env file and try again.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up SmartWarehouse database...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'warehouse_submissions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Executing database schema...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }

    console.log('✅ Database schema created successfully!');
    
    // Create storage buckets
    console.log('📦 Setting up storage buckets...');
    
    const buckets = [
      { name: 'warehouse-images', public: true },
      { name: 'warehouse-documents', public: false }
    ];

    for (const bucket of buckets) {
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.public 
          ? ['image/jpeg', 'image/png', 'image/webp']
          : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      });

      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error(`❌ Error creating bucket ${bucket.name}:`, bucketError);
      } else {
        console.log(`✅ Bucket '${bucket.name}' ready`);
      }
    }

    console.log('\n🎉 Database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update your .env file with the correct Supabase URL and keys');
    console.log('2. Run the application with: npm run dev');
    console.log('3. Test the warehouse submission flow');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupDatabase();
