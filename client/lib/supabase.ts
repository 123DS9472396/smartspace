// Re-export the single Supabase client instance to avoid duplicate GoTrue clients
export { supabase } from '../services/supabaseClient';

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          company: string;
          user_type: 'owner' | 'seeker' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone: string;
          company: string;
          user_type: 'owner' | 'seeker' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          company?: string;
          user_type?: 'owner' | 'seeker' | 'admin';
          updated_at?: string;
        };
      };
      warehouses: {
        Row: {
          id: string;
          warehouse_name: string;
          warehouse_licence_number: string;
          warehouse_address: string;
          district: string;
          city: string;
          state: string;
          capacity_mt: number;
          registration_date: string;
          licence_valid_upto: string;
          owner_name: string;
          contact_number: string;
          micro_rental_spaces: number;
          owner_email: string;
          pricing_inr_sqft_month: number;
          warehouse_type: string;
          total_size_sqft: number;
          latitude: number | null;
          longitude: number | null;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          owner_id: string | null;
        };
        Insert: {
          id?: string;
          warehouse_name: string;
          warehouse_licence_number: string;
          warehouse_address: string;
          district: string;
          city: string;
          state: string;
          capacity_mt: number;
          registration_date: string;
          licence_valid_upto: string;
          owner_name: string;
          contact_number: string;
          micro_rental_spaces: number;
          owner_email: string;
          pricing_inr_sqft_month: number;
          warehouse_type: string;
          total_size_sqft: number;
          latitude?: number | null;
          longitude?: number | null;
          is_verified?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          owner_id?: string | null;
        };
        Update: {
          warehouse_name?: string;
          warehouse_licence_number?: string;
          warehouse_address?: string;
          district?: string;
          city?: string;
          state?: string;
          capacity_mt?: number;
          registration_date?: string;
          licence_valid_upto?: string;
          owner_name?: string;
          contact_number?: string;
          micro_rental_spaces?: number;
          owner_email?: string;
          pricing_inr_sqft_month?: number;
          warehouse_type?: string;
          total_size_sqft?: number;
          latitude?: number | null;
          longitude?: number | null;
          is_verified?: boolean;
          is_active?: boolean;
          updated_at?: string;
          owner_id?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          warehouse_id: string;
          seeker_id: string;
          start_date: string;
          end_date: string;
          area_booked_sqft: number;
          total_cost: number;
          status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          warehouse_id: string;
          seeker_id: string;
          start_date: string;
          end_date: string;
          area_booked_sqft: number;
          total_cost: number;
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          warehouse_id?: string;
          seeker_id?: string;
          start_date?: string;
          end_date?: string;
          area_booked_sqft?: number;
          total_cost?: number;
          status?: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
          updated_at?: string;
        };
      };
      inquiries: {
        Row: {
          id: string;
          warehouse_id: string;
          seeker_id: string;
          message: string;
          area_required: number;
          status: 'new' | 'responded' | 'closed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          warehouse_id: string;
          seeker_id: string;
          message: string;
          area_required: number;
          status?: 'new' | 'responded' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          warehouse_id?: string;
          seeker_id?: string;
          message?: string;
          area_required?: number;
          status?: 'new' | 'responded' | 'closed';
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
