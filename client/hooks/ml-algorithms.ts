/**
 * Advanced ML Algorithms for Warehouse Recommendations
 * Implements both KNN and Random Forest for improved recommendation quality
 */

import type { RecommendationPreferences } from '../../shared/api';

// Interface for the warehouse data structure
export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  city: string;
  district: string;
  state: string;
  price_per_sqft: number;
  total_area: number;
  occupancy: number;
  rating: number;
  reviews_count: number;
  images?: string[];
  type: string;
  amenities?: string[];
  features?: Record<string, number | boolean>;
  verified?: boolean;
}

interface FeatureWeights {
  location: number;
  price: number;
  size: number;
  type: number;
  rating: number;
  amenities: number;
  verified: number;
}

interface DistrictInfo {
  name: string;
  relatedDistricts: string[];
}

// KNN Implementation
export class KNearestNeighbors {
  private static DEFAULT_WEIGHTS: FeatureWeights = {
    location: 0.3,
    price: 0.25,
    size: 0.2,
    type: 0.1,
    rating: 0.05,
    amenities: 0.05,
    verified: 0.05
  };

  // District proximity map for location similarity scoring
  private static DISTRICT_PROXIMITY: DistrictInfo[] = [
    { name: 'Mumbai', relatedDistricts: ['Thane', 'Navi Mumbai', 'Palghar'] },
    { name: 'Pune', relatedDistricts: ['Pimpri-Chinchwad', 'Lonavala', 'Satara'] },
    { name: 'Nagpur', relatedDistricts: ['Amravati', 'Wardha', 'Bhandara'] },
    { name: 'Nashik', relatedDistricts: ['Malegaon', 'Dhule', 'Ahmednagar'] },
    { name: 'Aurangabad', relatedDistricts: ['Jalna', 'Beed', 'Osmanabad'] }
  ];

