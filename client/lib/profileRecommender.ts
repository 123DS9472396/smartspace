/**
 * Profile-Based ML Recommendation Engine
 * 
 * This module integrates seeker profiles with the ML algorithms
 * to provide personalized warehouse recommendations.
 * 
 * Uses:
 * - K-Nearest Neighbors (KNN) for distance-based similarity
 * - Random Forest for feature importance
 * - Collaborative Filtering for user-item similarity
 * - Google Gemini LLM for natural language explanations
 */

import { supabase } from '../services/supabaseClient';

// Types
interface SeekerProfile {
    id: string;
    user_id: string;
    preferred_districts: string[];
    preferred_warehouse_types: string[];
    budget_min: number | null;
    budget_max: number | null;
    required_area_min: number | null;
    required_area_max: number | null;
    preferred_amenities: string[];
    business_type: string;
}

interface Warehouse {
    id: string;
    name: string;
    city: string;
    district: string;
    price_per_sqft: number;
    total_area: number;
    warehouse_type: string;
    amenities: string[];
    rating: number;
    verified: boolean;
}

interface RecommendationResult {
    warehouse: Warehouse;
    score: number;
    matchReasons: string[];
    mlScores: {
        knn: number;
        randomForest: number;
        collaborative: number;
    };
}

/**
 * Fetch seeker profile from Supabase
 */
