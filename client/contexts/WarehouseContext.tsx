import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Tables } from '../lib/supabase';
import { useAuth } from './AuthContext';

// More flexible warehouse interface to handle both Supabase and static data
interface Warehouse {
  id: string;
  name?: string;
  city?: string;
  state?: string;
  district?: string;
  warehouse_name?: string;
  warehouse_type?: string;
  warehouse_address?: string;
  warehouse_licence_number?: string;
  total_size_sqft?: number;
  pricing_inr_sqft_month?: number;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  is_verified?: boolean;
  capacity_mt?: number;
  registration_date?: string;
  registration_valid_upto?: string;
  
  // Add computed fields
  available_area?: number;
  occupancy_rate?: number;
  monthly_revenue?: number;
  
  // Allow other properties
  [key: string]: any;
}

interface WarehouseContextType {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  fetchWarehouses: () => Promise<void>;
  fetchWarehouseById: (id: string) => Promise<Warehouse | null>;
  fetchOwnerWarehouses: (ownerId: string) => Promise<Warehouse[]>;
  createWarehouse: (warehouse: Omit<Tables<'warehouses'>, 'id' | 'created_at' | 'updated_at'>) => Promise<{ data: Warehouse | null; error: Error | null }>;
  updateWarehouse: (id: string, updates: Partial<Tables<'warehouses'>>) => Promise<{ error: Error | null }>;
  deleteWarehouse: (id: string) => Promise<{ error: Error | null }>;
  searchWarehouses: (query: SearchQuery) => Promise<Warehouse[]>;
}

interface SearchFilters {
  location: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  warehouseType: string[];
  city: string[];
  isVerified: boolean;
  isActive: boolean;
}

interface SearchQuery {
  location?: string;
  city?: string;
  district?: string;
  state?: string;
  warehouseType?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  sortBy?: 'price' | 'area' | 'rating' | 'distance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

const defaultFilters: SearchFilters = {
  location: '',
  minPrice: 0,
  maxPrice: 200,
  minArea: 0,
  maxArea: 200000,
  warehouseType: [],
  city: [],
  isVerified: true,
  isActive: true,
};

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};

interface WarehouseProviderProps {
  children: React.ReactNode;
}

export const WarehouseProvider = ({ children }: WarehouseProviderProps) => {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(defaultFilters);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always use analytics endpoint for real-time values
      const res = await fetch('/api/analytics/warehouses');
      if (!res.ok) throw new Error('Failed to fetch analytics data');
      const json = await res.json();
      if (!json.success || !Array.isArray(json.analytics)) {
        setWarehouses([]);
        return;
      }
      setWarehouses(json.analytics);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch warehouses');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseById = async (id: string): Promise<Warehouse | null> => {
    try {
      // Always use analytics endpoint for real-time values
      const res = await fetch(`/api/analytics/warehouse/${id}`);
      if (!res.ok) throw new Error('Failed to fetch warehouse analytics');
      const json = await res.json();
      if (!json.success || !json.analytics) return null;
      return json.analytics;
    } catch (err) {
      console.error('Error fetching warehouse:', err);
      return null;
    }
  };

  const fetchOwnerWarehouses = async (ownerId: string): Promise<Warehouse[]> => {
    try {
      // Always use analytics endpoint for real-time values
      const res = await fetch(`/api/analytics/owner/${ownerId}`);
      if (!res.ok) throw new Error('Failed to fetch owner analytics');
      const json = await res.json();
      if (!json.success || !Array.isArray(json.analytics)) return [];
      return json.analytics;
    } catch (err) {
      console.error('Error fetching owner warehouses:', err);
      return [];
    }
  };

  const createWarehouse = async (warehouseData: Omit<Tables<'warehouses'>, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (!user) {
        throw new Error('User must be logged in to create warehouse');
      }

      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          ...warehouseData,
          owner_id: user.id,
          is_verified: false, // Admin needs to verify
          is_active: false, // Inactive until verified
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh warehouses list
      await fetchWarehouses();

      return { data, error: null };
    } catch (err) {
      console.error('Error creating warehouse:', err);
      return { data: null, error: err as Error };
    }
  };

  const updateWarehouse = async (id: string, updates: Partial<Tables<'warehouses'>>) => {
    try {
      const { error } = await supabase
        .from('warehouses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Refresh warehouses list
      await fetchWarehouses();

      return { error: null };
    } catch (err) {
      console.error('Error updating warehouse:', err);
      return { error: err as Error };
    }
  };

  const deleteWarehouse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Refresh warehouses list
      await fetchWarehouses();

      return { error: null };
    } catch (err) {
      console.error('Error deleting warehouse:', err);
      return { error: err as Error };
    }
  };

  const searchWarehouses = async (query: SearchQuery): Promise<Warehouse[]> => {
    try {
      // Always use analytics endpoint for real-time values
      const params = new URLSearchParams();
      if (query.city) params.append('city', query.city);
      if (query.location) params.append('location', query.location);
      if (query.warehouseType) params.append('warehouseType', query.warehouseType);
      if (query.minPrice !== undefined) params.append('minPrice', String(query.minPrice));
      if (query.maxPrice !== undefined) params.append('maxPrice', String(query.maxPrice));
      if (query.minArea !== undefined) params.append('minArea', String(query.minArea));
      if (query.maxArea !== undefined) params.append('maxArea', String(query.maxArea));
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);
      if (query.limit) params.append('limit', String(query.limit));
      if (query.offset) params.append('offset', String(query.offset));
      
      const res = await fetch(`/api/analytics/warehouses/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to search analytics');
      const json = await res.json();
      if (!json.success || !Array.isArray(json.analytics)) return [];
      return json.analytics;
    } catch (err) {
      console.error('Error searching warehouses:', err);
      return [];
    }
  };

  const value: WarehouseContextType = {
    warehouses,
    loading,
    error,
    searchFilters,
    setSearchFilters,
    fetchWarehouses,
    fetchWarehouseById,
    fetchOwnerWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    searchWarehouses,
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
};