  /**
   * Find k nearest neighbors based on similarity
   */
  static findNearest(
    warehouses: Warehouse[],
    preferences: RecommendationPreferences,
    k: number = 5,
    weights: FeatureWeights = this.DEFAULT_WEIGHTS
  ) {
    // Calculate similarity scores for all warehouses
    const scoredWarehouses = warehouses.map(warehouse => {
      const score = this.calculateSimilarity(warehouse, preferences, weights);
      return { warehouse, score };
    });
    
    // Sort by similarity score (descending) and take top k
    return scoredWarehouses
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => ({
        warehouse: item.warehouse,
        similarity_score: item.score,
        recommendation_type: 'knn',
        recommendation_reasons: this.generateReasons(item.warehouse, preferences, item.score)
      }));
  }

  /**
   * Calculate similarity score between warehouse and preferences
   * Higher score means more similar
   */
  private static calculateSimilarity(
    warehouse: Warehouse,
    preferences: RecommendationPreferences,
    weights: FeatureWeights
  ): number {
    let score = 0;
    const { district, targetPrice, minAreaSqft, preferredType, preferVerified } = preferences;

    // Location score (match against both city and district, allow partial matches)
    if (district && district !== 'any') {
      const pref = district.toLowerCase();
      const warehouseCity = (warehouse.city || '').toLowerCase();
      const warehouseDistrict = (warehouse.district || '').toLowerCase();

      // Exact or partial match on city/district
      const exactMatch = warehouseCity === pref || warehouseDistrict === pref || warehouseCity.includes(pref) || warehouseDistrict.includes(pref);
      const related = exactMatch ? false : (this.isRelatedDistrict(warehouseCity, district) || this.isRelatedDistrict(warehouseDistrict, district));

      const locationScore = exactMatch ? 1 : related ? 0.6 : 0;
      score += locationScore * weights.location;
    } else {
      // No district preference specified
      score += weights.location; // Full points for location when no preference
    }

    // Price score (inversely proportional - lower is better)
    if (targetPrice) {
      const priceRatio = targetPrice / warehouse.price_per_sqft;
      // Score higher when price is less than target, with optimal at 80% of target
      const priceScore = priceRatio >= 0.8 && priceRatio <= 1.2 
        ? 1 // Within 20% of target price (ideal range)
        : priceRatio > 1.2 
          ? 0.8 // More than 20% cheaper than target
          : priceRatio >= 0.6 
            ? 0.7 - (0.1 * (1.2 - priceRatio) / 0.6) // Between 20-40% more expensive
            : 0; // More than 40% more expensive than target
      
      score += priceScore * weights.price;
    } else {
      // No price preference, normalize the price score based on market averages
      const avgPriceScore = warehouse.price_per_sqft < 25 ? 1 : 
                           warehouse.price_per_sqft < 40 ? 0.8 : 
                           warehouse.price_per_sqft < 60 ? 0.6 : 0.4;
      score += avgPriceScore * weights.price;
    }

    // Size score
    if (minAreaSqft) {
      const availableArea = warehouse.total_area * (1 - warehouse.occupancy / 100);
      const sizeScore = availableArea >= minAreaSqft 
        ? 1 // Meets minimum requirement
        : availableArea >= minAreaSqft * 0.9 
          ? 0.9 // Within 10% of requirement
          : availableArea >= minAreaSqft * 0.8 
            ? 0.7 // Within 20% of requirement
            : availableArea >= minAreaSqft * 0.7 
              ? 0.5 // Within 30% of requirement
              : 0; // Too small
      
      score += sizeScore * weights.size;
    } else {
      // No size preference, give more points for larger warehouses
      const avgSizeScore = warehouse.total_area > 50000 ? 1 :
                          warehouse.total_area > 25000 ? 0.8 :
                          warehouse.total_area > 10000 ? 0.6 : 0.4;
      score += avgSizeScore * weights.size;
    }

    // Type score
    if (preferredType && preferredType !== 'any') {
      const typeScore = warehouse.type.toLowerCase().includes(preferredType.toLowerCase()) ? 1 : 0;
      score += typeScore * weights.type;
    } else {
      // No type preference
      score += weights.type;
    }

    // Rating score
    const ratingScore = warehouse.rating >= 4.5 ? 1 :
                       warehouse.rating >= 4.0 ? 0.9 :
                       warehouse.rating >= 3.5 ? 0.7 :
                       warehouse.rating >= 3.0 ? 0.5 : 0.3;
    score += ratingScore * weights.rating;

    // Verified score
    if (preferVerified) {
      const verifiedScore = warehouse.verified ? 1 : 0;
      score += verifiedScore * weights.verified;
    } else {
      // No verified preference
      score += weights.verified;
    }

    return score;
  }

  /**
   * Check if two districts are related (nearby)
   */
  private static isRelatedDistrict(warehouseDistrict: string, preferenceDistrict: string): boolean {
    if (!warehouseDistrict || !preferenceDistrict) return false;
    const pref = preferenceDistrict.toLowerCase();
    const districtInfo = this.DISTRICT_PROXIMITY.find(
      d => d.name.toLowerCase() === pref
    );
    if (!districtInfo) return false;
    const warehouse = warehouseDistrict.toLowerCase();
    return districtInfo.relatedDistricts.some(
      related => related.toLowerCase() === warehouse || warehouse.includes(related.toLowerCase())
    );
  }

  /**
   * Generate human-readable reasons for recommendation
   */
  private static generateReasons(
    warehouse: Warehouse,
    preferences: RecommendationPreferences,
    score: number
  ): string[] {
    const reasons: string[] = [];
    
    if (preferences.district && warehouse.city === preferences.district) {
      reasons.push(`Located in your preferred district: ${warehouse.city}`);
    } else if (preferences.district && this.isRelatedDistrict(warehouse.city, preferences.district)) {
      reasons.push(`Located near your preferred district: ${warehouse.city}`);
    }
    
    if (preferences.targetPrice) {
      if (warehouse.price_per_sqft <= preferences.targetPrice) {
        reasons.push(`Price (₹${warehouse.price_per_sqft}/sqft) is within your budget`);
      } else if (warehouse.price_per_sqft <= preferences.targetPrice * 1.1) {
        reasons.push(`Price (₹${warehouse.price_per_sqft}/sqft) is slightly above your budget`);
      }
    }
    
    if (preferences.minAreaSqft) {
      const availableArea = warehouse.total_area * (1 - warehouse.occupancy / 100);
      if (availableArea >= preferences.minAreaSqft) {
        reasons.push(`Has ${Math.floor(availableArea).toLocaleString()} sqft available space`);
      }
    }
    
    if (warehouse.rating >= 4.5) {
      reasons.push(`Highly rated facility (${warehouse.rating}⭐)`);
    }
    
    if (preferences.preferredType && warehouse.type.toLowerCase().includes(preferences.preferredType.toLowerCase())) {
      reasons.push(`Matches your preferred type: ${warehouse.type}`);
    }
    
    if (preferences.preferVerified && warehouse.verified) {
      reasons.push('Verified property');
    }
    
    // Ensure we have at least 1 reason
    if (reasons.length === 0) {
      if (score > 0.8) {
        reasons.push('Great overall match based on your preferences');
      } else if (score > 0.6) {
        reasons.push('Good match for your requirements');
      } else {
        reasons.push('Partial match for your criteria');
      }
    }
    
    return reasons;
  }
}

