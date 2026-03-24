import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, '..', 'database', 'warehouse_submissions.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    // Split SQL content by semicolons to execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        console.error('Statement:', statement);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['warehouse_submissions', 'notifications']);
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('✅ Tables found:', tables?.map(t => t.table_name));
    }
    
    // Check if storage bucket exists
    console.log('\n🗂️ Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error checking buckets:', bucketsError);
    } else {
      const warehouseBucket = buckets?.find(b => b.name === 'warehouse-images');
      if (warehouseBucket) {
        console.log('✅ warehouse-images bucket exists');
      } else {
        console.log('⚠️ warehouse-images bucket not found, creating...');
        
        const { error: createBucketError } = await supabase.storage.createBucket('warehouse-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createBucketError) {
          console.error('❌ Error creating bucket:', createBucketError);
        } else {
          console.log('✅ warehouse-images bucket created');
        }
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log('\nYou can now:');
    console.log('1. List properties as an owner');
    console.log('2. Review submissions as an admin');
    console.log('3. Browse approved warehouses as a seeker');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

setupDatabase();