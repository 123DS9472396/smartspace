import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getGeminiPricingRecommendation } from '../services/gemini-ai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bsrzqffxgvdebyofmhzg.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const router = Router();

/**
 * POST /api/recommend-price
 * ML-powered pricing recommendation for warehouse owners
 */
router.post('/', async (req, res) => {
    try {
        const { city, district, warehouse_type, total_area, amenities = [] } = req.body;

        // Validate required fields
        if (!city || !total_area) {
            return res.status(400).json({
                error: 'Missing required fields: city and total_area'
            });
        }

        // 1. Get base pricing for the city/district
        let pricingQuery = supabase
            .from('pricing_reference')
            .select('*')
            .eq('city', city);

        if (district) {
            pricingQuery = pricingQuery.eq('district', district);
        }

        const { data: pricingData, error: pricingError } = await pricingQuery;

        if (pricingError) throw pricingError;

        // If no exact match, get city average
        const basePrice = pricingData && pricingData.length > 0
            ? pricingData[0].avg_price_per_sqft
            : 50; // Default fallback

        const demandScore = pricingData && pricingData.length > 0
            ? pricingData[0].demand_score
            : 5;

        // 2. Get nearby warehouse prices for comparison (ML-based)
        console.log('🔍 Searching for warehouses with city:', city, 'type:', warehouse_type);

        let warehouseQuery = supabase
            .from('warehouses')
            .select('name, price_per_sqft, city, warehouse_type, amenities, total_area, occupancy, rating')
            .ilike('city', `%${city}%`)  // Flexible city match
            .not('price_per_sqft', 'is', null)  // Only warehouses with pricing
            .limit(500);  // Analyze up to 500 warehouses for accurate ML

        // Filter by same warehouse type if provided (and not 'general')
        if (warehouse_type && warehouse_type !== 'general') {
            warehouseQuery = warehouseQuery.eq('warehouse_type', warehouse_type);
        }

        const { data: nearbyWarehouses, error: warehouseError } = await warehouseQuery;

        console.log('📊 Found warehouses:', nearbyWarehouses?.length || 0);
        console.log('📊 Sample warehouse:', nearbyWarehouses?.[0]);

        if (warehouseError) {
            console.error('❌ Warehouse query error:', warehouseError);
            throw warehouseError;
        }

        // Calculate average prices (convert from string to number)
        const nearbyPrices = nearbyWarehouses
            ?.map(w => parseFloat(w.price_per_sqft) || 0)
            .filter(price => price > 0) || [];

        console.log('💰 Price samples:', nearbyPrices.slice(0, 5));
        console.log('💰 Total valid prices:', nearbyPrices.length);

        const nearbyAvg = nearbyPrices.length > 0
            ? Math.round(nearbyPrices.reduce((a, b) => a + b, 0) / nearbyPrices.length)
            : basePrice;

        // 3. Use Gemini AI for intelligent pricing (with statistical fallback)
        console.log('🤖 Analyzing with Gemini AI...');

        const geminiResult = await getGeminiPricingRecommendation({
            city,
            warehouse_type: warehouse_type || 'general',
            total_area,
            amenities,
            nearby_warehouses: (nearbyWarehouses || []).map(w => ({
                name: w.name || `Warehouse in ${w.city}`,
                price_per_sqft: parseFloat(w.price_per_sqft) || 0,
                warehouse_type: w.warehouse_type || 'general',
                total_area: w.total_area || 0,
                occupancy: w.occupancy || 0,
                rating: w.rating || 0
            }))
        });

        console.log('✅ Gemini analysis complete:', {
            price: geminiResult.recommended_price,
            confidence: geminiResult.confidence_score
        });

        // Use Gemini's recommendation as primary, with statistical backup
        let recommendedPrice = geminiResult.recommended_price || basePrice;

        // Adjust for warehouse type
        const typeMultipliers: Record<string, number> = {
            'cold_storage': 1.3,
            'dark_store': 1.2,
            'industrial': 1.1,
            'agricultural': 0.9,
            'general': 1.0,
        };
        const typeMultiplier = typeMultipliers[warehouse_type] || 1.0;
        recommendedPrice *= typeMultiplier;

        // Adjust for amenities (each premium amenity adds 5%)
        const premiumAmenities = ['cold_storage', 'cctv_surveillance', 'fire_safety', 'loading_dock', 'power_backup'];
        const amenityBonus = amenities.filter((a: string) => premiumAmenities.includes(a)).length * 0.05;
        recommendedPrice *= (1 + amenityBonus);

        // Adjust for area (larger warehouses get slight discount per sqft)
        if (total_area > 10000) {
            recommendedPrice *= 0.95;
        } else if (total_area > 5000) {
            recommendedPrice *= 0.97;
        }

        // Incorporate nearby average (70% ML, 30% market)
        recommendedPrice = recommendedPrice * 0.7 + nearbyAvg * 0.3;

        // Calculate price range (±15%)
        const minPrice = Math.round(recommendedPrice * 0.85);
        const maxPrice = Math.round(recommendedPrice * 1.15);
        recommendedPrice = Math.round(recommendedPrice);

        // 4. Calculate confidence score
        const dataPoints = nearbyPrices.length;
        const confidence = Math.min(0.95, 0.6 + (dataPoints / 100) * 0.35);

        // 5. Generate reasoning
        const reasoning = [];
        if (demandScore >= 8) {
            reasoning.push(`High demand area (score: ${demandScore}/10)`);
        } else if (demandScore >= 6) {
            reasoning.push(`Moderate demand area (score: ${demandScore}/10)`);
        }

        if (amenities.length > 3) {
            reasoning.push(`Premium amenities (${amenities.length} features)`);
        }

        if (nearbyPrices.length > 10) {
            reasoning.push(`Based on ${nearbyPrices.length} nearby warehouses`);
        }

        if (warehouse_type === 'cold_storage' || warehouse_type === 'dark_store') {
            reasoning.push(`Specialized storage commands premium pricing`);
        }

        // 6. Prepare response with Gemini insights
        const response = {
            recommended_price: geminiResult.recommended_price,
            min_price: geminiResult.price_range.min,
            max_price: geminiResult.price_range.max,
            nearby_avg: Math.round(nearbyAvg),
            confidence: geminiResult.confidence_score / 100,
            demand_score: demandScore,
            reasoning: geminiResult.market_insights,
            ai_reasoning: geminiResult.reasoning,
            demand_analysis: geminiResult.demand_analysis,
            competitive_positioning: geminiResult.competitive_positioning,
            market_data: {
                city,
                district: district || 'All districts',
                nearby_warehouses_analyzed: nearbyPrices.length,
                base_rate: Math.round(basePrice),
            },
            powered_by: 'Gemini AI + Statistical Analysis',
        };

        res.json(response);
    } catch (error) {
        console.error('Pricing recommendation error:', error);
        res.status(500).json({
            error: 'Failed to generate pricing recommendation',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
