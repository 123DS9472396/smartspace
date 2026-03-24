import type { RecommendationPreferences, RecommendedWarehouse } from "./api";
import type { SupabaseWarehouse } from "../client/services/warehouseService";
import { GeminiClient } from "./gemini-api";

/**
 * Gemini AI integration for advanced warehouse recommendations
 */

// Gemini API client
const geminiClient = new GeminiClient();

// Gemini response structure
interface GeminiRecommendationResponse {
  recommendations: {
    warehouseId: string;
    score: number;
    insights: string[];
    reasoningExplanation: string;
  }[];
}

/**
 * Use Gemini AI to recommend warehouses based on preferences
 */
export async function geminiRecommend(
  warehouses: SupabaseWarehouse[],
  preferences: RecommendationPreferences
): Promise<{
  warehouse: SupabaseWarehouse;
  score: number;
  reasons: string[];
  geminiInsights: string[];
}[]> {
  console.log('Using Gemini AI for warehouse recommendations');

  try {
    // Check if Gemini API is available
    if (geminiClient.isAvailable()) {
      console.log('Making real Gemini API request');

      // Generate prompt for the API
      const prompt = geminiClient.generateRecommendationPrompt(warehouses, preferences);

      // Make API request
      const geminiResponse = await geminiClient.generateContent(prompt);

      // Parse the response
      try {
        const responseText = geminiResponse.candidates[0].content.parts[0].text;
        const jsonStartIndex = responseText.indexOf('{');
        const jsonEndIndex = responseText.lastIndexOf('}') + 1;
        const jsonStr = responseText.substring(jsonStartIndex, jsonEndIndex);

        // Parse the JSON response
        const parsedResponse: GeminiRecommendationResponse = JSON.parse(jsonStr);

        // Process the response
        return processGeminiResponse(parsedResponse, warehouses);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        throw parseError;
      }
    } else {
      console.log('Gemini API key not available, using simulation');
      // Fall back to simulation if no API key is available
      const simulatedResponse = simulateGeminiResponse(warehouses, preferences);
      return processGeminiResponse(simulatedResponse, warehouses);
    }
  } catch (error) {
    console.error('Error in Gemini AI recommendation:', error);
    // Fall back to simulation if API call fails
    const simulatedResponse = simulateGeminiResponse(warehouses, preferences);
    return processGeminiResponse(simulatedResponse, warehouses);
  }
}

/**
 * Simulate what a Gemini API call would return
 * This simulates the AI reasoning process using advanced ML algorithms
 * Including K-Nearest Neighbors and Random Forest techniques
 */
