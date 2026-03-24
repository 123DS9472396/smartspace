import { supabase } from '../client/lib/supabase';
import fs from 'fs';
import path from 'path';

async function deployDatabaseSchema() {
  try {
    console.log('🚀 Deploying warehouse_submissions schema to Supabase...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../database/warehouse_submissions.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements (handle multi-line statements)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`\n▶️  Executing statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 100) + '...');
        
        try {
          const { error } = await supabase.rpc('execute_sql', { sql_query: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with other statements
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err);
        }
      }
    }
    
    console.log('\n🎉 Database schema deployment completed!');
    
    // Verify the tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const { data: submissions } = await supabase
      .from('warehouse_submissions')
      .select('*')
      .limit(1);
    
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    console.log('✅ warehouse_submissions table:', submissions !== null ? 'EXISTS' : 'NOT FOUND');
    console.log('✅ notifications table:', notifications !== null ? 'EXISTS' : 'NOT FOUND');
    
  } catch (error) {
    console.error('💥 Database deployment failed:', error);
  }
}

// Alternative approach: Direct SQL execution
async function deployWithDirectSQL() {
  try {
    console.log('🚀 Attempting direct SQL execution...');
    
    // Try creating tables one by one
    const createSubmissionsTable = `
      CREATE TABLE IF NOT EXISTS warehouse_submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pincode TEXT NOT NULL,
        total_area INTEGER NOT NULL,
        price_per_sqft INTEGER NOT NULL,
        amenities TEXT[] DEFAULT '{}',
        features TEXT[] DEFAULT '{}',
        image_urls TEXT[] DEFAULT '{}',
        document_urls JSONB DEFAULT '{}',
        ocr_results JSONB DEFAULT '{}',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_notes TEXT,
        rejection_reason TEXT,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`;
    
    const { error: tableError } = await supabase.rpc('execute_sql', { 
      sql_query: createSubmissionsTable 
    });
    
    if (tableError) {
      console.log('⚠️  RPC method not available, tables may need to be created manually in Supabase dashboard');
      console.log('📋 Use this SQL in Supabase SQL Editor:');
      console.log('\n' + createSubmissionsTable);
    } else {
      console.log('✅ warehouse_submissions table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Direct SQL execution failed:', error);
    console.log('\n📝 Manual Setup Required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the warehouse_submissions.sql file');
    console.log('3. Run the SQL script manually');
  }
}

if (require.main === module) {
  deployWithDirectSQL();
}

export { deployDatabaseSchema, deployWithDirectSQL };