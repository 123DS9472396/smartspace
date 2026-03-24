// PASTE THIS IN BROWSER CONSOLE (F12) - Press Enter after pasting

// Check what the browser is actually fetching
console.clear();
console.log('🔍 CHECKING SUPABASE CONNECTION...\n');

// Test direct Supabase query
fetch('https://your-supabase-url.supabase.co/rest/v1/warehouses?select=name,city,state,status,submission_id&submission_id=not.is.null', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Direct warehouse query result:', data);
  console.log('Found', data.length, 'warehouses with submission_id');
})
.catch(err => console.error('❌ Error:', err));

// Check approved submissions
fetch('https://your-supabase-url.supabase.co/rest/v1/warehouse_submissions?select=name,city,status&status=eq.approved', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Approved submissions query result:', data);
  console.log('Found', data.length, 'approved submissions');
})
.catch(err => console.error('❌ Error:', err));

console.log('\n⏳ Waiting for results...');