// Random Forest Implementation
export class RandomForest {
  // Number of trees in the forest
  private static TREE_COUNT = 5;
  
  /**
   * Generate recommendations using random forest algorithm
   */
  static getRecommendations(
    warehouses: Warehouse[],
    preferences: RecommendationPreferences,
    count: number = 5
  ) {
    // Create feature subsets for each tree
    const featureSubsets = this.createFeatureSubsets();
    
    // For each tree, score warehouses using different feature subsets
    const treeScores = featureSubsets.map(features => {
      return warehouses.map(warehouse => {
        const score = this.scoreWarehouse(warehouse, preferences, features);
        return { warehouse, score };
      });
    });
    
    // Aggregate scores across all trees
    const aggregatedScores = warehouses.map(warehouse => {
      const allScores = featureSubsets.map((_, treeIndex) => {
        const result = treeScores[treeIndex].find(item => item.warehouse.id === warehouse.id);
        return result ? result.score : 0;
      });
      
      // Calculate average score across all trees
      const avgScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      
      return { 
        warehouse,
        score: avgScore,
        // Count how many trees had this warehouse in their top 3
        confidence: treeScores.filter(treeScore => {
          const topThree = treeScore.sort((a, b) => b.score - a.score).slice(0, 3);
          return topThree.some(item => item.warehouse.id === warehouse.id);
        }).length / treeScores.length
      };
    });
    
    // Sort by score and confidence
    const sortedWarehouses = aggregatedScores
      .sort((a, b) => {
        // First by score
        if (Math.abs(b.score - a.score) > 0.1) {
          return b.score - a.score;
        }
        // Then by confidence for similar scores
        return b.confidence - a.confidence;
      })
      .slice(0, count);
      
    // Map to recommendation format
    return sortedWarehouses.map(item => ({
      warehouse: item.warehouse,
      similarity_score: item.score,
      recommendation_type: 'random_forest',
      recommendation_reasons: this.generateReasons(
        item.warehouse, 
        preferences, 
        item.score, 
        item.confidence
      )
    }));
  }
  
  /**
   * Create feature subsets for different trees in the forest
   */
  private static createFeatureSubsets() {
    // Create different feature combinations for our trees
    const treeSubsets = [
      { location: 0.4, price: 0.3, size: 0.2, type: 0.1, rating: 0.0, verified: 0.0 },
      { location: 0.2, price: 0.4, size: 0.3, type: 0.0, rating: 0.1, verified: 0.0 },
      { location: 0.3, price: 0.2, size: 0.2, type: 0.2, rating: 0.0, verified: 0.1 },
      { location: 0.2, price: 0.3, size: 0.1, type: 0.1, rating: 0.2, verified: 0.1 },
      { location: 0.3, price: 0.2, size: 0.3, type: 0.0, rating: 0.1, verified: 0.1 }
    ];
    
    return treeSubsets;
  }
  
