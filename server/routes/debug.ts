import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetch.bind(globalThis) }
});

router.get('/warehouses-sample', async (_req, res) => {
  try {
    const { data, error } = await supabase.from('warehouses').select('id, name, city, district, price_per_sqft, total_area').limit(20);
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ message: 'No data returned' });
    return res.json({ count: data.length, sample: data.slice(0, 10) });
  } catch (err: any) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
