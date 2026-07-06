/**
 * ML Feedback Route — Behavioral Training Signal Collector
 *
 * POST /api/ml/feedback     — log a user interaction event
 * GET  /api/ml/weights      — get current trained ensemble weights
 * POST /api/ml/retune       — trigger weight re-tuning from accumulated signals
 */
import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabaseClient";

const router = Router();

// ─── Default ensemble weights (used as fallback if DB has none) ───────────────
const DEFAULT_WEIGHTS = {
  knn:           0.25,
  contentBased:  0.25,
  collaborative: 0.20,
  neural:        0.15,
  bayesian:      0.15,
};

// ─── In-memory cache so weights aren't fetched on every recommendation call ──
let cachedWeights: typeof DEFAULT_WEIGHTS | null = null;
let cacheExpiry = 0; // Unix timestamp in ms
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── POST /api/ml/feedback ────────────────────────────────────────────────────
// Frontend calls this whenever a user: views, saves, starts booking, or submits a booking
const logFeedback: RequestHandler = async (req, res) => {
  try {
    const {
      user_id,
      warehouse_id,
      event_type,
      recommendation_position,
      recommendation_algorithm,
      context = {},
    } = req.body;

    if (!user_id || !warehouse_id || !event_type) {
      return res.status(400).json({ success: false, error: "Missing required fields: user_id, warehouse_id, event_type" });
    }

    const VALID_EVENTS = ["view", "save", "booking_init", "booking_submit", "share"];
    if (!VALID_EVENTS.includes(event_type)) {
      return res.status(400).json({ success: false, error: `event_type must be one of: ${VALID_EVENTS.join(", ")}` });
    }

    // Ensure user_id and warehouse_id are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const safeUserId = uuidRegex.test(user_id) ? user_id : '00000000-0000-0000-0000-000000000000';
    const safeWarehouseId = uuidRegex.test(warehouse_id) ? warehouse_id : '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase.from("ml_feedback_logs").insert({
      user_id: safeUserId,
      warehouse_id: safeWarehouseId,
      event_type,
      recommendation_position: recommendation_position ?? null,
      recommendation_algorithm: recommendation_algorithm ?? null,
      context,
    });

    if (error) {
      console.error("[ml/feedback] Insert error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    // If this is a high-signal event (booking), trigger async weight re-tuning
    if (event_type === "booking_submit") {
      retuneMlWeights().catch(e => console.warn("[ml/feedback] Background retune error:", e.message));
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[ml/feedback] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/ml/weights ──────────────────────────────────────────────────────
// Returns current trained weights (used by the recommendation engine)
const getWeights: RequestHandler = async (_req, res) => {
  try {
    const weights = await loadWeights();
    return res.json({ success: true, weights, cachedAt: new Date(cacheExpiry - CACHE_TTL_MS).toISOString() });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, weights: DEFAULT_WEIGHTS });
  }
};

// ─── POST /api/ml/retune ─────────────────────────────────────────────────────
// Admin endpoint to manually trigger ML weight re-tuning
const retune: RequestHandler = async (_req, res) => {
  try {
    const result = await retuneMlWeights();
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Weight Loading with Cache ────────────────────────────────────────────────
export async function loadWeights(): Promise<typeof DEFAULT_WEIGHTS> {
  // Return cache if still fresh
  if (cachedWeights && Date.now() < cacheExpiry) return cachedWeights;

  try {
    const { data, error } = await supabase
      .from("ml_ensemble_weights")
      .select("algorithm, weight");

    if (error || !data || data.length === 0) {
      console.warn("[ml/weights] Could not load from DB, using defaults:", error?.message);
      cachedWeights = { ...DEFAULT_WEIGHTS };
    } else {
      const weights: any = { ...DEFAULT_WEIGHTS };
      data.forEach((row: any) => {
        if (row.algorithm in weights) weights[row.algorithm] = Number(row.weight);
      });
      // Normalize: ensure weights sum to 1.0
      const total = Object.values(weights).reduce((s: number, v) => s + (v as number), 0);
      if (total > 0 && Math.abs(total - 1.0) > 0.01) {
        Object.keys(weights).forEach(k => { weights[k] = weights[k] / total; });
      }
      cachedWeights = weights as typeof DEFAULT_WEIGHTS;
      console.log(`[ml/weights] Loaded trained weights from DB: ${JSON.stringify(cachedWeights)}`);
    }
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return cachedWeights!;
  } catch (err: any) {
    console.warn("[ml/weights] Load failed:", err.message);
    return DEFAULT_WEIGHTS;
  }
}

// ─── Weight Re-tuning Algorithm ───────────────────────────────────────────────
/**
 * Computes new ensemble weights from accumulated behavioral feedback signals.
 *
 * Tuning Logic:
 * - For each algorithm, we look at the CTR (click + save + book signals vs views)
 *   for recommendations served by that algorithm.
 * - Algorithms that drive more bookings get higher weights.
 * - The adjustment is bounded to ±30% of the default weight per cycle (safety rails).
 * - Weights are always re-normalized to sum = 1.0 after adjustment.
 */
async function retuneMlWeights(): Promise<{ weights: any; algorithm_signals: any[] }> {
  console.log("[ml/retune] Starting weight re-tuning from behavioral signals...");

  // Fetch signal aggregates from the DB view
  const { data: signals, error } = await supabase
    .from("ml_algorithm_signals")
    .select("*");

  if (error || !signals || signals.length === 0) {
    console.warn("[ml/retune] No signal data available yet — keeping current weights");
    return { weights: cachedWeights || DEFAULT_WEIGHTS, algorithm_signals: [] };
  }

  console.log("[ml/retune] Algorithm signals:", signals);

  // Load current weights as the base
  const currentWeights: Record<string, number> = { ...DEFAULT_WEIGHTS };
  const { data: dbWeights } = await supabase
    .from("ml_ensemble_weights")
    .select("algorithm, weight, interaction_count");
  (dbWeights || []).forEach((r: any) => {
    if (r.algorithm in currentWeights) currentWeights[r.algorithm] = Number(r.weight);
  });

  // Compute adjustment factor per algorithm from CTR
  // Scale: CTR of 10%+ gets a +20% boost, CTR of 0% gets a -20% penalty
  const newWeights: Record<string, number> = { ...currentWeights };
  let hasSignals = false;

  for (const signal of signals) {
    const algo = signal.algorithm;
    if (!(algo in newWeights)) continue;

    const ctr = Number(signal.ctr_pct) || 0;
    const convRate = Number(signal.booking_conversion_pct) || 0;
    const totalEvents = Number(signal.total_events) || 0;

    if (totalEvents < 10) continue; // Not enough data yet for this algorithm
    hasSignals = true;

    // Combined engagement score (booking weighted 3x more than CTR)
    const engagementScore = (ctr * 1.0 + convRate * 3.0) / 4.0;

    // Adjustment: +20% boost if engagement > 8%, -20% penalty if < 2%
    let adjustment = 0;
    if (engagementScore > 8) adjustment = 0.20;
    else if (engagementScore > 5) adjustment = 0.10;
    else if (engagementScore > 2) adjustment = 0.00;
    else if (engagementScore > 0) adjustment = -0.10;
    else adjustment = -0.20;

    // Apply adjustment bounded to ±30% of default weight
    const defaultWeight = DEFAULT_WEIGHTS[algo as keyof typeof DEFAULT_WEIGHTS] || 0.20;
    const rawNew = currentWeights[algo] * (1 + adjustment);
    newWeights[algo] = Math.max(defaultWeight * 0.7, Math.min(defaultWeight * 1.3, rawNew));
  }

  if (!hasSignals) {
    console.log("[ml/retune] Insufficient signal data (<10 events per algorithm) — no weight changes");
    return { weights: currentWeights, algorithm_signals: signals };
  }

  // Re-normalize so weights sum to 1.0
  const total = Object.values(newWeights).reduce((s, v) => s + v, 0);
  Object.keys(newWeights).forEach(k => { newWeights[k] = Math.round((newWeights[k] / total) * 10000) / 10000; });

  // Persist updated weights to DB
  const updates = Object.entries(newWeights).map(([algorithm, weight]) => ({
    algorithm,
    weight,
    interaction_count: signals.find(s => s.algorithm === algorithm)?.total_events || 0,
    last_tuned_at: new Date().toISOString(),
  }));

  for (const u of updates) {
    await supabase
      .from("ml_ensemble_weights")
      .upsert(u, { onConflict: "algorithm" });
  }

  // Bust the cache so next recommendation request gets fresh weights
  cachedWeights = null;
  cacheExpiry = 0;

  console.log("[ml/retune] ✅ Weight re-tuning complete:", newWeights);
  return { weights: newWeights, algorithm_signals: signals };
}

// ─── Route Registration ───────────────────────────────────────────────────────
router.post("/feedback", logFeedback);
router.get("/weights", getWeights);
router.post("/retune", retune);

export default router;
export { retuneMlWeights };
