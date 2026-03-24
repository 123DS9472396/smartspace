import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://bsrzqffxgvdebyofmhzg.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * POST /api/warehouse-submissions
 * Creates a new warehouse submission (bypasses RLS using service role key)
 */
export const createWarehouseSubmission: RequestHandler = async (req, res) => {
  try {
    const {
      owner_id,
      name,
      description,
      warehouse_type,
      allowed_goods_types,
      address,
      city,
      state,
      pincode,
      total_area,
      price_per_sqft,
      amenities,
      features,
      image_urls,
      document_urls,
      gst_certificate_url,
      ownership_proof_url,
      layout_plan_url,
      ocr_results,
    } = req.body || {};

    if (!owner_id || !name || !city) {
      return res.status(400).json({
        success: false,
        error: "owner_id, name, and city are required",
      });
    }

    const { data: submission, error } = await supabase
      .from("warehouse_submissions")
      .insert({
        owner_id,
        name,
        description: description || "",
        warehouse_type: warehouse_type || "General Storage",
        allowed_goods_types: allowed_goods_types || [],
        address: address || "",
        city,
        state: state || "",
        pincode: pincode || "",
        total_area: parseFloat(total_area) || 0,
        price_per_sqft: parseFloat(price_per_sqft) || 0,
        amenities: amenities || [],
        features: features || [],
        image_urls: image_urls || [],
        document_urls: document_urls || {},
        gst_certificate_url: gst_certificate_url || null,
        ownership_proof_url: ownership_proof_url || null,
        layout_plan_url: layout_plan_url || null,
        ocr_results: ocr_results || null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Submission insert error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log("✅ Warehouse submission created:", submission.id);
    return res.json({ success: true, submission });
  } catch (error: any) {
    console.error("❌ Submission error:", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || "Internal error" });
  }
};

/**
 * GET /api/warehouse-submissions/owner/:ownerId
 * Gets all submissions for a specific owner
 */
export const getOwnerSubmissions: RequestHandler = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res
        .status(400)
        .json({ success: false, error: "ownerId is required" });
    }

    const { data, error } = await supabase
      .from("warehouse_submissions")
      .select("*")
      .eq("owner_id", ownerId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("❌ Fetch owner submissions error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, submissions: data || [] });
  } catch (error: any) {
    console.error("❌ getOwnerSubmissions error:", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || "Internal error" });
  }
};

/**
 * POST /api/warehouse-submissions/upload
 * Upload file to Supabase Storage (bypasses RLS)
 */
export const uploadFile: RequestHandler = async (req, res) => {
  try {
    const { fileName, fileBase64, contentType, bucket, folder } =
      req.body || {};

    if (!fileName || !fileBase64) {
      return res
        .status(400)
        .json({
          success: false,
          error: "fileName and fileBase64 are required",
        });
    }

    const bucketName = bucket || "warehouse-documents";
    const filePath = folder
      ? `${folder}/${Date.now()}_${fileName}`
      : `${Date.now()}_${fileName}`;

    // Decode base64 content
    const buffer = Buffer.from(fileBase64, "base64");

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === bucketName);
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, { public: true });
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log("✅ File uploaded:", urlData.publicUrl);
    return res.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || "Upload failed" });
  }
};
