import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
// Server-side uses GEMINI_API_KEY (no VITE_ prefix)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

console.log('🤖 Gemini API key status:', GEMINI_API_KEY ? 'Configured ✅' : 'Not configured ⚠️');

/**
 * Gemini-powered Pricing Intelligence Service
 * Uses LLM to analyze warehouse data and provide intelligent pricing recommendations
 */

export interface GeminiPricingRequest {
    city: string;
    warehouse_type?: string;
    total_area: number;
    amenities?: string[];
    nearby_warehouses: Array<{
        name: string;
        price_per_sqft: number;
        warehouse_type: string;
        total_area: number;
        occupancy: number;
        rating: number;
    }>;
}

export interface GeminiPricingResponse {
    recommended_price: number;
    price_range: { min: number; max: number };
    confidence_score: number;
    market_insights: string[];
    reasoning: string;
    demand_analysis: string;
    competitive_positioning: string;
}

/**
 * Get Gemini-powered pricing recommendation
 */
export async function getGeminiPricingRecommendation(
    request: GeminiPricingRequest
): Promise<GeminiPricingResponse> {
    if (!genAI || !GEMINI_API_KEY) {
        console.warn('⚠️ Gemini API key not configured, using fallback pricing');
        return getFallbackPricing(request);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Prepare warehouse data summary
        const warehouseDataSummary = request.nearby_warehouses
            .slice(0, 50) // Limit to avoid token limits
            .map((w, i) =>
                `${i + 1}. ${w.name}: ₹${w.price_per_sqft}/sqft, ${w.total_area.toLocaleString()} sqft, ${Math.round((1 - w.occupancy) * 100)}% available, ${w.rating}⭐, Type: ${w.warehouse_type}`
            )
            .join('\n');

        const prompt = `You are an expert warehouse pricing analyst in India. Analyze the following data and provide a pricing recommendation.

**Property to Price:**
- Location: ${request.city}, Maharashtra
- Type: ${request.warehouse_type || 'General Storage'}
- Total Area: ${request.total_area.toLocaleString()} sq ft
- Amenities: ${request.amenities?.join(', ') || 'Standard'}

**Comparable Warehouses in ${request.city}:**
${warehouseDataSummary}

**Your Task:**
Provide a JSON response with the following structure:
{
  "recommended_price": <number>,
  "price_range_min": <number>,
  "price_range_max": <number>,
  "confidence_score": <0-100>,
  "market_insights": [
    "insight 1",
    "insight 2",
    "insight 3"
  ],
  "reasoning": "<1-2 sentences explaining the price>",
  "demand_analysis": "<brief market demand assessment>",
  "competitive_positioning": "<how this property compares to market>"
}

**Guidelines:**
1. Consider location, type, size, amenities, and market rates
2. Price should be in ₹ per sq ft per month
3. Be data-driven and realistic
4. Confidence score should reflect data quality (more comparable warehouses = higher confidence)
5. Keep insights concise and actionable

Respond ONLY with valid JSON, no markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up response (remove markdown if present)
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const geminiResponse = JSON.parse(text);

        return {
            recommended_price: geminiResponse.recommended_price,
            price_range: {
                min: geminiResponse.price_range_min,
                max: geminiResponse.price_range_max
            },
            confidence_score: geminiResponse.confidence_score,
            market_insights: geminiResponse.market_insights || [],
            reasoning: geminiResponse.reasoning,
            demand_analysis: geminiResponse.demand_analysis,
            competitive_positioning: geminiResponse.competitive_positioning
        };
    } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('Falling back to statistical pricing');
        return getFallbackPricing(request);
    }
}

/**
 * Fallback pricing using statistical methods
 */
function getFallbackPricing(request: GeminiPricingRequest): GeminiPricingResponse {
    const prices = request.nearby_warehouses.map(w => w.price_per_sqft).filter(p => p > 0);

    if (prices.length === 0) {
        return {
            recommended_price: 50,
            price_range: { min: 40, max: 60 },
            confidence_score: 30,
            market_insights: [
                'Limited market data available',
                'Using regional baseline pricing',
                'Consider adding more property details'
            ],
            reasoning: 'Based on regional baseline due to limited comparable data',
            demand_analysis: 'Market data insufficient for detailed analysis',
            competitive_positioning: 'Recommended to conduct local market research'
        };
    }

    // Statistical analysis
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const std = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length);

    const recommendedPrice = Math.round((median + avg) / 2);
    const minPrice = Math.max(10, Math.round(recommendedPrice - std));
    const maxPrice = Math.round(recommendedPrice + std);

    return {
        recommended_price: recommendedPrice,
        price_range: { min: minPrice, max: maxPrice },
        confidence_score: Math.min(95, 50 + (prices.length * 2)),
        market_insights: [
            `Analyzed ${prices.length} comparable warehouses in ${request.city}`,
            `Market average: ₹${avg}/sqft`,
            `Median price: ₹${median}/sqft`
        ],
        reasoning: `Price based on statistical analysis of ${prices.length} similar properties`,
        demand_analysis: `Market has ${prices.length} active listings in this category`,
        competitive_positioning: avg > recommendedPrice ?
            'Competitively priced below market average' :
            'Premium pricing aligned with market standards'
    };
}

export default {
    getGeminiPricingRecommendation
};
