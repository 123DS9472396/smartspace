import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bsrzqffxgvdebyofmhzg.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnpxZmZ4Z3ZkZWJ5b2ZtaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNjEzNDcsImV4cCI6MjA3MjYzNzM0N30.VyCEg70kLhTV2l8ZyG9CfPb00FBdVrlVBcBUhyI88Z8'
);

async function checkCities() {
  // Get all unique cities/districts
  const { data, error } = await supabase
    .from('warehouses')
    .select('city, district')
    .limit(10000);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  const cities = new Map();
  data?.forEach(w => {
    const city = w.city || w.district || 'Unknown';
    cities.set(city, (cities.get(city) || 0) + 1);
  });

  console.log('📊 AVAILABLE CITIES/DISTRICTS IN DATABASE:');
  console.log('=========================================');
  [...cities.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => console.log(`  ${city}: ${count} warehouses`));
  
  console.log('');
  console.log('Total warehouses:', data.length);
}

checkCities();