  /**
   * Score warehouse using decision tree rules
   */
  private static scoreWarehouse(
    warehouse: Warehouse,
    preferences: RecommendationPreferences,
    featureWeights: Record<string, number>
  ) {
    let score = 0;
    const { district, targetPrice, minAreaSqft, preferredType, preferVerified } = preferences;
    
    // Binary decision rules with weighted scoring
    
    // District rule
    if (district && district !== 'any') {
      if (warehouse.city.toLowerCase() === district.toLowerCase()) {
        score += 1 * featureWeights.location;
      } else {
        const nearbyDistricts = this.getNearbyDistricts(district);
        if (nearbyDistricts.includes(warehouse.city.toLowerCase())) {
          score += 0.5 * featureWeights.location;
        }
      }
    } else {
      // No location preference
      score += featureWeights.location;
    }
    
    // Price rule
    if (targetPrice) {
      if (warehouse.price_per_sqft <= targetPrice) {
        score += 1 * featureWeights.price;
      } else if (warehouse.price_per_sqft <= targetPrice * 1.2) {
        score += 0.5 * featureWeights.price;
      }
    } else {
      // No price preference
      const marketAvg = 35; // Assumed average market price
      if (warehouse.price_per_sqft <= marketAvg) {
        score += 0.7 * featureWeights.price;
      } else {
        score += 0.3 * featureWeights.price;
      }
    }
    
    // Size rule
    if (minAreaSqft) {
      const availableArea = warehouse.total_area * (1 - warehouse.occupancy / 100);
      if (availableArea >= minAreaSqft) {
        score += 1 * featureWeights.size;
      } else if (availableArea >= minAreaSqft * 0.8) {
        score += 0.5 * featureWeights.size;
      }
    } else {
      // No size preference
      score += featureWeights.size;
    }
    
    // Type rule
    if (preferredType && preferredType !== 'any') {
      if (warehouse.type.toLowerCase().includes(preferredType.toLowerCase())) {
        score += 1 * featureWeights.type;
      }
    } else {
      // No type preference
      score += featureWeights.type;
    }
    
    // Rating rule
    if (warehouse.rating >= 4.0) {
      score += 1 * featureWeights.rating;
    } else if (warehouse.rating >= 3.5) {
      score += 0.5 * featureWeights.rating;
    }
    
    // Verified rule
    if (preferVerified && warehouse.verified) {
      score += 1 * featureWeights.verified;
    } else if (!preferVerified) {
      score += featureWeights.verified;
    }
    
    return score;
  }
  
  /**
   * Get nearby districts for location similarity
   */
  private static getNearbyDistricts(district: string): string[] {
    const districtMap: Record<string, string[]> = {
      'mumbai': ['thane', 'navi mumbai', 'palghar'],
      'pune': ['pimpri-chinchwad', 'lonavala', 'satara'],
      'nagpur': ['amravati', 'wardha', 'bhandara'],
      'nashik': ['malegaon', 'dhule', 'ahmednagar'],
      'aurangabad': ['jalna', 'beed', 'osmanabad']
    };
    
    return districtMap[district.toLowerCase()] || [];
  }
  
  /**
   * Generate human-readable reasons for recommendation
   */
  private static generateReasons(
    warehouse: Warehouse,
    preferences: RecommendationPreferences,
    score: number,
    confidence: number
  ): string[] {
    const reasons: string[] = [];
    
    // Location-based reasons
    if (preferences.district && preferences.district !== 'any') {
      if (warehouse.city.toLowerCase() === preferences.district.toLowerCase()) {
        reasons.push(`Located in your preferred district: ${warehouse.city}`);
      } else if (this.getNearbyDistricts(preferences.district).includes(warehouse.city.toLowerCase())) {
        reasons.push(`Located near your preferred district: ${warehouse.city}`);
      }
    }
    
    // Price-based reasons
    if (preferences.targetPrice) {
      if (warehouse.price_per_sqft <= preferences.targetPrice) {
        const savings = ((preferences.targetPrice - warehouse.price_per_sqft) / preferences.targetPrice * 100).toFixed(0);
        if (parseInt(savings) > 5) {
          reasons.push(`Price (₹${warehouse.price_per_sqft}/sqft) is ${savings}% below your budget`);
        } else {
          reasons.push(`Price (₹${warehouse.price_per_sqft}/sqft) is within your budget`);
        }
      }
    }
    
    // Size-based reasons
    if (preferences.minAreaSqft) {
      const availableArea = warehouse.total_area * (1 - warehouse.occupancy / 100);
      if (availableArea >= preferences.minAreaSqft) {
        const extraSpace = ((availableArea - preferences.minAreaSqft) / preferences.minAreaSqft * 100).toFixed(0);
        if (parseInt(extraSpace) > 10) {
          reasons.push(`${Math.floor(availableArea).toLocaleString()} sqft available (${extraSpace}% more than requested)`);
        } else {
          reasons.push(`${Math.floor(availableArea).toLocaleString()} sqft meets your space requirements`);
        }
      }
    }
    
    // Type-based reasons
    if (preferences.preferredType && preferences.preferredType !== 'any' && 
        warehouse.type.toLowerCase().includes(preferences.preferredType.toLowerCase())) {
      reasons.push(`Matches your preferred type: ${warehouse.type}`);
    }
    
    // Rating-based reason
    if (warehouse.rating >= 4.5) {
      reasons.push(`Top-rated facility (${warehouse.rating}⭐)`);
    } else if (warehouse.rating >= 4.0) {
      reasons.push(`Highly rated facility (${warehouse.rating}⭐)`);
    }
    
    // Verification reason
    if (preferences.preferVerified && warehouse.verified) {
      reasons.push('Verified property with guaranteed details');
    }
    
    // Confidence-based reason
    if (confidence > 0.8) {
      reasons.push('High confidence recommendation across multiple criteria');
    }
    
    // Ensure we have at least one reason
    if (reasons.length === 0) {
      reasons.push('Good overall match for your requirements');
    }
    
    return reasons;
  }
}

