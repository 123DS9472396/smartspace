import { RequestHandler } from "express";
import { supabase } from '../lib/supabaseClient';

/**
 * Safely convert a JSONB value (array or object) to a plain string array
 * for insertion into TEXT[] columns in the warehouses table.
 */
const toTextArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'object') return Object.values(val).filter(Boolean).map(String);
  return [];
};

/**
 * Build a warehouse row from submission data.
 * 
 * The warehouses table (from Supabase migration 20251002003226) has these
 * NOT NULL columns: wh_id, name, address, city, district, total_area,
 * capacity, price_per_sqft.  warehouse_type is NOT NULL in one migration
 * version. All other columns are nullable or have defaults.
 * 
 * The table does NOT have: documents, allowed_goods_types, or
 * source_submission_id in the base schema — those are added via ALTER TABLE
 * and may or may not exist.  We try inserting them; if it fails we retry
 * without optional columns.
 */
const buildWarehousePayload = (submission: any) => {
  const totalArea = Number(submission.total_area) || 0;
  const totalBlocks = Math.max(1, Math.floor(totalArea / 1000));
  const gridSize = Math.ceil(Math.sqrt(totalBlocks));

  // Core payload — only columns guaranteed to exist in the warehouses table
  return {
    wh_id: `SUB-${String(submission.id).substring(0, 8).toUpperCase()}`,
    owner_id: submission.owner_id || null,
    name: submission.name || 'Unnamed Warehouse',
    description: submission.description || '',
    address: submission.address || submission.city || 'Not specified',
    city: submission.city || 'Unknown',
    district: submission.district || submission.city || 'Unknown',
    state: submission.state || 'Maharashtra',
    pincode: submission.pincode || '',
    total_area: totalArea || 1000,
    capacity: totalArea || 1000,
    price_per_sqft: Number(submission.price_per_sqft) || 10,
    images: toTextArray(submission.image_urls),
    amenities: toTextArray(submission.amenities),
    features: toTextArray(submission.features),
    warehouse_type: submission.warehouse_type || 'General Storage',
    status: 'active',
    occupancy: 0,
    rating: 4.5,
    reviews_count: 0,
    total_blocks: totalBlocks,
    available_blocks: totalBlocks,
    grid_rows: gridSize,
    grid_cols: gridSize,
  };
};

export const getWarehouseSubmissions: RequestHandler = async (_req, res) => {
  try {
    console.log('📦 Admin: Fetching warehouse submissions...');

    const { data, error } = await supabase
      .from('warehouse_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('❌ Admin submissions query error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`✅ Admin: Found ${data?.length || 0} warehouse submissions`);
    return res.json({ success: true, submissions: data || [] });
  } catch (error: any) {
    console.error('❌ Admin submissions exception:', error?.message || error);
    return res.status(500).json({ success: false, error: 'Failed to load submissions' });
  }
};

export const reviewWarehouseSubmission: RequestHandler = async (req, res) => {
  try {
    const { submissionId, decision, adminNotes, rejectionReason, reviewedBy } = req.body || {};

    if (!submissionId || !decision) {
      return res.status(400).json({ success: false, error: 'submissionId and decision are required' });
    }

    // Fetch the full submission
    const { data: submission, error: fetchError } = await supabase
      .from('warehouse_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    let createdWarehouse: any = null;

    if (decision === 'approved') {
      // ── Step 1: Insert into warehouses table ──
      const payload = buildWarehousePayload(submission);
      console.log('📦 Inserting warehouse payload:', JSON.stringify(payload, null, 2));

      // Try insert — if a column doesn't exist the DB will complain,
      // so we catch and log clearly.
      const { data: created, error: insertError } = await supabase
        .from('warehouses')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Warehouse insert error:', insertError.message);
        return res.status(500).json({ success: false, error: insertError.message });
      }

      createdWarehouse = created;
      console.log('✅ Warehouse created:', createdWarehouse?.id, createdWarehouse?.name);

      // ── Step 2: Update submission status ──
      // The database may have a trigger (move_submission_to_warehouses) that
      // fires on UPDATE when status = 'approved'.  That trigger has a JSONB
      // → TEXT[] bug.  To bypass it we DELETE + re-INSERT instead of UPDATE.
      const { error: deleteError } = await supabase
        .from('warehouse_submissions')
        .delete()
        .eq('id', submissionId);

      if (deleteError) {
        console.error('❌ Delete submission error:', deleteError);
        return res.status(500).json({ success: false, error: deleteError.message });
      }

      const { error: reinsertError } = await supabase
        .from('warehouse_submissions')
        .insert({
          ...submission,
          status: 'approved',
          admin_notes: adminNotes || null,
          rejection_reason: null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy || null,
          updated_at: new Date().toISOString(),
        });

      if (reinsertError) {
        console.error('❌ Re-insert submission error:', reinsertError);
        // Restore original row on failure
        await supabase.from('warehouse_submissions').insert(submission);
        return res.status(500).json({ success: false, error: reinsertError.message });
      }

      console.log('✅ Submission approved:', submissionId);
    } else {
      // Rejection — the trigger only fires on 'approved', so a normal UPDATE is safe
      const { error: updateError } = await supabase
        .from('warehouse_submissions')
        .update({
          status: decision,
          admin_notes: adminNotes || null,
          rejection_reason: decision === 'rejected' ? (rejectionReason || 'Rejected by admin') : null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy || null
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('❌ Rejection update error:', updateError);
        return res.status(500).json({ success: false, error: updateError.message });
      }

      console.log('✅ Submission rejected:', submissionId);
    }

    return res.json({
      success: true,
      message: `Submission ${decision} successfully`,
      warehouse: createdWarehouse
    });
  } catch (error: any) {
    console.error('❌ Review submission error:', error?.message || error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal error' });
  }
};
