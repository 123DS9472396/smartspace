import { createContext, useContext, useState, useEffect } from 'react';
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

      // Using improved query based on actual Supabase schema
      const { data, error: fetchError } = await supabase
        .from('warehouses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      // Check if we got warehouses
      if (!data || data.length === 0) {
        console.log('No warehouses found in Supabase');
        setWarehouses([]);
        return;
      }

      // Map database columns to UI format
      const enhancedWarehouses = data.map((wh: any) => ({
        ...wh,
        warehouse_name: wh.name,
        warehouse_address: wh.address,
        warehouse_licence_number: wh.wh_id,
        total_size_sqft: wh.total_area,
        capacity_mt: wh.capacity,
        pricing_inr_sqft_month: wh.price_per_sqft,
        contact_number: wh.owner_phone,
        is_active: wh.status === 'active',
        is_verified: wh.ownership_certificate === 'Verified',
        available_area: Math.floor((wh.total_area || 10000) * (1 - (wh.occupancy || 0.5))),
        occupancy_rate: Math.floor((wh.occupancy || 0.5) * 100),
        monthly_revenue: Math.floor((wh.total_area || 10000) * (wh.price_per_sqft || 50) * (wh.occupancy || 0.7)),
      }));

      setWarehouses(enhancedWarehouses);
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
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        warehouse_name: data.name,
        warehouse_address: data.address,
        warehouse_licence_number: data.wh_id,
        total_size_sqft: data.total_area,
        capacity_mt: data.capacity,
        pricing_inr_sqft_month: data.price_per_sqft,
        contact_number: data.owner_phone,
        is_active: data.status === 'active',
        is_verified: data.ownership_certificate === 'Verified',
        available_area: Math.floor((data.total_area || 10000) * (1 - (data.occupancy || 0.5))),
        occupancy_rate: Math.floor((data.occupancy || 0.5) * 100),
        monthly_revenue: Math.floor((data.total_area || 10000) * (data.price_per_sqft || 50) * (data.occupancy || 0.7)),
      };
    } catch (err) {
      console.error('Error fetching warehouse:', err);
      return null;
    }
  };

  const fetchOwnerWarehouses = async (ownerId: string): Promise<Warehouse[]> => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(warehouse => ({
        ...warehouse,
        available_area: Math.floor(warehouse.total_size_sqft * 0.3),
        occupancy_rate: Math.floor(Math.random() * 40 + 60),
        monthly_revenue: Math.floor(warehouse.total_size_sqft * warehouse.pricing_inr_sqft_month * 0.7),
      }));
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
      let supabaseQuery = supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (query.city) {
        supabaseQuery = supabaseQuery.ilike('city', `%${query.city}%`);
      }

      if (query.location) {
        supabaseQuery = supabaseQuery.or(`warehouse_address.ilike.%${query.location}%,city.ilike.%${query.location}%,district.ilike.%${query.location}%`);
      }

      if (query.warehouseType) {
        supabaseQuery = supabaseQuery.ilike('warehouse_type', `%${query.warehouseType}%`);
      }

      if (query.minPrice !== undefined) {
        supabaseQuery = supabaseQuery.gte('pricing_inr_sqft_month', query.minPrice);
      }

      if (query.maxPrice !== undefined) {
        supabaseQuery = supabaseQuery.lte('pricing_inr_sqft_month', query.maxPrice);
      }

      if (query.minArea !== undefined) {
        supabaseQuery = supabaseQuery.gte('total_size_sqft', query.minArea);
      }

      if (query.maxArea !== undefined) {
        supabaseQuery = supabaseQuery.lte('total_size_sqft', query.maxArea);
      }

      // Apply sorting
      if (query.sortBy) {
        const column = query.sortBy === 'price' ? 'pricing_inr_sqft_month' 
                    : query.sortBy === 'area' ? 'total_size_sqft'
                    : 'created_at';
        supabaseQuery = supabaseQuery.order(column, { 
          ascending: query.sortOrder === 'asc' 
        });
      } else {
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        throw error;
      }

      return data.map(warehouse => ({
        ...warehouse,
        available_area: Math.floor(warehouse.total_size_sqft * 0.3),
        occupancy_rate: Math.floor(Math.random() * 40 + 60),
        monthly_revenue: Math.floor(warehouse.total_size_sqft * warehouse.pricing_inr_sqft_month * 0.7),
      }));
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
