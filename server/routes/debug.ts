import { Router } from 'express';
import { supabase } from '../lib/supabaseClient';

const router = Router();

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
