const url = process.env.SUPABASE_URL + '/rest/v1/activity_logs?type=eq.booking&order=created_at.desc&limit=5';
fetch(url, {
  headers: {
    'apikey': process.env.SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY
  }
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(console.error);
