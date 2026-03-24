/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Recommendation API types
 */
export interface RecommendationPreferences {
  // Desired district (exact match preferred). If empty, no district filter.
  district?: string;
  // Budget per sqft/month in INR. If provided, closer pricing scores higher.
  targetPrice?: number;
  // Minimum required area in sqft. Larger warehouses score higher up to 2x this value.
  minAreaSqft?: number;
  // Preferred warehouse type (exact string from dataset) if any.
  preferredType?: string;
  // Preference for verified ownership certificate.
  preferVerified?: boolean;
  // Preference for availability: lower occupancy preferred (true) or ignore (false/undefined)
  preferAvailability?: boolean;
}

export interface RecommendationRequest {
  preferences: RecommendationPreferences;
  // Limit number of recommendations
  limit?: number;
}

export interface RecommendationReason {
  label: string;
}

export interface RecommendedWarehouse {
  whId: string;
  name: string; // generated label
  location: string; // e.g., "District, State"
  district: string;
  state: string;
  pricePerSqFt: number;
  totalAreaSqft: number;
  availableAreaSqft: number;
  rating: number;
  reviews: number;
  image: string;
  type: string;
  matchScore: number; // 0-100
  reasons: RecommendationReason[];
  // Additional AI insights from Gemini (optional)
  aiInsights?: string[];
}

export interface RecommendationResponse {
  items: RecommendedWarehouse[];
  error?: string; // Optional error message if something went wrong
}

/**
 * Saved Warehouses API Types
 */
export interface SavedWarehouseRequest {
  seekerId: string;
  warehouseId: string;
}

export interface SavedWarehouseResponse {
  success: boolean;
  saved: boolean;
  message: string;
}

export interface SavedWarehouse {
  id: string;
  seeker_id: string;
  warehouse_id: string;
  created_at: string;
  warehouse?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    district: string;
    type: string;
    price_per_sqft: number;
    total_area_sqft: number;
    available_area_sqft: number;
    occupancy_percentage: number;
    rating: number;
    reviews: number;
  };
}

export interface SavedWarehousesResponse {
  success: boolean;
  warehouses: SavedWarehouse[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface SavedStatusResponse {
  success: boolean;
  saved: boolean;
}

/**
 * Activity & Inquiry API Types
 */
export interface ActivityLog {
  id: string;
  seeker_id: string;
  type: 'booking' | 'inquiry' | 'payment' | 'cancellation';
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityLogRequest {
  seekerId: string;
  type: 'booking' | 'inquiry' | 'payment' | 'cancellation';
  description: string;
  metadata?: Record<string, any>;
}

export interface ActivityTimelineResponse {
  success: boolean;
  activities: ActivityLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface Inquiry {
  id: string;
  seeker_id: string;
  owner_id: string;
  warehouse_id: string;
  message: string;
  status: 'open' | 'responded' | 'closed';
  created_at: string;
  warehouses?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
}

export interface InquiryRequest {
  seekerId: string;
  ownerId: string;
  warehouseId: string;
  message: string;
}

export interface InquiryResponse {
  success: boolean;
  inquiry: Inquiry;
  message: string;
}

export interface SeekerInquiriesResponse {
  success: boolean;
  inquiries: Inquiry[];
}

export interface ActivityStats {
  activities: {
    total: number;
    bookings: number;
    inquiries: number;
    payments: number;
    cancellations: number;
  };
  inquiries: {
    total: number;
    open: number;
    responded: number;
    closed: number;
  };
  savedWarehouses: number;
}

export interface ActivityStatsResponse {
  success: boolean;
  stats: ActivityStats;
}

/**
 * Booking API Types
 */
export interface Booking {
  id: string;
  seeker_id: string;
  warehouse_id: string;
  blocks_booked: number;
  total_area: number;
  price: number;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  blockchain_tx: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  warehouses?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    images: string[];
    area_sqft: number;
    price_per_sqft: number;
  };
}

export interface BookingsResponse {
  success: boolean;
  bookings: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  message?: string;
}

export interface BookingCancelRequest {
  booking_id: string;
  seeker_id: string;
}

export interface BookingCancelResponse {
  success: boolean;
  message: string;
  booking?: Booking;
}

export interface InvoiceResponse {
  success: boolean;
  message: string;
  download_url?: string;
  booking_id: string;
}