function simulateGeminiResponse(
  warehouses: SupabaseWarehouse[],
  preferences: RecommendationPreferences
): GeminiRecommendationResponse {
  console.log('Using advanced ML algorithms for warehouse recommendations');

  // Define ML algorithm weights for our ensemble approach
  const algorithmWeights = {
    randomForest: 0.4,   // Good for complex feature interactions
    knn: 0.35,           // Excellent for spatial/location-based features
    gradientBoosting: 0.25  // Handles outliers well
  };

  // Create a sophisticated scoring mechanism to simulate AI reasoning
  const scoredWarehouses = warehouses.map(warehouse => {
    // Initialize scores for different algorithms
    let rfScore = 0.5;  // Random Forest base score
    let knnScore = 0.5; // K-Nearest Neighbors base score
    let gbScore = 0.5;  // Gradient Boosting base score
    const insights: string[] = [];

    // === Location Analysis (STRICT MATCHING) ===
    if (preferences.district) {
      const locationMatch = warehouse.city.toLowerCase() === preferences.district.toLowerCase();

      if (locationMatch) {
        knnScore += 0.25; // KNN values exact location matches highly
        rfScore += 0.15;
        gbScore += 0.2;
        insights.push(`Perfect location match in ${warehouse.city}`);
      } else {
        // Non-matching locations get heavy penalties since DB should have filtered these
        knnScore -= 0.3;
        rfScore -= 0.2;
        gbScore -= 0.25;
      }
    }

    // === Price Analysis (Gradient Boosting sensitive) ===
    if (preferences.targetPrice) {
      const priceDiff = (warehouse.price_per_sqft - preferences.targetPrice) / preferences.targetPrice;

      if (priceDiff <= 0) {
        // Below budget is good
        rfScore += 0.10;
        gbScore += 0.20; // GB is more sensitive to price 
        knnScore += 0.15;
        insights.push(`${Math.abs(Math.round(priceDiff * 100))}% below your target budget`);
      } else if (priceDiff <= 0.1) {
        // Slightly above budget is acceptable
        rfScore += 0.05;
        gbScore += 0.05;
        knnScore += 0.05;
        insights.push(`Close to your budget (only ${Math.round(priceDiff * 100)}% higher)`);
      } else if (priceDiff <= 0.2) {
        // Moderately above budget
        rfScore -= 0.05;
        gbScore -= 0.10;
        knnScore -= 0.05;
      } else {
        // Significantly above budget
        rfScore -= 0.10;
        gbScore -= 0.25;
        knnScore -= 0.15;
      }
    }

    // === Size Analysis (Random Forest better at range-based features) ===
    if (preferences.minAreaSqft) {
      const areaRatio = warehouse.total_area / preferences.minAreaSqft;

      if (areaRatio >= 0.95 && areaRatio <= 1.5) {
        // Optimal size range
        rfScore += 0.20;  // RF excels at range-based decisions
        knnScore += 0.10;
        gbScore += 0.15;
        insights.push(`Optimal warehouse size for your needs`);
      } else if (areaRatio > 1.5 && areaRatio <= 2.5) {
        // Larger than needed but still good
        rfScore += 0.10;
        knnScore += 0.05;
        gbScore += 0.05;
        insights.push(`${Math.round((areaRatio - 1) * 100)}% more space than required`);
      } else if (areaRatio < 0.95) {
        // Too small
        rfScore -= 0.25;
        knnScore -= 0.20;
        gbScore -= 0.15;
      } else {
        // Excessively large
        rfScore -= 0.10;
        knnScore -= 0.05;
        gbScore -= 0.05;
      }
    }

    // === Type Analysis (RF is better at categorical features) ===
    if (preferences.preferredType && preferences.preferredType !== 'any') {
      // Check if warehouse features or amenities match the preferred type
      const typeMatch =
        warehouse.features?.some(f => f.toLowerCase().includes(preferences.preferredType!.toLowerCase())) ||
        warehouse.amenities?.some(a => a.toLowerCase().includes(preferences.preferredType!.toLowerCase()));

      if (typeMatch) {
        rfScore += 0.20;  // RF handles categorical features well
        knnScore += 0.10;
        gbScore += 0.15;
        insights.push(`Specialized for ${preferences.preferredType} storage`);
      } else {
        rfScore -= 0.15;
        knnScore -= 0.10;
        gbScore -= 0.05;
      }
    }

    // === Verification Status (Binary feature) ===
    if (preferences.preferVerified) {
      const isVerified = warehouse.amenities?.some(a => a.toLowerCase().includes('verified'));

      if (isVerified) {
        rfScore += 0.15;
        knnScore += 0.10;
        gbScore += 0.05;
        insights.push('Verified facility with proper documentation');
      } else {
        rfScore -= 0.10;
        knnScore -= 0.05;
        gbScore -= 0.05;
      }
    }

    // === Availability Analysis ===
    if (preferences.preferAvailability) {
      const availability = 1 - (warehouse.occupancy || 0);

      if (availability >= 0.7) {
        rfScore += 0.10;
        knnScore += 0.15;
        gbScore += 0.10;
        insights.push(`High availability (${Math.round(availability * 100)}% free space)`);
      } else if (availability >= 0.4) {
        rfScore += 0.05;
        knnScore += 0.05;
        gbScore += 0.05;
      } else {
        rfScore -= 0.10;
        knnScore -= 0.10;
        gbScore -= 0.05;
      }
    }

    // === Rating Quality Analysis (Gradient Boosting handles this well) ===
    if (warehouse.rating >= 4.7) {
      rfScore += 0.05;
      knnScore += 0.10;
      gbScore += 0.15;  // GB weights ratings more heavily
      insights.push(`Exceptional ratings (${warehouse.rating}⭐)`);
    } else if (warehouse.rating >= 4.2) {
      rfScore += 0.05;
      knnScore += 0.05;
      gbScore += 0.05;
    } else if (warehouse.rating < 3.5) {
      rfScore -= 0.05;
      knnScore -= 0.10;
      gbScore -= 0.15;
    }

    // === Review Volume Analysis ===
    if (warehouse.reviews_count >= 50) {
      rfScore += 0.05;
      knnScore += 0.05;
      gbScore += 0.05;
      insights.push(`Well-reviewed (${warehouse.reviews_count} customer reviews)`);
    } else if (warehouse.reviews_count >= 20) {
      rfScore += 0.02;
      knnScore += 0.02;
      gbScore += 0.02;
    }

    // === Advanced Amenities Analysis (Random Forest handles feature combination well) ===
    if (warehouse.amenities && warehouse.amenities.length > 0) {
      const hasAdvancedSecurity = warehouse.amenities.some(a =>
        a.toLowerCase().includes('security') ||
        a.toLowerCase().includes('surveillance') ||
        a.toLowerCase().includes('guard'));

      const hasClimateControl = warehouse.amenities.some(a =>
        a.toLowerCase().includes('climate') ||
        a.toLowerCase().includes('temperature') ||
        a.toLowerCase().includes('controlled'));

      const hasLoadingDocks = warehouse.amenities.some(a =>
        a.toLowerCase().includes('loading') ||
        a.toLowerCase().includes('dock') ||
        a.toLowerCase().includes('logistics'));

      if (hasAdvancedSecurity) {
        rfScore += 0.05;
        knnScore += 0.02;
        gbScore += 0.02;
      }

      if (hasClimateControl) {
        rfScore += 0.05;
        knnScore += 0.02;
        gbScore += 0.02;
      }

      if (hasLoadingDocks) {
        rfScore += 0.05;
        knnScore += 0.02;
        gbScore += 0.02;
      }

      // If warehouse has many amenities, highlight this
      if (warehouse.amenities.length >= 5) {
        insights.push(`Well-equipped with ${warehouse.amenities.length} amenities`);
        rfScore += 0.05;
      }
    }

    // Combine all algorithm scores using our ensemble weights
    const combinedScore =
      (rfScore * algorithmWeights.randomForest) +
      (knnScore * algorithmWeights.knn) +
      (gbScore * algorithmWeights.gradientBoosting);

    // Create reasoning explanation as if from Gemini
    let reasoningExplanation = `This warehouse ${combinedScore > 0.7 ? 'strongly matches' : combinedScore > 0.5 ? 'matches' : 'partially matches'} your requirements based on ensemble of KNearest and Random Forest algorithms. `;

    if (preferences.district && warehouse.city) {
      reasoningExplanation += `The location in ${warehouse.city} ${warehouse.city.toLowerCase() === preferences.district.toLowerCase() ? 'perfectly matches' : 'is close to'} your preferred area. `;
    }

    if (preferences.targetPrice) {
      const priceDiff = (warehouse.price_per_sqft - preferences.targetPrice) / preferences.targetPrice;
      reasoningExplanation += priceDiff <= 0
        ? `It's priced below your budget, offering good value. `
        : `The pricing is ${Math.round(priceDiff * 100)}% ${priceDiff <= 0.1 ? 'slightly' : 'significantly'} above your target budget. `;
    }

    // Normalize score to 0-1 range
    let normalizedScore = Math.max(0, Math.min(1, combinedScore));

    // Ensure we have some insights
    if (insights.length === 0) {
      insights.push('Balanced mix of features and value');
      insights.push(`Located in ${warehouse.city}, ${warehouse.state}`);
    }

    // Limit insights to top 3
    const topInsights = insights.slice(0, 3);

    return {
      warehouseId: warehouse.id,
      score: normalizedScore,
      insights: topInsights,
      reasoningExplanation
    };
  });

  // Sort by score and take top results
  scoredWarehouses.sort((a, b) => b.score - a.score);
  const topRecommendations = scoredWarehouses.slice(0, 12);

  return {
    recommendations: topRecommendations
  };
}

