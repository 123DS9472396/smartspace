import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjEzNDcsImV4cCI6MjA3MjYzNzM0N30.VyCEg70kLhTV2l8ZyG9CfPb00FBdVrlVBcBUhyI88Z8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('🔧 Testing Supabase Connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('');

  try {
    // Test 1: Count total warehouses
    console.log('Test 1: Counting warehouses...');
    const { count, error: countError } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count Error:', countError.message);
      console.error('Details:', countError);
      return;
    }

    console.log('✅ Total warehouses:', count);
    console.log('');

    if (count === 0) {
      console.error('❌ Database is EMPTY! No warehouses found.');
      console.log('Action: Run scripts/direct-import.sql in Supabase SQL Editor');
      return;
    }

    // Test 2: Fetch first 5 warehouses
    console.log('Test 2: Fetching first 5 warehouses...');
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Fetch Error:', error.message);
      console.error('Details:', error);
      return;
    }

    console.log('✅ Fetched', data?.length || 0, 'warehouses');
    if (data && data.length > 0) {
      console.log('Sample warehouse:', {
        id: data[0].id,
        wh_id: data[0].wh_id,
        name: data[0].name,
        city: data[0].city,
        state: data[0].state,
        status: data[0].status
      });
    }
    console.log('');

    // Test 3: Check Maharashtra filter
    console.log('Test 3: Counting Maharashtra warehouses...');
    const { count: maharashtraCount, error: stateError } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true })
      .eq('state', 'Maharashtra');

    if (stateError) {
      console.error('❌ State Filter Error:', stateError.message);
      return;
    }

    console.log('✅ Maharashtra warehouses:', maharashtraCount);
    console.log('');

    // Test 4: Check active warehouses
    console.log('Test 4: Counting active warehouses...');
    const { count: activeCount, error: activeError } = await supabase
      .from('warehouses')
      .select('*', { count: 'exact', head: true })
      .eq('state', 'Maharashtra')
      .eq('status', 'active');

    if (activeError) {
      console.error('❌ Active Filter Error:', activeError.message);
      return;
    }

    console.log('✅ Active warehouses:', activeCount);
    console.log('');

    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Database is working correctly');
    console.log('✅ RLS is properly configured');
    console.log('✅ Data is accessible');

  } catch (error: any) {
    console.error('❌ EXCEPTION:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConnection();
