import { Router, RequestHandler } from 'express';
import { supabase } from '../lib/supabaseClient';

const router = Router();

/**
 * POST /api/warehouse-submission
 * Creates a warehouse submission with file uploads
 * Uses service role to bypass RLS
 */
const createWarehouseSubmission: RequestHandler = async (req, res) => {
  try {
    const { 
      owner_id, 
      name, 
      description, 
      address, 
      city, 
      state, 
      pincode,
      total_area,
      price_per_sqft,
      amenities,
      features,
      images,
      documents
    } = req.body;

    console.log('📋 [Server] Creating warehouse submission for owner:', owner_id);

    // Validate required fields
    if (!owner_id || !name || !city || !state || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: owner_id, name, city, state, address'
      });
    }

    // Create submission with service role (bypasses RLS)
    const { data: submission, error: submissionError } = await supabase
      .from('warehouse_submissions')
      .insert({
        owner_id,
        name,
        description: description || '',
        address,
        city,
        state,
        pincode: pincode || '',
        total_area: parseInt(total_area || '0'),
        price_per_sqft: parseInt(price_per_sqft || '0'),
        amenities: amenities || [],
        features: features || [],
        images: images || [],
        documents: documents || {},
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('❌ Submission error:', submissionError);
      return res.status(400).json({
        success: false,
        error: submissionError.message,
        code: submissionError.code
      });
    }

    console.log('✅ Warehouse submission created:', submission.id);

    // Create notification for owner
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: owner_id,
          type: 'submission',
          title: 'Warehouse Submission Received',
          message: `Your warehouse "${name}" has been submitted for admin review.`,
          metadata: { submission_id: submission.id }
        });
      console.log('📬 Notification created for owner');
    } catch (notifError) {
      console.warn('⚠️ Could not create notification:', notifError);
      // Don't fail the request if notification fails
    }

    return res.json({
      success: true,
      submission: submission,
      message: 'Warehouse submission created successfully'
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/warehouse-submission/upload
 * Uploads files to Supabase Storage using service role
 */
const uploadWarehouseFile: RequestHandler = async (req, res) => {
  try {
    const { bucket, filename, content, contentType } = req.body;

    if (!bucket || !filename || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bucket, filename, content'
      });
    }

    console.log(`📤 [Server] Uploading ${filename} to bucket: ${bucket}`);

    // Convert base64 to buffer if needed
    const fileBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'base64');

    // Upload using service role (bypasses RLS)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, fileBuffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      console.error(` ❌ Upload error:`, error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    console.log(`✅ File uploaded: ${urlData.publicUrl}`);

    return res.json({
      success: true,
      filename: filename,
      publicUrl: urlData.publicUrl,
      path: data?.path
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Register routes
router.post('/api/warehouse-submission', createWarehouseSubmission);
router.post('/api/warehouse-submission/upload', uploadWarehouseFile);

export default router;
