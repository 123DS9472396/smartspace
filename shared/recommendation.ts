import type { RecommendationPreferences, RecommendedWarehouse } from "./api";
import { maharashtraWarehouses, type WarehouseData } from "../client/data/warehouses";
// Import supabase directly to avoid potential circular dependencies
import { createClient } from '@supabase/supabase-js';
import { knnRecommend, randomForestRecommend, hybridRecommend, mapToRecommendedWarehouse } from "./ml-algorithms";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Direct client creation for server-side usage with Node.js global fetch
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: fetch.bind(globalThis), // Use Node.js 18+ native fetch
  },
});

// Normalize helper 0..1
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function scoreWarehouse(w: WarehouseData, prefs: RecommendationPreferences): { score: number; reasons: string[]; rec: RecommendedWarehouse } {
  const reasons: string[] = [];

  // District score - prioritize exact matches
  let districtScore = 0;
  if (prefs.district) {
    const exact = w.district.toLowerCase() === prefs.district.toLowerCase();
    const cityExact = w.district.toLowerCase().includes(prefs.district.toLowerCase());
    const addressMatch = w.address.toLowerCase().includes(prefs.district.toLowerCase());
    
    districtScore = exact ? 1 : cityExact ? 0.9 : addressMatch ? 0.6 : 0;
    if (districtScore > 0) {
      reasons.push(exact ? `Exactly located in ${w.district}` : 
                   cityExact ? `Located in ${w.district} area` : 
                   `Near ${prefs.district}`);
    }
  } else {
    districtScore = 0.5; // neutral when not specified
  }

  // Price score - more precise matching
  let priceScore = 0.5;
  if (typeof prefs.targetPrice === "number" && prefs.targetPrice > 0) {
    const diff = Math.abs(w.pricing - prefs.targetPrice);
    const tolerance = prefs.targetPrice * 0.2; // Tighter tolerance (20% instead of 30%)
    priceScore = clamp01(1 - diff / tolerance);
    
    if (Math.abs(w.pricing - prefs.targetPrice) <= 5) {
      reasons.push(`Perfect price match (₹${w.pricing}/sqft)`);
      priceScore = 1;
    } else if (priceScore >= 0.8) {
      reasons.push(`Excellent price match (₹${w.pricing}/sqft)`);
    } else if (priceScore >= 0.6) {
      reasons.push(`Good price match (₹${w.pricing}/sqft)`);
    } else if (w.pricing < prefs.targetPrice) {
      reasons.push(`Under budget (₹${w.pricing}/sqft)`);
    }
  }

  // Area score - exact requirement matching
  const totalArea = w.size;
  let areaScore = 0.5;
  if (typeof prefs.minAreaSqft === "number" && prefs.minAreaSqft > 0) {
    if (totalArea >= prefs.minAreaSqft) {
      const ratio = totalArea / prefs.minAreaSqft;
      // Perfect score for 1x to 1.5x the required area
      if (ratio <= 1.5) {
        areaScore = 1;
        reasons.push(`Perfect size match (${totalArea.toLocaleString()} sqft)`);
      } else if (ratio <= 2) {
        areaScore = 0.8;
        reasons.push(`Good size with extra space (${totalArea.toLocaleString()} sqft)`);
      } else {
        areaScore = 0.6;
        reasons.push(`Large space available (${totalArea.toLocaleString()} sqft)`);
      }
    } else {
      areaScore = 0; // Doesn't meet minimum requirement
    }
  }

  // Type preference
  let typeScore = 0.5;
  if (prefs.preferredType) {
    typeScore = w.warehouseType === prefs.preferredType ? 1 : 0;
    if (typeScore === 1) reasons.push(`Preferred type: ${w.warehouseType}`);
  }

  // Availability score (lower occupancy preferred)
  const availability = 1 - w.occupancy;
  let availabilityScore = prefs.preferAvailability ? availability : 0.5;
  if (prefs.preferAvailability && availability >= 0.5) reasons.push(`Excellent availability (${Math.round(availability * 100)}%)`);
  else if (prefs.preferAvailability && availability >= 0.3) reasons.push(`Good availability (${Math.round(availability * 100)}%)`);

  // Verified bonus
  const verifiedBonus = prefs.preferVerified ? (w.ownershipCertificate === "Verified" ? 0.1 : 0) : 0;
  if (verifiedBonus > 0) reasons.push("Verified facility");

  // Quality proxy from rating
  const ratingScore = clamp01((w.rating - 3) / 2);

  // Weighted sum with higher weight for exact matches
  const score = clamp01(
    0.35 * districtScore +  // Increased weight for location
    0.25 * priceScore +     // Increased weight for price
    0.20 * areaScore +      // Keep area weight
    0.10 * typeScore +      // Reduced type weight
    0.05 * availabilityScore +  // Reduced availability weight
    0.05 * ratingScore +    // Keep rating weight
    verifiedBonus
  );

  const availableArea = Math.max(0, Math.round(w.size * (1 - w.occupancy)));

  const rec: RecommendedWarehouse = {
    whId: w.whId,
    name: `${w.warehouseType} • ${w.district}`,
    location: `${w.district}, ${w.state}`,
    district: w.district,
    state: w.state,
    pricePerSqFt: w.pricing,
    totalAreaSqft: w.size,
    availableAreaSqft: availableArea,
    rating: w.rating,
    reviews: w.reviews,
    image: w.image,
    type: w.warehouseType,
    matchScore: Math.round(score * 100),
    reasons: reasons.map((r) => ({ label: r })),
  };

  return { score, reasons, rec };
}

