-- ════════════════════════════════════════════════════════════════════════════
-- SmartSpace: ML Feedback & Behavioral Training Signal Schema
-- Run this in Supabase SQL Editor → creates the ml_feedback_logs table
-- and the aggregated ml_weight_tuning materialized-style view
-- ════════════════════════════════════════════════════════════════════════════

-- 1. ML Feedback Log Table
-- Records every user interaction that signals preference (click, save, book)
CREATE TABLE IF NOT EXISTS ml_feedback_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL,                            -- seeker/user who triggered the event
  warehouse_id  TEXT NOT NULL,                            -- warehouse they interacted with
  event_type    TEXT NOT NULL CHECK (event_type IN (
    'view',          -- user opened warehouse detail
    'save',          -- user saved/wishlisted the warehouse
    'booking_init',  -- user started a booking form
    'booking_submit',-- user actually submitted a booking
    'share'          -- user shared the listing
  )),
  recommendation_position INTEGER,                        -- rank in the recommendation list (1-based, NULL if not from ML)
  recommendation_algorithm TEXT,                          -- which algorithm served it (ensemble, knn, llm, etc.)
  context JSONB DEFAULT '{}',                             -- extra context: search preferences used, score given, etc.
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-algorithm aggregation
CREATE INDEX IF NOT EXISTS idx_ml_feedback_event   ON ml_feedback_logs (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_user    ON ml_feedback_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_wh      ON ml_feedback_logs (warehouse_id, event_type);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_algo    ON ml_feedback_logs (recommendation_algorithm, event_type);

-- Enable RLS: users can insert their own events, admin can read all
ALTER TABLE ml_feedback_logs ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can log their own feedback
CREATE POLICY "Users can insert own feedback"
  ON ml_feedback_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: service role (backend) can read all for weight training
CREATE POLICY "Service role reads all feedback"
  ON ml_feedback_logs FOR SELECT
  TO service_role
  USING (true);

-- 2. ML Weight Store — persists dynamically tuned ensemble weights per algorithm
-- Updated by the backend whenever it recomputes weights from feedback signals
CREATE TABLE IF NOT EXISTS ml_ensemble_weights (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  algorithm     TEXT NOT NULL UNIQUE CHECK (algorithm IN ('knn', 'contentBased', 'collaborative', 'neural', 'bayesian')),
  weight        NUMERIC(6,4) NOT NULL DEFAULT 0.20,       -- current trained weight (sum across all = 1.0)
  interaction_count INTEGER DEFAULT 0,                    -- total feedback events used in this weight
  last_tuned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default weights (matching current hardcoded constants)
INSERT INTO ml_ensemble_weights (algorithm, weight, interaction_count)
VALUES
  ('knn',           0.25, 0),
  ('contentBased',  0.25, 0),
  ('collaborative', 0.20, 0),
  ('neural',        0.15, 0),
  ('bayesian',      0.15, 0)
ON CONFLICT (algorithm) DO NOTHING;

-- 3. Aggregated signal view — used by the backend weight tuner
-- Computes CTR (click-through-rate) and conversion rate per algorithm
CREATE OR REPLACE VIEW ml_algorithm_signals AS
SELECT
  recommendation_algorithm                                AS algorithm,
  COUNT(*)                                               AS total_events,
  COUNT(*) FILTER (WHERE event_type = 'view')            AS views,
  COUNT(*) FILTER (WHERE event_type = 'save')            AS saves,
  COUNT(*) FILTER (WHERE event_type = 'booking_init')    AS booking_inits,
  COUNT(*) FILTER (WHERE event_type = 'booking_submit')  AS bookings,
  -- CTR: saves + booking_inits / views
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'view') = 0 THEN 0
    ELSE ROUND(
      (COUNT(*) FILTER (WHERE event_type IN ('save', 'booking_init', 'booking_submit'))::NUMERIC /
       COUNT(*) FILTER (WHERE event_type = 'view')::NUMERIC) * 100, 2
    )
  END                                                    AS ctr_pct,
  -- Booking conversion rate
  CASE
    WHEN COUNT(*) FILTER (WHERE event_type = 'view') = 0 THEN 0
    ELSE ROUND(
      (COUNT(*) FILTER (WHERE event_type = 'booking_submit')::NUMERIC /
       COUNT(*) FILTER (WHERE event_type = 'view')::NUMERIC) * 100, 2
    )
  END                                                    AS booking_conversion_pct
FROM ml_feedback_logs
WHERE recommendation_algorithm IS NOT NULL
GROUP BY recommendation_algorithm;

-- 4. Normalize occupancy values — fixes the decimal vs percentage inconsistency
-- Run this ONCE to fix all rows that accidentally stored 60 instead of 0.60
UPDATE warehouses
SET occupancy = occupancy / 100.0
WHERE occupancy > 1;

-- Confirm the fix
SELECT
  COUNT(*) FILTER (WHERE occupancy > 1) AS still_wrong,
  COUNT(*) FILTER (WHERE occupancy <= 1) AS correct,
  MIN(occupancy) as min_occ,
  MAX(occupancy) as max_occ
FROM warehouses;
