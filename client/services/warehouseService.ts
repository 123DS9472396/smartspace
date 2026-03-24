// Import Supabase client from the dedicated client file
import { supabase } from "./supabaseClient";
import type { WarehouseData } from "@/data/warehouses";
import type {
  RecommendationPreferences,
  RecommendationResponse,
  RecommendedWarehouse,
} from "../../shared/api";
import { getAIResponse } from "./aiService";

// CRITICAL: ALL data MUST come from Supabase only - no mock data
// Mock data imports removed to prevent data mixing issues
const USE_MOCK_DATA_FALLBACK = false;

// Empty mock structure for fallback (should never be used)
const mockData: { warehouses: any[]; platformStats: any } = {
  warehouses: [],
  platformStats: {
    totalWarehouses: 0,
    totalCapacity: 0,
    totalArea: 0,
    averageOccupancy: 0,
    districtsCount: 0,
    verifiedWarehouses: 0,
  },
};

console.log(
  "🔌 WarehouseService initialized - Using Supabase only (no mock data)",
);

export interface SupabaseWarehouse {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  district?: string; // Add district field for location matching
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  total_area: number;
  price_per_sqft: number;
  images: string[];
  amenities: string[];
  features: string[];
  status: string;
  occupancy: number;
  rating: number;
  reviews_count: number;
  total_blocks: number;
  available_blocks: number;
  grid_rows: number;
  grid_cols: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  wh_id?: string;
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  warehouse_type?: string | null; // Type of warehouse (Cold Storage, Dark Store, etc.)
  allowed_goods_types?: string[] | null; // Goods types allowed for this warehouse
  license_valid_upto?: string | null; // License expiry date
  verified?: boolean | null;
}

export interface WarehouseFilters {
  city?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MLRecommendationRequest {
  user_preferences?: {
    preferred_cities?: string[];
    max_budget?: number;
    min_area?: number;
    preferred_amenities?: string[];
    business_type?: string;
  };
  current_warehouse_id?: string;
  limit?: number;
}

export interface MLRecommendationResponse {
  warehouse: SupabaseWarehouse;
  similarity_score: number;
  recommendation_reasons: string[];
  recommendation_type:
    | "location"
    | "price"
    | "features"
    | "collaborative"
    | "hybrid";
}

class WarehouseService {
  // Helper method to convert WarehouseData to SupabaseWarehouse
  private convertMockToSupabase(
    mockWarehouse: WarehouseData,
  ): SupabaseWarehouse {
    const safeOccupancy = Math.max(0, Math.min(1, mockWarehouse.occupancy));
    const safeSize = Math.max(0, mockWarehouse.size);
    const safePricing = Math.max(0, mockWarehouse.pricing);
    const safeRating = Math.max(0, Math.min(5, mockWarehouse.rating));
    const totalBlocks = Math.ceil(safeSize / 1000);
    const availableBlocks = Math.max(
      0,
      Math.ceil(totalBlocks * (1 - safeOccupancy)),
    );

    return {
      id: mockWarehouse.whId,
      wh_id: mockWarehouse.whId,
      name: `${mockWarehouse.district} Warehouse ${mockWarehouse.whId.substring(0, 8)}`,
      description:
        mockWarehouse.description ||
        `Premium warehouse facility in ${mockWarehouse.district}, ${mockWarehouse.state}. Modern infrastructure with excellent connectivity.`,
      address: mockWarehouse.address,
      city: mockWarehouse.district,
      state: mockWarehouse.state,
      pincode: "411001",
      latitude: null,
      longitude: null,
      total_area: safeSize,
      price_per_sqft: safePricing,
      images: [mockWarehouse.image],
      amenities: mockWarehouse.amenities || [],
      features: [
        "24/7 Security",
        "CCTV Surveillance",
        "Fire Safety",
        "Loading Docks",
      ],
      status:
        mockWarehouse.status.toLowerCase() === "active"
          ? "available"
          : mockWarehouse.status.toLowerCase(),
      occupancy: safeOccupancy,
      rating: safeRating,
      reviews_count: Math.max(0, mockWarehouse.reviews || 0),
      total_blocks: totalBlocks,
      available_blocks: availableBlocks,
      grid_rows: Math.ceil(Math.sqrt(totalBlocks)),
      grid_cols: Math.ceil(Math.sqrt(totalBlocks)),
      owner_id: null,
      created_at: mockWarehouse.registrationDate || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contact_person: null,
      contact_phone: null,
      contact_email: null,
    };
  }

