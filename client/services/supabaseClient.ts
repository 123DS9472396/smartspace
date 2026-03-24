import { createClient } from '@supabase/supabase-js';

// HARDCODED Supabase credentials - ALWAYS use these (no env vars needed)
const SUPABASE_URL = 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjEzNDcsImV4cCI6MjA3MjYzNzM0N30.VyCEg70kLhTV2l8ZyG9CfPb00FBdVrlVBcBUhyI88Z8';

console.log('🚀 SUPABASE CLIENT INITIALIZATION');
console.log('===================================');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_KEY.substring(0, 20) + '...');
console.log('===================================');

// ALWAYS use hardcoded credentials (env vars are unreliable)
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;

// Create a single client instance to avoid duplicate client warnings
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Test the connection immediately
console.log('🧪 Running connection test...');
(async () => {
  try {
    const { count, error } = await supabase.from('warehouses').select('id', { count: 'exact', head: true });
    console.log('===================================');
    if (error) {
      console.error('❌ CONNECTION TEST FAILED');
      console.error('Error:', (error as any).message);
      console.error('Code:', (error as any).code);
      console.error('Details:', (error as any).details);
      console.error('Hint:', (error as any).hint);
    } else {
      console.log('✅ CONNECTION TEST SUCCESS!');
      console.log('Total warehouses found:', count);
      console.log('Database is working perfectly!');
    }
    console.log('===================================');
  } catch (err) {
    console.log('===================================');
    console.error('❌ CONNECTION TEST EXCEPTION');
    console.error('Error:', (err as any).message || err);
    console.log('===================================');
  }
})();
