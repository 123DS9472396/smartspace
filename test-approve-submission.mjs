import { createClient } from '@supabase/supabase-js';

const url = 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE || 'PLACEHOLDER_SERVICE_ROLE_KEY';

if (!key || key === 'PLACEHOLDER_SERVICE_ROLE_KEY') {
  console.error('Please set SUPABASE_SERVICE_ROLE env var with a service_role key to run this test.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function approveSubmission(submissionId) {
  console.log('Approving submission', submissionId);
  const { data, error } = await supabase
    .from('warehouse_submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('Update error:', error);
    return;
  }

  console.log('Update result:', data);

  // Check warehouses table for a row with submission_id = submissionId
  const { data: wh, error: whError } = await supabase
    .from('warehouses')
    .select('*')
    .eq('submission_id', submissionId)
    .limit(1)
    .single();

  if (whError && whError.code !== 'PGRST116') { // PGRST116 = No rows found (single)
    console.error('Error querying warehouses:', whError);
    return;
  }

  console.log('Warehouse row for submission:', wh || 'No warehouse created yet');
}

const id = process.argv[2];
if (!id) {
  console.error('Usage: node test-approve-submission.mjs <submission-id>');
  process.exit(1);
}

approveSubmission(id).then(() => process.exit(0));