  // Get mock data with filters
  private getMockWarehouses(filters: WarehouseFilters = {}): {
    data: SupabaseWarehouse[];
    count: number;
  } {
    try {
      console.log("🔄 Using mock warehouse data with filters:", filters);
      console.log(
        "📦 Total mock warehouses available:",
        mockData.warehouses?.length || 0,
      );

      // Start with all warehouses
      let filteredWarehouses = mockData.warehouses || [];

      // Apply filters
      if (filters.city) {
        filteredWarehouses = filteredWarehouses.filter((w) => {
          // Try to match city or district (some mock data might use district instead of city)
          const cityMatch =
            w.city &&
            w.city.toLowerCase().includes(filters.city!.toLowerCase());
          const districtMatch =
            w.district &&
            w.district.toLowerCase().includes(filters.city!.toLowerCase());
          return cityMatch || districtMatch;
        });
      }

      if (filters.min_price) {
        filteredWarehouses = filteredWarehouses.filter(
          (w) => w.pricing >= filters.min_price!,
        );
      }

      if (filters.max_price) {
        filteredWarehouses = filteredWarehouses.filter(
          (w) => w.pricing <= filters.max_price!,
        );
      }

      if (filters.min_area) {
        filteredWarehouses = filteredWarehouses.filter(
          (w) => w.size >= filters.min_area!,
        );
      }

      if (filters.max_area) {
        filteredWarehouses = filteredWarehouses.filter(
          (w) => w.size <= filters.max_area!,
        );
      }

      if (filters.status) {
        filteredWarehouses = filteredWarehouses.filter(
          (w) => w.status.toLowerCase() === filters.status!.toLowerCase(),
        );
      } else {
        // Default to active warehouses (equivalent to "approved")
        filteredWarehouses = filteredWarehouses.filter(
          (w) => w.status === "Active",
        );
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredWarehouses = filteredWarehouses.filter(
          (w) =>
            (w.whId && w.whId.toLowerCase().includes(searchTerm)) ||
            (w.address && w.address.toLowerCase().includes(searchTerm)) ||
            (w.district && w.district.toLowerCase().includes(searchTerm)) ||
            (w.state && w.state.toLowerCase().includes(searchTerm)) ||
            (w.description && w.description.toLowerCase().includes(searchTerm)),
        );
      }

      // Sort by rating
      filteredWarehouses.sort((a, b) => b.rating - a.rating);

      // Calculate total count before pagination
      const totalCount = filteredWarehouses.length;

      // Apply pagination
      if (filters.offset && filters.limit) {
        filteredWarehouses = filteredWarehouses.slice(
          filters.offset,
          filters.offset + filters.limit,
        );
      } else if (filters.limit) {
        filteredWarehouses = filteredWarehouses.slice(0, filters.limit);
      } else {
        filteredWarehouses = filteredWarehouses.slice(0, 500); // Default limit increased to show more warehouses
      }

      // Convert to Supabase format
      const supabaseWarehouses = filteredWarehouses.map((w) =>
        this.convertMockToSupabase(w),
      );

      console.log(
        `✅ Returning ${supabaseWarehouses.length} mock warehouses out of ${totalCount}`,
      );
      return { data: supabaseWarehouses, count: totalCount };
    } catch (error) {
      console.error("Error in getMockWarehouses:", error);
      return { data: [], count: 0 };
    }
  }

