-- SmartSpace Warehouse Platform Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('owner', 'seeker', 'admin')) NOT NULL DEFAULT 'seeker',
  company_name TEXT,
  gst_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  warehouse_name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  warehouse_type TEXT,
  total_size_sqft INTEGER NOT NULL,
  available_area INTEGER,
  height_feet NUMERIC(5, 2),
  pricing_inr_sqft_month NUMERIC(10, 2) NOT NULL,
  minimum_lease_months INTEGER DEFAULT 12,
  security_deposit_months INTEGER DEFAULT 2,
  amenities TEXT[], -- Array of amenities
  features TEXT[], -- Array of features
  connectivity TEXT[], -- Transport connectivity
  power_backup BOOLEAN DEFAULT FALSE,
  cold_storage BOOLEAN DEFAULT FALSE,
  fire_safety BOOLEAN DEFAULT FALSE,
  cctv_surveillance BOOLEAN DEFAULT FALSE,
  loading_docks INTEGER DEFAULT 0,
  parking_spaces INTEGER DEFAULT 0,
  office_space BOOLEAN DEFAULT FALSE,
  images TEXT[], -- Array of image URLs
  documents TEXT[], -- Array of document URLs
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  area_sqft INTEGER NOT NULL,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  monthly_rent NUMERIC(12, 2) NOT NULL,
  security_deposit NUMERIC(12, 2) NOT NULL,
  booking_status TEXT CHECK (booking_status IN ('pending', 'confirmed', 'rejected', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')) DEFAULT 'pending',
  blockchain_transaction_hash TEXT,
  smart_contract_address TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  required_area INTEGER,
  preferred_lease_duration INTEGER,
  budget_range_min NUMERIC(12, 2),
  budget_range_max NUMERIC(12, 2),
  inquiry_status TEXT CHECK (inquiry_status IN ('new', 'responded', 'closed', 'converted')) DEFAULT 'new',
  response_message TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_warehouses table (for seeker favorites)
CREATE TABLE IF NOT EXISTS public.saved_warehouses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seeker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seeker_id, warehouse_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  review_type TEXT CHECK (review_type IN ('facility', 'owner', 'location', 'value')) DEFAULT 'facility',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('booking', 'inquiry', 'payment', 'verification', 'general')) NOT NULL,
  related_id UUID, -- Can reference booking, inquiry, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('security_deposit', 'monthly_rent', 'booking_fee', 'refund')) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('upi', 'bank_transfer', 'card', 'wallet', 'blockchain')) NOT NULL,
  payment_gateway_id TEXT,
  blockchain_transaction_hash TEXT,
  transaction_status TEXT CHECK (transaction_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_owner_id ON public.warehouses(owner_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_city_state ON public.warehouses(city, state);
CREATE INDEX IF NOT EXISTS idx_warehouses_active_verified ON public.warehouses(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_bookings_warehouse_id ON public.bookings(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_bookings_seeker_id ON public.bookings(seeker_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_warehouse_id ON public.inquiries(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(inquiry_status);
CREATE INDEX IF NOT EXISTS idx_saved_warehouses_seeker_id ON public.saved_warehouses(seeker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Warehouses policies
CREATE POLICY "Everyone can view active verified warehouses" ON public.warehouses
  FOR SELECT USING (is_active = true AND is_verified = true);

CREATE POLICY "Owners can view own warehouses" ON public.warehouses
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert own warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own warehouses" ON public.warehouses
  FOR UPDATE USING (owner_id = auth.uid());

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (seeker_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Seekers can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (seeker_id = auth.uid());

CREATE POLICY "Participants can update bookings" ON public.bookings
  FOR UPDATE USING (seeker_id = auth.uid() OR owner_id = auth.uid());

-- Inquiries policies
CREATE POLICY "Users can view own inquiries" ON public.inquiries
  FOR SELECT USING (seeker_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Seekers can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (seeker_id = auth.uid());

CREATE POLICY "Participants can update inquiries" ON public.inquiries
  FOR UPDATE USING (seeker_id = auth.uid() OR owner_id = auth.uid());

-- Saved warehouses policies
CREATE POLICY "Users can manage own saved warehouses" ON public.saved_warehouses
  FOR ALL USING (seeker_id = auth.uid());

-- Reviews policies
CREATE POLICY "Everyone can view reviews" ON public.reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Payment transactions policies
CREATE POLICY "Users can view own payment transactions" ON public.payment_transactions
  FOR SELECT USING (payer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.bookings WHERE id = booking_id AND (owner_id = auth.uid() OR seeker_id = auth.uid())
  ));

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_warehouses
    BEFORE UPDATE ON public.warehouses
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_bookings
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_inquiries
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_reviews
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'seeker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample data (optional)
-- This will be replaced by CSV import later

-- Sample profiles (these will be created via authentication)
-- Warehouses and other data will be imported from CSV
