import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

/**
 * GET /api/cities
 * Get Maharashtra cities with pricing data
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pricing_reference')
            .select('city, district, avg_price_per_sqft, demand_score, warehouse_count')
            .order('city', { ascending: true })
            .order('district', { ascending: true });

        if (error) throw error;

        // Group by city
        const grouped = data?.reduce((acc: any, location) => {
            if (!acc[location.city]) {
                acc[location.city] = [];
            }
            acc[location.city].push({
                district: location.district,
                avg_price: location.avg_price_per_sqft,
                demand_score: location.demand_score,
                warehouse_count: location.warehouse_count,
            });
            return acc;
        }, {});

        // Get unique cities
        const cities = [...new Set(data?.map(d => d.city))];

        res.json({
            cities,
            grouped_by_city: grouped,
            total_locations: data?.length || 0,
            total_cities: cities.length,
        });
    } catch (error) {
        console.error('Get cities error:', error);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
});

/**
 * GET /api/cities/:city/districts
 * Get districts for a specific city
 */
router.get('/:city/districts', async (req, res) => {
    try {
        const { city } = req.params;

        const { data, error } = await supabase
            .from('pricing_reference')
            .select('district, avg_price_per_sqft, demand_score, warehouse_count')
            .eq('city', city)
            .order('district', { ascending: true });

        if (error) throw error;

        res.json({
            city,
            districts: data,
            count: data?.length || 0,
        });
    } catch (error) {
        console.error('Get districts error:', error);
        res.status(500).json({ error: 'Failed to fetch districts' });
    }
});

export default router;