  // Get all warehouses with filters
  async getWarehouses(
    filters: WarehouseFilters = {},
  ): Promise<{ data: SupabaseWarehouse[]; count: number }> {
    try {
      console.log("Fetching warehouses with filters:", filters);

      // Fetch from original warehouses table (Maharashtra focus)
      let warehousesQuery = supabase
        .from("warehouses")
        .select("*", { count: "exact" })
        .eq("state", "Maharashtra");

      // Apply filters to warehouses
      if (filters.city) {
        warehousesQuery = warehousesQuery.ilike("city", `%${filters.city}%`);
      }

      if (filters.min_price) {
        warehousesQuery = warehousesQuery.gte(
          "price_per_sqft",
          filters.min_price,
        );
      }

      if (filters.max_price) {
        warehousesQuery = warehousesQuery.lte(
          "price_per_sqft",
          filters.max_price,
        );
      }

      if (filters.min_area) {
        warehousesQuery = warehousesQuery.gte("total_area", filters.min_area);
      }

      if (filters.max_area) {
        warehousesQuery = warehousesQuery.lte("total_area", filters.max_area);
      }

      if (filters.status) {
        warehousesQuery = warehousesQuery.eq("status", filters.status);
      } else {
        // Default to active warehouses
        warehousesQuery = warehousesQuery.eq("status", "active");
      }

      if (filters.search) {
        // Enhanced search across multiple fields
        warehousesQuery = warehousesQuery.or(
          `name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }

      // Execute warehouse query
      // Apply offset and limit for pagination
      if (filters.offset !== undefined) {
        warehousesQuery = warehousesQuery.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1,
        );
      } else if (filters.limit) {
        warehousesQuery = warehousesQuery.limit(filters.limit);
      }

      const warehousesResult = await warehousesQuery;
      const {
        data: warehouses,
        error: warehousesError,
        count: warehousesCount,
      } = warehousesResult;

      // Skip warehouse_submissions query - table may not exist
      // This prevents 400 errors in the console
      const approvedSubmissions: any[] = [];

      console.log("📊 FETCHED DATA:", {
        warehouses: warehouses?.length || 0,
        searchQuery: filters.search || "none",
        filters: filters,
      });

      if (warehousesError) {
        console.error("Error fetching warehouses:", warehousesError);
      }

      // Convert approved submissions to SupabaseWarehouse format
      const convertedSubmissions: SupabaseWarehouse[] = (
        approvedSubmissions || []
      ).map((submission) => ({
        id: submission.id,
        wh_id: submission.id,
        name: submission.name,
        description: submission.description,
        address: submission.address,
        city: submission.city,
        state: submission.state,
        pincode: submission.pincode,
        latitude: null,
        longitude: null,
        total_area: submission.total_area,
        price_per_sqft: submission.price_per_sqft,
        images: submission.image_urls || [],
        amenities: submission.amenities || [],
        features: submission.features || [],
        warehouse_type: submission.warehouse_type || null,
        allowed_goods_types: submission.allowed_goods_types || [],
        status: "active", // Approved submissions are active
        occupancy: 0, // New warehouses start with 0 occupancy
        rating: 4.5, // Default rating for new warehouses
        reviews_count: 0,
        total_blocks: Math.max(1, Math.floor(submission.total_area / 1000)),
        available_blocks: Math.max(1, Math.floor(submission.total_area / 1000)),
        grid_rows: Math.ceil(
          Math.sqrt(Math.max(1, Math.floor(submission.total_area / 1000))),
        ),
        grid_cols: Math.ceil(
          Math.sqrt(Math.max(1, Math.floor(submission.total_area / 1000))),
        ),
        owner_id: submission.owner_id,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        submission_id: submission.id,
        approved_at: submission.reviewed_at,
        approved_by: submission.reviewed_by,
      }));

      // Combine warehouses and approved submissions
      const allWarehouses = [...(warehouses || []), ...convertedSubmissions];
      const totalCount = (warehousesCount || 0) + convertedSubmissions.length;

      console.log(
        `✅ Found ${warehouses?.length || 0} original warehouses + ${convertedSubmissions.length} approved submissions = ${allWarehouses.length} total`,
      );

      // Sort combined results by rating and reviews for better results
      const sortedResults = allWarehouses.sort((a, b) => {
        // Sort by rating first, then by reviews count
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.reviews_count - a.reviews_count;
      });

      console.log(
        `✅ Returning ${sortedResults.length} warehouses from combined sources`,
      );
      return { data: sortedResults, count: totalCount };
    } catch (error) {
      console.error("Error in getWarehouses:", error);

      // Use mock data if enabled as fallback
      if (USE_MOCK_DATA_FALLBACK) {
        console.log("Falling back to mock warehouse data");
        return this.getMockWarehouses(filters);
      }

      // Return empty result if mock data is disabled
      return { data: [], count: 0 };
    }
  }

  // Get warehouse by ID (uses both id and wh_id for maximum compatibility)
  async getWarehouseById(
    id: string,
  ): Promise<{ data: SupabaseWarehouse | null; error: string | null }> {
    try {
      console.log(`🔍 Looking for warehouse with ID: ${id}`);

      // Check if ID is a UUID format (e.g., "550e8400-e29b-41d4-a716-446655440000")
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        );

      let query = supabase.from("warehouses").select("*");

      if (isUUID) {
        // If it's a UUID, search by id column only
        query = query.eq("id", id);
        console.log("🔑 Searching by UUID in id column");
      } else {
        // If it's not a UUID (e.g., "LIC007034"), search by wh_id column only
        query = query.eq("wh_id", id);
        console.log("🔑 Searching by wh_id column");
      }

      const { data: warehouses, error: warehouseError } = await query;

      if (warehouseError) {
        console.error("❌ Error querying warehouse:", warehouseError);
        return {
          data: null,
          error: warehouseError.message || "Error loading warehouse",
        };
      }

      // Check if we found exactly one warehouse
      if (warehouses && warehouses.length > 0) {
        const warehouse = warehouses[0]; // Take the first match
        console.log(
          "✅ Found warehouse in original warehouses table:",
          warehouse.name,
        );

        // Try to fetch owner profile separately if owner_id exists
        if (warehouse.owner_id) {
          try {
            const { data: ownerProfile, error: ownerError } = await supabase
              .from("profiles")
              .select("id, name, email, phone, created_at")
              .eq("id", warehouse.owner_id)
              .single();

            if (!ownerError && ownerProfile) {
              // Attach owner profile to warehouse data
              (warehouse as any).owner = ownerProfile;
            }
            // If profile not found, warehouse contact fields will be used as fallback
          } catch (ownerErr) {
            // Silently continue - profile lookup is optional, fallback to warehouse contact fields
          }
        }

        return { data: warehouse, error: null };
      }

      console.log("❌ Warehouse not found:", id);
      return { data: null, error: "Warehouse not found" };
    } catch (error) {
      console.error("Error in getWarehouseById:", error);

      // Use mock data if enabled as fallback
      if (USE_MOCK_DATA_FALLBACK) {
        console.log("Falling back to mock warehouse data for ID:", id);
        const mockWarehouse = mockData.warehouses?.find((w) => w.whId === id);
        if (mockWarehouse) {
          return {
            data: this.convertMockToSupabase(mockWarehouse),
            error: null,
          };
        }
        return { data: null, error: "Warehouse not found in mock data" };
      }

      return { data: null, error: "Failed to fetch warehouse details" };
    }
  }

  // Get warehouse statistics
  async getWarehouseStats() {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select(
          `
          city,
          total_area,
          price_per_sqft,
          status,
          occupancy,
          rating,
          amenities
        `,
        )
        .eq("status", "active"); // Only count active warehouses - matches main query filter

      if (error) {
        console.error("Error fetching warehouse stats from Supabase:", error);
        throw error;
      }

      // If no data in Supabase, return zeros (no mock fallback)
      if (!data || data.length === 0) {
        console.log("No active warehouses in Supabase database");
        return {
          totalWarehouses: 0,
          totalArea: 0,
          averagePrice: 0,
          averageOccupancy: 0,
          citiesCount: 0,
          averageRating: 0,
        };
      }

      const cities = new Set(data.map((w) => w.city));
      const totalArea = data.reduce((sum, w) => sum + (w.total_area || 0), 0);
      const avgPrice =
        data.reduce((sum, w) => sum + (w.price_per_sqft || 0), 0) / data.length;
      // Note: occupancy is stored as decimal (0.71) not percentage (71)
      const avgOccupancy =
        data.reduce((sum, w) => sum + (w.occupancy || 0), 0) / data.length;
      const avgRating =
        data.reduce((sum, w) => sum + (w.rating || 0), 0) / data.length;

      console.log(
        `📊 Warehouse Stats from Supabase: ${data.length} active warehouses, ${cities.size} cities`,
      );

      return {
        totalWarehouses: data.length,
        totalArea,
        averagePrice: Math.round(avgPrice),
        // If occupancy is stored as decimal (0.71), multiply by 100; if already percentage, use as-is
        averageOccupancy:
          avgOccupancy > 1
            ? Math.round(avgOccupancy)
            : Math.round(avgOccupancy * 100),
        citiesCount: cities.size,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    } catch (error) {
      console.error("Error in getWarehouseStats:", error);

      // Return default stats - no mock fallback
      return {
        totalWarehouses: 0,
        totalArea: 0,
        averagePrice: 0,
        averageOccupancy: 0,
        citiesCount: 0,
        averageRating: 0,
      };
    }
  }

  // ML-powered recommendations using advanced algorithms (XGBoost-inspired approach)
  async getMLRecommendations(
    request: MLRecommendationRequest,
  ): Promise<MLRecommendationResponse[]> {
    try {
      console.log(
        "🤖 Generating ML recommendations with preferences:",
        request.user_preferences,
      );

      // Get ALL warehouse data for better ML analysis (no pagination limit)
      // This ensures ML algorithms have complete dataset for training/analysis
      const { data: warehouses } = await this.getWarehouses({
        limit: 10000, // Get ALL warehouses for ML recommendations
        status: "active",
      });

      if (!warehouses || warehouses.length === 0) {
        console.warn("❌ No warehouses available for ML recommendations");
        return [];
      }

      console.log(
        `📊 ML processing ${warehouses.length} warehouses from Supabase`,
      );

      console.log(
        `Processing ${warehouses.length} warehouses for ML recommendations`,
      );

      const recommendations: MLRecommendationResponse[] = [];
      const preferences = request.user_preferences || {};

      // Generate feature vectors for warehouses based on city, price, amenities, size
      // This mimics how XGBoost would compute feature importance
      const enhancedWarehouses = warehouses.map((warehouse) => {
        let featureScores = {
          locationScore: 0,
          priceScore: 0,
          amenityScore: 0,
          sizeScore: 0,
          ratingScore: warehouse.rating / 5.0, // Normalize rating to 0-1
          availabilityScore: (100 - warehouse.occupancy) / 100, // Higher score for lower occupancy
        };

        // Compute location score based on preferred cities
        if (
          preferences.preferred_cities &&
          preferences.preferred_cities.length > 0
        ) {
          const cityMatch = preferences.preferred_cities.some(
            (city) => warehouse.city.toLowerCase() === city.toLowerCase(),
          );
          const cityPartialMatch = preferences.preferred_cities.some(
            (city) =>
              warehouse.city.toLowerCase().includes(city.toLowerCase()) ||
              (warehouse.address &&
                warehouse.address.toLowerCase().includes(city.toLowerCase())),
          );

          featureScores.locationScore = cityMatch
            ? 1.0
            : cityPartialMatch
              ? 0.7
              : 0.0;
        } else {
          // If no location preference, all locations get a neutral score
          featureScores.locationScore = 0.5;
        }

        // Compute price score based on budget
        if (preferences.max_budget) {
          if (warehouse.price_per_sqft <= preferences.max_budget) {
            // Lower price gets higher score, but extremely low prices may indicate issues
            const priceFraction =
              warehouse.price_per_sqft / preferences.max_budget;
            featureScores.priceScore =
              priceFraction < 0.5 ? 0.8 : 1 - priceFraction * 0.8; // Optimal around 50-70% of max budget
          } else {
            featureScores.priceScore = 0; // Over budget
          }
        } else {
          // If no price preference, give neutral score with preference to more affordable options
          featureScores.priceScore =
            Math.min(1.0, 1000 / warehouse.price_per_sqft) * 0.5;
        }

        // Compute amenity score based on preferences
        if (
          preferences.preferred_amenities &&
          preferences.preferred_amenities.length > 0 &&
          warehouse.amenities
        ) {
          const matchingAmenities = warehouse.amenities.filter((amenity) =>
            preferences.preferred_amenities?.some((pref) =>
              amenity.toLowerCase().includes(pref.toLowerCase()),
            ),
          );
          featureScores.amenityScore =
            matchingAmenities.length / preferences.preferred_amenities.length;
        } else {
          // If no amenity preferences or warehouse has no amenities data
          featureScores.amenityScore = warehouse.amenities?.length ? 0.5 : 0.3;
        }

        // Compute size score based on minimum area
        if (preferences.min_area) {
          if (warehouse.total_area >= preferences.min_area) {
            // Penalize warehouses that are too oversized (using a Gaussian-like function)
            const sizeRatio = warehouse.total_area / preferences.min_area;
            featureScores.sizeScore = Math.exp(
              -0.5 * Math.pow((sizeRatio - 1.3) / 1.0, 2),
            );
          } else {
            featureScores.sizeScore = 0; // Too small
          }
        } else {
          // If no size preference, give neutral score with preference to mid-sized warehouses
          featureScores.sizeScore = Math.exp(
            -0.5 * Math.pow((Math.log10(warehouse.total_area) - 4.5) / 1.0, 2),
          );
        }

        // Calculate total score using a weighted ensemble approach (XGBoost style)
        // The weights simulate what an XGBoost model might learn for feature importance
        const totalScore =
          featureScores.locationScore * 0.3 + // Location is very important
          featureScores.priceScore * 0.25 + // Price is quite important
          featureScores.sizeScore * 0.2 + // Size matters
          featureScores.amenityScore * 0.1 + // Amenities have some weight
          featureScores.ratingScore * 0.1 + // Ratings matter
          featureScores.availabilityScore * 0.05; // Availability is a factor

        return {
          warehouse,
          featureScores,
          totalScore,
        };
      });

      // Sort by total score (Random Forest / XGBoost predicted probability)
      enhancedWarehouses.sort((a, b) => b.totalScore - a.totalScore);

      // Generate recommendations by type using KNN-like approach for diverse recommendations

      // Location-based recommendations (closest city match)
      if (
        preferences.preferred_cities &&
        preferences.preferred_cities.length > 0
      ) {
        const locationMatches = enhancedWarehouses
          .filter((item) => item.featureScores.locationScore > 0.6)
          .slice(0, 5);

        locationMatches.forEach((item) => {
          recommendations.push({
            warehouse: item.warehouse,
            similarity_score: item.totalScore,
            recommendation_reasons: [
              `Located in your preferred city: ${item.warehouse.city}`,
              `${Math.round(100 - item.warehouse.occupancy)}% available space`,
              item.warehouse.rating >= 4.0
                ? `Highly rated: ${item.warehouse.rating}⭐`
                : "Good location match",
            ],
            recommendation_type: "location",
          });
        });
      }

      // Price-based recommendations (KNN approach to find most cost-effective options)
      if (preferences.max_budget) {
        const priceMatches = enhancedWarehouses
          .filter((item) => item.featureScores.priceScore > 0.7)
          .slice(0, 5);

        priceMatches.forEach((item) => {
          const savingsPercent = preferences.max_budget
            ? Math.round(
                ((preferences.max_budget - item.warehouse.price_per_sqft) /
                  preferences.max_budget) *
                  100,
              )
            : 0;

          recommendations.push({
            warehouse: item.warehouse,
            similarity_score: item.totalScore,
            recommendation_reasons: [
              `Optimal price: ₹${item.warehouse.price_per_sqft}/sqft`,
              savingsPercent > 0
                ? `Save ${savingsPercent}% compared to max budget`
                : "Good value for money",
              `${item.warehouse.total_area.toLocaleString()} sq ft total area`,
            ],
            recommendation_type: "price",
          });
        });
      }

      // Feature-based recommendations (using cosine similarity concept)
      if (
        preferences.preferred_amenities &&
        preferences.preferred_amenities.length > 0
      ) {
        const featureMatches = enhancedWarehouses
          .filter((item) => item.featureScores.amenityScore > 0.5)
          .slice(0, 5);

        featureMatches.forEach((item) => {
          const matchingFeatures =
            item.warehouse.amenities?.filter((amenity) =>
              preferences.preferred_amenities?.some((pref) =>
                amenity.toLowerCase().includes(pref.toLowerCase()),
              ),
            ) || [];

          recommendations.push({
            warehouse: item.warehouse,
            similarity_score: item.totalScore,
            recommendation_reasons: [
              `Has ${matchingFeatures.length} of your preferred amenities`,
              `Features: ${matchingFeatures.slice(0, 2).join(", ") + (matchingFeatures.length > 2 ? "..." : "")}`,
              "High feature compatibility",
            ],
            recommendation_type: "features",
          });
        });
      }

      // Size-optimized recommendations (using nearest neighbor concept)
      if (preferences.min_area) {
        const areaMatches = enhancedWarehouses
          .filter((item) => item.featureScores.sizeScore > 0.7)
          .slice(0, 5);

        areaMatches.forEach((item) => {
          const sizeRatio = preferences.min_area
            ? item.warehouse.total_area / preferences.min_area
            : 1;
          recommendations.push({
            warehouse: item.warehouse,
            similarity_score: item.totalScore,
            recommendation_reasons: [
              `Optimal size: ${item.warehouse.total_area.toLocaleString()} sq ft`,
              sizeRatio > 1.1
                ? `${Math.round((sizeRatio - 1) * 100)}% extra space compared to minimum`
                : "Perfect size match",
              `Good layout for efficient operations`,
            ],
            recommendation_type: "features",
          });
        });
      }

      // Add collaborative filtering recommendations (based on rating and similar users behavior)
      // This simulates what a real collaborative filtering algorithm would do
      const topRatedWarehouses = enhancedWarehouses
        .filter(
          (item) =>
            item.warehouse.rating >= 4.0 && item.warehouse.reviews_count >= 3,
        )
        .sort((a, b) => b.warehouse.rating - a.warehouse.rating)
        .slice(0, 6);

      topRatedWarehouses.forEach((item) => {
        recommendations.push({
          warehouse: item.warehouse,
          similarity_score: item.totalScore * 0.9, // Slightly lower weight for pure rating-based
          recommendation_reasons: [
            `Top rated: ${item.warehouse.rating}⭐ (${item.warehouse.reviews_count} reviews)`,
            "Businesses similar to yours chose this warehouse",
            "Excellent service quality",
          ],
          recommendation_type: "collaborative",
        });
      });

      // Remove duplicates and sort by ML score
      console.log(
        `Generated ${recommendations.length} raw recommendations, deduplicating...`,
      );
      const uniqueRecommendations = recommendations
        .filter(
          (rec, index, arr) =>
            arr.findIndex((r) => r.warehouse.id === rec.warehouse.id) === index,
        )
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, request.limit || 12);

      // Scale all scores to 0-1 range for consistency
      const maxScore = Math.max(
        ...uniqueRecommendations.map((r) => r.similarity_score),
      );
      uniqueRecommendations.forEach((rec) => {
        rec.similarity_score =
          maxScore > 0 ? rec.similarity_score / maxScore : rec.similarity_score;
      });

      console.log(
        `Returning ${uniqueRecommendations.length} final ML recommendations`,
      );
      return uniqueRecommendations;
    } catch (error) {
      console.error("Error generating ML recommendations:", error);

      // Fall back to mock recommendations if there was an error
      if (USE_MOCK_DATA_FALLBACK) {
        console.log(
          "Falling back to mock data for ML recommendations after error",
        );
        const mockRecommendations = await this.getMockRecommendations(
          request.limit || 12,
        );

        // Convert to ML recommendation format
        return mockRecommendations.map((warehouse) => ({
          warehouse,
          similarity_score: Math.random() * 0.3 + 0.7, // Random high score between 0.7-1.0
          recommendation_reasons: [
            `Top rated: ${warehouse.rating}⭐ (${warehouse.reviews_count} reviews)`,
            "Popular choice among similar businesses",
            "Excellent location and facilities",
          ],
          recommendation_type: Math.random() > 0.5 ? "collaborative" : "hybrid",
        }));
      }

      return [];
    }
  }

  // Get similar warehouses (collaborative filtering)
  async getSimilarWarehouses(
    warehouseId: string,
    limit = 6,
  ): Promise<SupabaseWarehouse[]> {
    const { data: currentWarehouse } = await this.getWarehouseById(warehouseId);
    if (!currentWarehouse) return [];

    const { data: warehouses } = await this.getWarehouses({ limit: 200 });

    // Find similar warehouses based on city, price range, and amenities
    const similarWarehouses = warehouses
      .filter((w) => w.id !== warehouseId)
      .map((w) => {
        let similarity = 0;

        // City similarity (40% weight)
        if (w.city === currentWarehouse.city) similarity += 0.4;

        // Price similarity (30% weight)
        const priceDiff = Math.abs(
          w.price_per_sqft - currentWarehouse.price_per_sqft,
        );
        const maxPrice = Math.max(
          w.price_per_sqft,
          currentWarehouse.price_per_sqft,
        );
        const priceScore = maxPrice > 0 ? 1 - priceDiff / maxPrice : 1;
        similarity += priceScore * 0.3;

        // Amenities similarity (20% weight)
        const commonAmenities = w.amenities.filter((a) =>
          currentWarehouse.amenities.includes(a),
        );
        const amenityScore =
          commonAmenities.length /
          Math.max(w.amenities.length, currentWarehouse.amenities.length, 1);
        similarity += amenityScore * 0.2;

        // Size similarity (10% weight)
        const sizeDiff = Math.abs(w.total_area - currentWarehouse.total_area);
        const maxSize = Math.max(w.total_area, currentWarehouse.total_area);
        const sizeScore = maxSize > 0 ? 1 - sizeDiff / maxSize : 1;
        similarity += sizeScore * 0.1;

        return { ...w, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Fetch and attach owner profiles for similar warehouses
    const uniqueOwnerIds = [
      ...new Set(similarWarehouses.map((w) => w.owner_id).filter(Boolean)),
    ];

    if (uniqueOwnerIds.length > 0) {
      try {
        const { data: ownerProfiles } = await supabase
          .from("profiles")
          .select("id, name, email, phone, created_at")
          .in("id", uniqueOwnerIds);

        if (ownerProfiles) {
          // Create a map for quick lookup
          const ownerMap = new Map(
            ownerProfiles.map((owner) => [owner.id, owner]),
          );

          // Attach owner profiles to warehouses
          similarWarehouses.forEach((warehouse) => {
            if (warehouse.owner_id && ownerMap.has(warehouse.owner_id)) {
              (warehouse as any).owner = ownerMap.get(warehouse.owner_id);
            }
          });
        }
      } catch (err) {
        // Silently continue - profile lookup is optional
      }
    }

    return similarWarehouses;
  }

  // Get warehouses by city
  async getWarehousesByCity(
    city: string,
    limit = 20,
  ): Promise<SupabaseWarehouse[]> {
    const { data } = await this.getWarehouses({ city, limit });
    return data;
  }

  // Search warehouses
  async searchWarehouses(
    query: string,
    limit = 20,
  ): Promise<SupabaseWarehouse[]> {
    const { data } = await this.getWarehouses({ search: query, limit });
    return data;
  }

  /**
   * Get warehouses owned by a specific user
   * Combines both warehouses from the main table and user submissions (pending/approved/rejected)
   */
  async getWarehousesByOwner(
    ownerId: string,
  ): Promise<{
    data: SupabaseWarehouse[];
    count: number;
    submissions?: any[];
    error?: string;
  }> {
    try {
      console.log("🔍 Fetching warehouses for owner:", ownerId);

      // Fetch warehouses from main warehouses table
      const { data: ownedWarehouses, error: warehousesError } = await supabase
        .from("warehouses")
        .select("*")
        .eq("owner_id", ownerId);

      if (warehousesError) {
        console.error("❌ Error fetching owned warehouses:", warehousesError);
      }

      // Fetch owner's submissions via server API (bypasses RLS)
      let submissions: any[] = [];
      try {
        const response = await fetch(
          `/api/warehouse-submissions/owner/${ownerId}`,
        );
        const data = await response.json();
        if (data.success && data.submissions) {
          submissions = data.submissions;
          console.log(`✅ Loaded ${submissions.length} submissions for owner`);
        }
      } catch (subErr) {
        console.warn("⚠️ Could not load owner submissions:", subErr);
      }

      // Convert submissions to SupabaseWarehouse format for display
      const submissionWarehouses: SupabaseWarehouse[] = submissions
        .filter((s: any) => s.status !== "approved") // Don't duplicate approved ones already in warehouses table
        .map(
          (s: any) =>
            ({
              id: s.id,
              wh_id: `SUB-${String(s.id).substring(0, 8).toUpperCase()}`,
              name: s.name || "Untitled Warehouse",
              description: s.description || "",
              address: s.address || "",
              city: s.city || "",
              state: s.state || "",
              pincode: s.pincode || "",
              total_area: s.total_area || 0,
              price_per_sqft: s.price_per_sqft || 0,
              images: s.image_urls || [],
              amenities: s.amenities || [],
              features: s.features || [],
              warehouse_type: s.warehouse_type || "General Storage",
              allowed_goods_types: s.allowed_goods_types || [],
              status: s.status === "pending" ? "pending_approval" : s.status,
              occupancy: 0,
              rating: 0,
              reviews_count: 0,
              total_blocks: 0,
              available_blocks: 0,
              grid_rows: 0,
              grid_cols: 0,
              created_at: s.submitted_at || s.created_at,
              updated_at: s.updated_at,
            }) as any,
        );

      // Fetch owner profile separately
      const allWarehouses = [
        ...(ownedWarehouses || []),
        ...submissionWarehouses,
      ];
      if (ownerId && allWarehouses.length > 0) {
        try {
          const { data: ownerProfile, error: ownerError } = await supabase
            .from("profiles")
            .select("id, name, email, phone, created_at")
            .eq("id", ownerId)
            .maybeSingle();

          if (!ownerError && ownerProfile) {
            allWarehouses.forEach((warehouse) => {
              (warehouse as any).owner = ownerProfile;
            });
            console.log(
              "✅ Loaded owner profile for warehouses:",
              ownerProfile.name,
            );
          } else if (ownerError) {
            console.warn(
              "⚠️ Profile query error (non-blocking):",
              ownerError.message,
            );
          }
        } catch (ownerErr) {
          console.warn("⚠️ Could not load owner profile:", ownerErr);
        }
      }

      console.log(
        `✅ Returning ${allWarehouses.length} warehouses for owner (${ownedWarehouses?.length || 0} approved + ${submissionWarehouses.length} submissions)`,
      );

      return {
        data: allWarehouses,
        count: allWarehouses.length,
        submissions,
      };
    } catch (error) {
      console.error("❌ Error in getWarehousesByOwner:", error);
      return { data: [], count: 0, error: String(error) };
    }
  }

  /**
   * Get count of warehouses owned by a specific owner
   */
  async getOwnerPropertyCount(ownerId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("warehouses")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", ownerId);

      if (error) {
        console.error("Error getting owner property count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getOwnerPropertyCount:", error);
      return 0;
    }
  }

  /**
   * LLM-powered recommendations based on user preferences
   */
  async getLLMRecommendations(
    preferences: RecommendationPreferences,
    limit: number = 12,
  ): Promise<RecommendationResponse> {
    try {
      const filters: WarehouseFilters = {
        city: preferences.district,
        max_price: preferences.targetPrice,
        min_area: preferences.minAreaSqft,
        status: "active",
        limit: 500,
      };

      const { data: warehouses } = await this.getWarehouses(filters);
      const warehouseList = warehouses || [];

      if (warehouseList.length === 0) {
        return { items: [] };
      }

      const scored = warehouseList.map((w) => {
        let score = 60;
        if (preferences.targetPrice) {
          const priceRatio = w.price_per_sqft / preferences.targetPrice;
          if (priceRatio <= 1)
            score += Math.max(0, 20 - Math.round(priceRatio * 10));
        }
        if (preferences.minAreaSqft && w.total_area >= preferences.minAreaSqft)
          score += 10;
        if (
          preferences.preferredType &&
          w.warehouse_type
            ?.toLowerCase()
            .includes(preferences.preferredType.toLowerCase())
        )
          score += 10;
        if (preferences.preferVerified && w.verified) score += 5;
        if (preferences.preferAvailability && w.occupancy < 0.7) score += 5;
        score += Math.round((w.rating || 4) * 2);
        return { warehouse: w, score };
      });

      const candidates = scored.sort((a, b) => b.score - a.score).slice(0, 40);

      const prompt = `You are an expert warehouse recommender. Pick the top ${Math.min(limit, 12)} matches based on preferences.

Preferences:
- District: ${preferences.district || "Any"}
- Target Price: ${preferences.targetPrice ? `₹${preferences.targetPrice}/sq ft` : "Any"}
- Minimum Area: ${preferences.minAreaSqft ? `${preferences.minAreaSqft} sq ft` : "Any"}
- Preferred Type: ${preferences.preferredType || "Any"}
- Prefer Verified: ${preferences.preferVerified ? "Yes" : "No"}
- Prefer Availability: ${preferences.preferAvailability ? "Yes" : "No"}

Candidates (JSON):
${JSON.stringify(
  candidates.map((c) => ({
    id: c.warehouse.id,
    name: c.warehouse.name,
    city: c.warehouse.city,
    district: c.warehouse.district,
    price_per_sqft: c.warehouse.price_per_sqft,
    total_area: c.warehouse.total_area,
    warehouse_type: c.warehouse.warehouse_type,
    rating: c.warehouse.rating,
    occupancy: c.warehouse.occupancy,
  })),
  null,
  2,
)}

Return JSON only in this format:
{
  "recommendations": [
    { "id": "warehouse-id", "matchScore": 0-100, "reason": "short reason" }
  ]
}`;

      let ranked: Array<{
        id: string;
        matchScore: number;
        reason: string;
      }> | null = null;

      try {
        const response = await getAIResponse({
          prompt,
          systemPrompt: "You rank warehouses and return JSON only.",
          temperature: 0.2,
          maxTokens: 800,
        });

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed?.recommendations)) {
            ranked = parsed.recommendations;
          }
        }
      } catch (error) {
        console.warn(
          "⚠️ LLM ranking failed, falling back to heuristic:",
          error,
        );
      }

      const byId = new Map(warehouseList.map((w) => [w.id, w]));
      const results =
        ranked && ranked.length > 0
          ? ranked
          : candidates
              .slice(0, limit)
              .map((c) => ({
                id: c.warehouse.id,
                matchScore: Math.min(98, c.score),
                reason: "Strong overall match",
              }));

      const items: RecommendedWarehouse[] = results
        .map((r, index) => {
          const w = byId.get(r.id);
          if (!w) return null;
          const occupancyRate =
            (w.occupancy || 0) > 1
              ? (w.occupancy || 0) / 100
              : w.occupancy || 0;
          return {
            whId: w.id,
            name: w.name || `Warehouse ${index + 1}`,
            location: `${w.city || w.district || ""}, ${w.state || "Maharashtra"}`,
            district: w.district || w.city || "",
            state: w.state || "Maharashtra",
            pricePerSqFt: w.price_per_sqft || 30,
            totalAreaSqft: w.total_area || 10000,
            availableAreaSqft: Math.floor(
              (w.total_area || 10000) * (1 - occupancyRate),
            ),
            rating: w.rating || 4.0,
            reviews: w.reviews_count || 10,
            image:
              w.images && w.images.length > 0
                ? w.images[0]
                : "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
            type: w.warehouse_type || "General Storage",
            matchScore: Math.round(r.matchScore || 80),
            reasons: [{ label: r.reason || "Good match for your preferences" }],
          };
        })
        .filter(Boolean) as RecommendedWarehouse[];

      return { items };
    } catch (error) {
      console.error("Error generating LLM recommendations:", error);
      return { items: [], error: String(error) };
    }
  }

  // Get recommendations using mock data if needed
  async getMockRecommendations(limit = 6): Promise<SupabaseWarehouse[]> {
    if (!mockData.warehouses || mockData.warehouses.length === 0) {
      return [];
    }

    // Get high-rated warehouses
    const topRatedWarehouses = [...mockData.warehouses]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map((w) => this.convertMockToSupabase(w));

    return topRatedWarehouses;
  }
}

export const warehouseService = new WarehouseService();