/**
 * Ensemble method that combines KNN and Random Forest for better recommendations
 */
export class HybridRecommender {
  static getRecommendations(
    warehouses: Warehouse[],
    preferences: RecommendationPreferences,
    count: number = 5
  ) {
    try {
      // Get recommendations from both algorithms
      const knnResults = KNearestNeighbors.findNearest(warehouses, preferences, count * 2);
      const rfResults = RandomForest.getRecommendations(warehouses, preferences, count * 2);
      
      // Create a scoring map for all warehouses
      const warehouseScores = new Map<string, { 
        warehouse: Warehouse;
        knnScore: number;
        rfScore: number;
        knnRank: number;
        rfRank: number;
        reasons: string[];
      }>();
      
      // Process KNN results
      knnResults.forEach((result, index) => {
        warehouseScores.set(result.warehouse.id, {
          warehouse: result.warehouse,
          knnScore: result.similarity_score,
          rfScore: 0,
          knnRank: index + 1,
          rfRank: rfResults.length + 1, // Default to worst rank + 1
          reasons: [...result.recommendation_reasons]
        });
      });
      
      // Process RF results
      rfResults.forEach((result, index) => {
        const existingEntry = warehouseScores.get(result.warehouse.id);
        if (existingEntry) {
          existingEntry.rfScore = result.similarity_score;
          existingEntry.rfRank = index + 1;
          // Add unique reasons
          result.recommendation_reasons.forEach(reason => {
            if (!existingEntry.reasons.includes(reason)) {
              existingEntry.reasons.push(reason);
            }
          });
        } else {
          warehouseScores.set(result.warehouse.id, {
            warehouse: result.warehouse,
            knnScore: 0,
            rfScore: result.similarity_score,
            knnRank: knnResults.length + 1, // Default to worst rank + 1
            rfRank: index + 1,
            reasons: [...result.recommendation_reasons]
          });
        }
      });
      
      // Calculate hybrid scores - weighted sum of normalized ranks and scores
      const KNN_WEIGHT = 0.6;
      const RF_WEIGHT = 0.4;
      
      // Convert to array and normalize scores across all items to [0,1]
      const entries = Array.from(warehouseScores.values());

      const knnScores = entries.map(e => e.knnScore || 0);
      const rfScores = entries.map(e => e.rfScore || 0);
      const minKnn = Math.min(...knnScores);
      const maxKnn = Math.max(...knnScores) || 1;
      const minRf = Math.min(...rfScores);
      const maxRf = Math.max(...rfScores) || 1;

      const hybridResults = entries
        .map(item => {
          const maxKnnRank = knnResults.length + 1;
          const maxRfRank = rfResults.length + 1;
          const normKnnRank = 1 - (item.knnRank / maxKnnRank);
          const normRfRank = 1 - (item.rfRank / maxRfRank);

          // Normalize raw knn/rf scores to 0..1
          const normKnnScore = (item.knnScore - minKnn) / (maxKnn - minKnn || 1);
          const normRfScore = (item.rfScore - minRf) / (maxRf - minRf || 1);

          // Weighted combination using normalized scores and ranks
          const hybridScore = (
            KNN_WEIGHT * (normKnnScore * 0.7 + normKnnRank * 0.3) + 
            RF_WEIGHT * (normRfScore * 0.7 + normRfRank * 0.3)
          );

          return {
            warehouse: item.warehouse,
            similarity_score: hybridScore,
            recommendation_type: 'hybrid',
            recommendation_reasons: item.reasons.slice(0, 4) // Limit to 4 reasons
          };
        })
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, count);
      
      return hybridResults;
    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
      // Fallback to KNN if hybrid approach fails
      return KNearestNeighbors.findNearest(warehouses, preferences, count);
    }
  }
}

