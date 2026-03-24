import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const router = express.Router();
router.use(bodyParser.json());

/**
 * POST /approve-submission
 * Body: { submissionId: string }
 * Behavior: Updates the submission status to 'approved' then polls the
 * warehouses table for a newly created row that references the submission.
 * Returns: { warehouseId: string | null }
 */
router.post("/approve-submission", async (req, res) => {
  const { submissionId } = req.body;
  if (!submissionId)
    return res.status(400).json({ error: "submissionId required" });

  try {
    // Use Supabase REST API with service_role key (must be set in env)
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res
        .status(500)
        .json({ error: "Supabase service credentials missing on server" });
    }

    // 1) Update submission status to 'approved'
    const updateResp = await fetch(
      `${SUPABASE_URL}/rest/v1/warehouse_submissions`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
        },
        body: JSON.stringify({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        }),
        // filter by id
        // Supabase REST: use ?id=eq.<val>
      },
    );

    // Use RPC style via query param to target the specific row
    // Note: Simpler approach below: call PATCH with query string

    // 2) Approve with filter
    const patchResp = await fetch(
      `${SUPABASE_URL}/rest/v1/warehouse_submissions?id=eq.${encodeURIComponent(submissionId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: "server-approve",
        }),
      },
    );

    if (!patchResp.ok) {
      const text = await patchResp.text();
      return res
        .status(500)
        .json({ error: "Failed to update submission", details: text });
    }

    // Poll for the created warehouse row (the DB trigger should create it)
    const timeout = 5000; // ms
    const interval = 500; // ms
    const start = Date.now();
    let warehouseId: string | null = null;

    console.log(
      `⏳ Polling for warehouse creation for submission ${submissionId}...`,
    );

    while (Date.now() - start < timeout) {
      const q = await fetch(
        `${SUPABASE_URL}/rest/v1/warehouses?submission_id=eq.${encodeURIComponent(submissionId)}&select=id,wh_id,name`,
        {
          headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
          },
        },
      );
      if (q.ok) {
        const data = await q.json();
        console.log(`🔍 Poll attempt: Found ${data.length} warehouses`);
        if (Array.isArray(data) && data.length > 0) {
          warehouseId = data[0].id;
          console.log(
            `✅ Warehouse created: ${data[0].name} (${data[0].wh_id}) - ID: ${warehouseId}`,
          );
          break;
        }
      }
      // wait
      await new Promise((r) => setTimeout(r, interval));
    }

    if (!warehouseId) {
      console.error(
        `❌ Warehouse was NOT created after ${timeout}ms. Check database trigger!`,
      );
    }

    return res.json({ warehouseId });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