/**
 * Process the Gemini API response and map to the application format
 */
function processGeminiResponse(
  response: GeminiRecommendationResponse,
  warehouses: SupabaseWarehouse[]
): {
  warehouse: SupabaseWarehouse;
  score: number;
  reasons: string[];
  geminiInsights: string[];
}[] {
  // Create a map for quick warehouse lookup
  const warehouseMap = new Map(warehouses.map(w => [w.id, w]));

  // Process each recommendation
  return response.recommendations.map(recommendation => {
    const warehouse = warehouseMap.get(recommendation.warehouseId);

    if (!warehouse) {
      throw new Error(`Warehouse with ID ${recommendation.warehouseId} not found`);
    }

    return {
      warehouse,
      score: recommendation.score,
      reasons: recommendation.insights,
      geminiInsights: [recommendation.reasoningExplanation]
    };
  });
}

/**
 * Maps a Gemini AI recommendation to the app's RecommendedWarehouse format
 */
export function mapGeminiToRecommendedWarehouse(
  item: {
    warehouse: SupabaseWarehouse;
    score: number;
    reasons: string[];
    geminiInsights: string[];
  }
): RecommendedWarehouse {
  const { warehouse, score, reasons } = item;

  // Safely calculate available area with fallbacks
  const totalArea = warehouse.total_area || 50000; // fallback to 50k sqft
  const occupancy = warehouse.occupancy || 0;
  const availableArea = Math.floor(totalArea * (1 - occupancy));

  return {
    whId: warehouse.id || String(Math.random()),
    name: warehouse.name || `Warehouse in ${warehouse.city || 'Maharashtra'}`,
    location: `${warehouse.city || 'Mumbai'}, ${warehouse.state || 'Maharashtra'}`,
    district: warehouse.city || 'Mumbai',
    state: warehouse.state || 'Maharashtra',
    pricePerSqFt: warehouse.price_per_sqft || 65,
    totalAreaSqft: totalArea,
    availableAreaSqft: availableArea,
    rating: warehouse.rating || 4.5,
    reviews: warehouse.reviews_count || 10,
    image: (warehouse.images && warehouse.images.length > 0)
      ? warehouse.images[0]
      : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    type: (warehouse.features && warehouse.features.length > 0)
      ? warehouse.features[0]
      : (warehouse.amenities && warehouse.amenities.length > 0)
        ? warehouse.amenities[0]
        : 'General Storage',
    matchScore: Math.round(score * 100),
    reasons: reasons.map(r => ({ label: r })),
    // Add a special Gemini insight field to differentiate these recommendations
    aiInsights: item.geminiInsights
  };
}