// Map Supabase warehouse to app's warehouse model
function mapSupabaseWarehouse(warehouse: any): WarehouseData {
  return {
    whId: warehouse.id,
    address: warehouse.address || '',
    district: warehouse.city || '',
    state: warehouse.state || 'Maharashtra',
    capacity: Math.round(warehouse.total_area / 10), // Approximate capacity based on area
    registrationDate: warehouse.created_at,
    registrationValidUpto: new Date(new Date(warehouse.created_at).setFullYear(new Date(warehouse.created_at).getFullYear() + 3)).toISOString(),
    contactNo: '+91-' + Math.floor(Math.random() * 9000000000 + 1000000000),
    status: warehouse.status === 'approved' ? 'Active' : warehouse.status === 'inactive' ? 'Inactive' : 'Cancelled',
    remarks: '',
    occupancy: warehouse.occupancy || 0,
    microRentalSpaces: Math.floor(Math.random() * 20) + 5,
    emailId: `info@${warehouse.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'warehouse'}.com`,
    pricing: warehouse.price_per_sqft,
    warehouseType: warehouse.description?.split(' ')[0] || 'General Storage',
    ownershipCertificate: Math.random() > 0.3 ? 'Verified' : 'Unverified',
    pincode: warehouse.pincode || '',
    licenceNumber: `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    size: warehouse.total_area,
    image: (warehouse.images && warehouse.images.length > 0) 
      ? warehouse.images[0] 
      : `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80`,
    amenities: warehouse.amenities || ['Storage', 'Security', 'Parking'],
    description: warehouse.description || '',
    rating: warehouse.rating || 4.5,
    reviews: warehouse.reviews_count || Math.floor(Math.random() * 50) + 5,
  };
}

export async function recommendWarehousesFromSupabase(prefs: RecommendationPreferences, limit = 12): Promise<RecommendedWarehouse[]> {
  try {
    // Fetch warehouses from Supabase with more targeted filtering
    let query = supabase.from('warehouses').select('*');
    
    // Apply strict filters for better results
    if (prefs.district) {
      // Exact city match for district preference
      query = query.eq('city', prefs.district);
    }
    
    if (prefs.targetPrice) {
      // Get warehouses within ± 25% of target price for more precise matching
      const minPrice = prefs.targetPrice * 0.75;
      const maxPrice = prefs.targetPrice * 1.25;
      query = query.gte('price_per_sqft', minPrice).lte('price_per_sqft', maxPrice);
    }
    
    if (prefs.minAreaSqft) {
      // Get warehouses that meet minimum area requirement exactly
      query = query.gte('total_area', prefs.minAreaSqft);
    }
    
    // Only get approved/active warehouses
    query = query.eq('status', 'approved');
    
    // Limit to reasonable number for processing
    query = query.limit(500);
    
    const { data: warehousesData, error } = await query;
    
    if (error) {
      console.error('Error fetching warehouses from Supabase:', error);
      throw error;
    }
    
    if (!warehousesData || warehousesData.length === 0) {
      console.log('No warehouses found matching criteria, falling back to static data');
      return recommendWarehousesFromStatic(prefs, limit);
    }
    
    console.log(`Found ${warehousesData.length} warehouses matching criteria`);
    
    // Map Supabase data to app's warehouse model for scoring
    const warehouses = warehousesData.map(mapSupabaseWarehouse);
    
    // Score and sort warehouses using traditional scoring (more reliable than ML for now)
    const scored = warehouses.map((w) => scoreWarehouse(w, prefs));
    
    // Sort by score first, then by price for ties
    scored.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) {
        // If scores are very close, prefer lower price
        return a.rec.pricePerSqFt - b.rec.pricePerSqFt;
      }
      return b.score - a.score;
    });
    
    console.log(`Returning top ${Math.min(limit, scored.length)} scored recommendations`);
    return scored.slice(0, limit).map((s) => s.rec);
  } catch (error) {
    console.error('Error in recommendWarehousesFromSupabase:', error);
    return recommendWarehousesFromStatic(prefs, limit);
  }
}

// Fallback function using static data
export function recommendWarehousesFromStatic(prefs: RecommendationPreferences, limit = 12): RecommendedWarehouse[] {
  const scored = maharashtraWarehouses.map((w) => scoreWarehouse(w, prefs));
  // Sort by score desc then by price asc as tie breaker
  scored.sort((a, b) => b.score - a.score || a.rec.pricePerSqFt - b.rec.pricePerSqFt);
  return scored.slice(0, limit).map((s) => s.rec);
}

// Main recommendation function - uses Supabase if available, falls back to static data
export async function recommendWarehouses(prefs: RecommendationPreferences, limit = 12): Promise<RecommendedWarehouse[]> {
  try {
    return await recommendWarehousesFromSupabase(prefs, limit);
  } catch (error) {
    console.error('Error in recommendation system, falling back to static data:', error);
    return recommendWarehousesFromStatic(prefs, limit);
  }
}