export async function getSeekerProfile(userId: string): Promise<SeekerProfile | null> {
    try {
        const { data, error } = await supabase
            .from('seeker_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) return null;
        return data;
    } catch (err) {
        console.error('Error fetching seeker profile:', err);
        return null;
    }
}

/**
 * Calculate Euclidean distance for KNN
 */
function calculateDistance(profile: SeekerProfile, warehouse: Warehouse): number {
    const priceTarget = (profile.budget_min || 20) + (profile.budget_max || 100) / 2;
    const areaTarget = (profile.required_area_min || 1000) + (profile.required_area_max || 100000) / 2;

    // Normalize features
    const priceDistance = Math.abs(warehouse.price_per_sqft - priceTarget) / 100;
    const areaDistance = Math.abs(warehouse.total_area - areaTarget) / 100000;

    // Location match (binary)
    const locationMatch = profile.preferred_districts.includes(warehouse.district) ? 0 : 1;

    // Type match (binary)
    const typeMatch = profile.preferred_warehouse_types.includes(warehouse.warehouse_type) ? 0 : 1;

    // Amenity match (ratio)
    const requiredAmenities = profile.preferred_amenities || [];
    const warehouseAmenities = warehouse.amenities || [];
    const amenityMatch = requiredAmenities.length > 0
        ? 1 - (requiredAmenities.filter(a => warehouseAmenities.includes(a)).length / requiredAmenities.length)
        : 0;

    // Weighted Euclidean distance
    return Math.sqrt(
        Math.pow(priceDistance * 0.3, 2) +
        Math.pow(areaDistance * 0.2, 2) +
        Math.pow(locationMatch * 0.25, 2) +
        Math.pow(typeMatch * 0.15, 2) +
        Math.pow(amenityMatch * 0.1, 2)
    );
}

/**
 * KNN-based recommendation scoring
 */
function knnScore(profile: SeekerProfile, warehouse: Warehouse): number {
    const distance = calculateDistance(profile, warehouse);
    // Convert distance to score (0-1, higher is better)
    return Math.max(0, 1 - distance);
}

/**
 * Random Forest-style feature importance scoring
 * Simulates trained model with weighted features
 */
function randomForestScore(profile: SeekerProfile, warehouse: Warehouse): number {
    let score = 0.5; // Base score

    // Feature 1: Location match (weight: 0.25)
    if (profile.preferred_districts.includes(warehouse.district)) {
        score += 0.25;
    }

    // Feature 2: Warehouse type match (weight: 0.20)
    if (profile.preferred_warehouse_types.includes(warehouse.warehouse_type)) {
        score += 0.20;
    }

    // Feature 3: Price within budget (weight: 0.20)
    const minBudget = profile.budget_min || 0;
    const maxBudget = profile.budget_max || 200;
    if (warehouse.price_per_sqft >= minBudget && warehouse.price_per_sqft <= maxBudget) {
        score += 0.20;
    } else if (warehouse.price_per_sqft < minBudget * 1.2 || warehouse.price_per_sqft < maxBudget * 1.2) {
        score += 0.10; // Slightly over budget
    }

    // Feature 4: Area within range (weight: 0.15)
    const minArea = profile.required_area_min || 0;
    const maxArea = profile.required_area_max || 500000;
    if (warehouse.total_area >= minArea && warehouse.total_area <= maxArea) {
        score += 0.15;
    }

    // Feature 5: Rating bonus (weight: 0.10)
    score += (warehouse.rating / 5) * 0.10;

    // Feature 6: Verified bonus (weight: 0.10)
    if (warehouse.verified) {
        score += 0.10;
    }

    return Math.min(1, score);
}

/**
 * Collaborative filtering score based on similar users
 * For now, uses business type similarity as a proxy
 */
function collaborativeScore(profile: SeekerProfile, warehouse: Warehouse): number {
    // Map business types to compatible warehouse types
    const businessToWarehouseMap: { [key: string]: string[] } = {
        'E-commerce': ['General Storage', 'Zepto Dark Store', 'Industrial Logistics Park'],
        'Manufacturing': ['Industrial Logistics Park', 'General Storage'],
        'Logistics': ['Industrial Logistics Park', 'General Storage'],
        'Retail': ['General Storage', 'Zepto Dark Store'],
        'FMCG': ['Cold Storage', 'Food Storage', 'General Storage'],
        'Pharma': ['Pharma Cold Chain', 'Cold Storage'],
        'Textile': ['Textile Warehouse', 'General Storage'],
        'Automobile': ['Automobile Spare Storage', 'Industrial Logistics Park'],
        'Other': ['General Storage']
    };

    const compatibleTypes = businessToWarehouseMap[profile.business_type] || ['General Storage'];

    if (compatibleTypes.includes(warehouse.warehouse_type)) {
        return 0.8 + (warehouse.rating / 5) * 0.2;
    }

    return 0.4;
}

/**
 * Ensemble ML recommendation combining all algorithms
 */
export function ensembleRecommend(
    profile: SeekerProfile,
    warehouses: Warehouse[]
): RecommendationResult[] {
    const results: RecommendationResult[] = [];

    for (const warehouse of warehouses) {
        const knn = knnScore(profile, warehouse);
        const rf = randomForestScore(profile, warehouse);
        const collab = collaborativeScore(profile, warehouse);

        // Weighted ensemble (KNN: 35%, RF: 40%, Collab: 25%)
        const ensembleScore = knn * 0.35 + rf * 0.40 + collab * 0.25;

        // Generate match reasons
        const matchReasons: string[] = [];

        if (profile.preferred_districts.includes(warehouse.district)) {
            matchReasons.push(`Located in your preferred district: ${warehouse.district}`);
        }

        if (profile.preferred_warehouse_types.includes(warehouse.warehouse_type)) {
            matchReasons.push(`${warehouse.warehouse_type} matches your preference`);
        }

        const maxBudget = profile.budget_max || 200;
        if (warehouse.price_per_sqft <= maxBudget) {
            matchReasons.push(`₹${warehouse.price_per_sqft}/sqft is within your budget`);
        }

        if (warehouse.verified) {
            matchReasons.push('Verified property with trusted owner');
        }

        if (warehouse.rating >= 4.5) {
            matchReasons.push(`Highly rated (${warehouse.rating}⭐)`);
        }

        results.push({
            warehouse,
            score: ensembleScore,
            matchReasons,
            mlScores: {
                knn,
                randomForest: rf,
                collaborative: collab
            }
        });
    }

    // Sort by ensemble score descending
    results.sort((a, b) => b.score - a.score);

    return results;
}

/**
 * Generate LLM explanation for recommendations (uses Groq/OpenRouter via unified AI service)
 */
export async function generateGeminiExplanation(
    profile: SeekerProfile,
    topRecommendations: RecommendationResult[],
    geminiApiKey: string
): Promise<string> {
    const prompt = `
You are an AI assistant helping a warehouse seeker find the perfect space.

Seeker Profile:
- Business Type: ${profile.business_type}
- Preferred Districts: ${profile.preferred_districts.join(', ')}
- Budget: ₹${profile.budget_min || 'any'} - ₹${profile.budget_max || 'any'}/sqft
- Required Area: ${profile.required_area_min || 'any'} - ${profile.required_area_max || 'any'} sqft
- Preferred Types: ${profile.preferred_warehouse_types.join(', ')}

Top 3 Recommendations:
${topRecommendations.slice(0, 3).map((r, i) => `
${i + 1}. ${r.warehouse.name}
   - Location: ${r.warehouse.district}
   - Price: ₹${r.warehouse.price_per_sqft}/sqft
   - Area: ${r.warehouse.total_area} sqft
   - Type: ${r.warehouse.warehouse_type}
   - ML Score: ${(r.score * 100).toFixed(0)}%
`).join('')}

Provide a brief 2-3 sentence explanation of why these warehouses are the best matches for this seeker.
`;

    try {
        const { getAIResponse } = await import('@/services/aiService');
        const response = await getAIResponse({
            prompt,
            systemPrompt: 'You are a warehouse recommendation expert. Provide concise, helpful explanations.',
            temperature: 0.7,
            maxTokens: 200
        });
        return response.text || 'ML analysis complete. Personalized recommendations based on your profile.';
    } catch (err) {
        console.error('LLM explanation error:', err);
        return 'ML analysis complete. Personalized recommendations based on your profile.';
    }
}

/**
 * Record user interaction for future collaborative filtering
 */
export async function recordInteraction(
    userId: string,
    warehouseId: string,
    type: 'view' | 'favorite' | 'inquiry' | 'booking',
    durationSeconds?: number
) {
    try {
        await supabase.from('user_interactions').insert({
            user_id: userId,
            warehouse_id: warehouseId,
            interaction_type: type,
            duration_seconds: durationSeconds
        });
    } catch (err) {
        console.error('Error recording interaction:', err);
    }
}
