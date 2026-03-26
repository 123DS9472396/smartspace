import { Router } from 'express';
import { supabaseAnon as supabase } from '../lib/supabaseClient';

const router = Router();

/**
 * POST /api/calculate-product-pricing
 * Calculate storage cost and insurance for agricultural products (farmers)
 */
router.post('/calculate-product-pricing', async (req, res) => {
    try {
        const {
            product_type,
            quantity,
            unit = 'sacks',
            weight_per_unit_kg,
            storage_duration_days,
            warehouse_id,
        } = req.body;

        // Validate required fields
        if (!product_type || !quantity || !weight_per_unit_kg || !storage_duration_days) {
            return res.status(400).json({
                error: 'Missing required fields: product_type, quantity, weight_per_unit_kg, storage_duration_days',
            });
        }

        // 1. Get product market price
        const { data: productData, error: productError } = await supabase
            .from('product_market_prices')
            .select('*')
            .ilike('product_type', product_type)
            .single();

        if (productError) {
            return res.status(404).json({
                error: `Product type "${product_type}" not found in market prices`,
            });
        }

        const market_price_per_kg = productData.current_price_per_kg;
        const product_category = productData.product_category;

        // 2. Get storage rate configuration
        const { data: storageConfig, error: storageError } = await supabase
            .from('storage_rate_config')
            .select('*')
            .eq('product_category', product_category)
            .single();

        if (storageError) {
            return res.status(404).json({
                error: `Storage configuration not found for category "${product_category}"`,
            });
        }

        const rate_per_kg_per_day = storageConfig.rate_per_kg_per_day;
        const insurance_percentage = storageConfig.insurance_percentage;
        const storage_type_required = storageConfig.storage_type_required;
        const temperature_control = storageConfig.temperature_control;

        // 3. Calculate total weight and product value
        const total_weight_kg = quantity * weight_per_unit_kg;
        const total_product_value = total_weight_kg * market_price_per_kg;

        // 4. Calculate storage cost
        const storage_cost = total_weight_kg * rate_per_kg_per_day * storage_duration_days;

        // 5. Calculate insurance
        const insurance_amount = (total_product_value * insurance_percentage) / 100;

        // 6. Calculate total cost
        const total_cost = storage_cost + insurance_amount;

        // 7. Get warehouse details if provided
        let warehouse_details = null;
        if (warehouse_id) {
            const { data: warehouseData } = await supabase
                .from('warehouses')
                .select('warehouse_name, city, amenities, pricing_inr_sqft_month')
                .eq('id', warehouse_id)
                .single();

            warehouse_details = warehouseData;

            // Check if warehouse has required storage type
            const hasRequiredAmenity = warehouseData?.amenities?.includes(storage_type_required);
            if (storage_type_required === 'cold_storage' && !hasRequiredAmenity) {
                return res.status(400).json({
                    error: `This product requires cold storage, but the selected warehouse doesn't have this amenity`,
                    required_storage_type: storage_type_required,
                });
            }
        }

        // 8. Prepare response
        const response = {
            product_info: {
                product_type,
                product_category,
                market_price_per_kg,
                price_trend: productData.price_trend,
                quantity,
                unit,
                weight_per_unit_kg,
                total_weight_kg,
                total_product_value: Math.round(total_product_value),
            },
            storage_info: {
                storage_type_required,
                temperature_control,
                rate_per_kg_per_day,
                storage_duration_days,
                min_storage_days: storageConfig.min_storage_days,
            },
            cost_breakdown: {
                storage_cost: Math.round(storage_cost),
                insurance_percentage,
                insurance_amount: Math.round(insurance_amount),
                platform_fee: 0, // Can add platform fee later
                total_cost: Math.round(total_cost),
            },
            per_day_cost: Math.round(total_cost / storage_duration_days),
            per_unit_cost: Math.round(total_cost / quantity),
            warehouse_details,
            recommendations: [
                storage_type_required === 'cold_storage'
                    ? `Requires cold storage facility (${temperature_control})`
                    : 'Standard warehouse storage suitable',
                `Insurance covers ${insurance_percentage}% of product value (₹${Math.round(total_product_value).toLocaleString()})`,
                `Minimum recommended storage period: ${storageConfig.min_storage_days} days`,
            ],
        };

        res.json(response);
    } catch (error) {
        console.error('Product pricing calculation error:', error);
        res.status(500).json({
            error: 'Failed to calculate product pricing',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /api/products
 * Get all available products with prices
 */
router.get('/products', async (req, res) => {
    try {
        const { category } = req.query;

        let query = supabase
            .from('product_market_prices')
            .select('*')
            .order('product_category', { ascending: true })
            .order('product_type', { ascending: true });

        if (category) {
            query = query.eq('product_category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Group by category
        const grouped = data?.reduce((acc: any, product) => {
            const cat = product.product_category;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(product);
            return acc;
        }, {});

        res.json({
            products: data,
            grouped_by_category: grouped,
            total_count: data?.length || 0,
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

export default router;