// Export a facade for all recommendation algorithms
export const MLRecommender = {
  /**
   * Get recommendations using the best available algorithm
   * Falls back to simpler algorithms if more complex ones fail
   */
  getRecommendations(
    warehouses: Warehouse[],
    preferences: RecommendationPreferences,
    count: number = 5
  ) {
    try {
      // Try hybrid approach first (best quality)
      console.log('Trying hybrid algorithm...');
      return HybridRecommender.getRecommendations(warehouses, preferences, count);
    } catch (error) {
      console.error('Hybrid algorithm failed, falling back to KNN:', error);
      try {
        // Fall back to KNN
        console.log('Trying KNN algorithm...');
        return KNearestNeighbors.findNearest(warehouses, preferences, count);
      } catch (knnError) {
        console.error('KNN algorithm failed, using basic sorting:', knnError);
        // Ultimate fallback - basic sorting
        console.log('Using basic sorting as last resort...');
        return this.basicSortRecommendations(warehouses, preferences, count);
      }
    }
  },
  
  /**
   * Super simple recommendation approach as final fallback
   */
  basicSortRecommendations(
    warehouses: Warehouse[],
    preferences: RecommendationPreferences,
    count: number = 5
  ) {
    // Simple filtering based on preferences
    let filtered = [...warehouses];
    
    // Filter by district if specified
    if (preferences.district && preferences.district !== 'any') {
      filtered = filtered.filter(w => 
        w.city.toLowerCase() === preferences.district?.toLowerCase() ||
        w.district.toLowerCase() === preferences.district?.toLowerCase()
      );
      
      // If no results, ignore district filter
      if (filtered.length === 0) filtered = [...warehouses];
    }
    
    // Filter by price if specified
    if (preferences.targetPrice) {
      const maxPrice = preferences.targetPrice * 1.2; // Allow 20% above target price
      filtered = filtered.filter(w => w.price_per_sqft <= maxPrice);
      
      // If no results, ignore price filter
      if (filtered.length === 0) filtered = [...warehouses];
    }
    
    // Sort by rating
    filtered.sort((a, b) => b.rating - a.rating);
    
    // Take top results
    const topResults = filtered.slice(0, count);
    
    // Map to recommendation format
    return topResults.map(warehouse => {
      const similarityScore = 0.7 + (Math.random() * 0.2); // Random score between 0.7-0.9
      
      return {
        warehouse,
        similarity_score: similarityScore,
        recommendation_type: 'basic',
        recommendation_reasons: this.generateBasicReasons(warehouse, preferences)
      };
    });
  },
  
  /**
   * Generate basic reasons for fallback recommendations
   */
  generateBasicReasons(warehouse: Warehouse, preferences: RecommendationPreferences): string[] {
    const reasons: string[] = [];
    
    if (warehouse.rating >= 4) {
      reasons.push(`Highly rated facility (${warehouse.rating}⭐)`);
    }
    
    if (preferences.district && warehouse.city === preferences.district) {
      reasons.push(`Located in ${warehouse.city}`);
    }
    
    reasons.push(`${warehouse.type} warehouse`);
    
    if (warehouse.verified) {
      reasons.push('Verified property');
    }
    
    return reasons;
  }
};
