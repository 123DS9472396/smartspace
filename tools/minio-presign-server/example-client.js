/* Example Node script: request a presigned URL, upload a file, and update Supabase
   Run: node example-client.js <path-to-file> <submission-id>
   Requires: NODE env variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for Supabase update (or use anon + proper perms)
*/

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function main() {
  const [,, filePathArg, submissionId] = process.argv;
  if (!filePathArg || !submissionId) {
    console.error('Usage: node example-client.js <path-to-file> <submission-id>');
    process.exit(1);
  }

  const file = fs.readFileSync(filePathArg);
  const filename = path.basename(filePathArg);
  const contentType = 'application/octet-stream';

  // 1) get presigned url
  const presignResp = await fetch('http://localhost:3001/presign-upload', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, kind: 'document' })
  });
  const presign = await presignResp.json();
  if (presign.error) throw new Error(presign.error);

  // 2) upload
  const uploadResp = await fetch(presign.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  if (!uploadResp.ok) throw new Error('Upload failed: ' + uploadResp.statusText);

  console.log('Uploaded to', presign.publicUrl);

  // 3) update Supabase record (requires service role key)
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; skipping DB update. Use the returned publicUrl to update a submission record manually.');
    process.exit(0);
  }

  const updateResp = await fetch(`${SUPABASE_URL}/rest/v1/warehouse_submissions?id=eq.${submissionId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ document_urls: [presign.publicUrl] })
  });

  if (!updateResp.ok) {
    const t = await updateResp.text();
    throw new Error('Supabase update failed: ' + updateResp.status + ' ' + t);
  }

  console.log('Supabase updated for submission', submissionId);
}

main().catch(err => { console.error(err); process.exit(1); });
