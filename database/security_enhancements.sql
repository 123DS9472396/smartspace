-- Security Enhancements for SmartSpace Warehouse Platform
-- Run this after the main schema.sql in Supabase SQL Editor

-- Create audit_logs table for tracking security events
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT, -- 'warehouse', 'booking', 'user', etc.
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has valid session
CREATE OR REPLACE FUNCTION public.is_user_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policy for warehouses - allow public read of basic info
DROP POLICY IF EXISTS "Everyone can view active verified warehouses" ON public.warehouses;

CREATE POLICY "Public can view basic warehouse info" ON public.warehouses
  FOR SELECT USING (
    is_active = true AND is_verified = true
  );

-- Create function to track warehouse views (for analytics)
CREATE TABLE IF NOT EXISTS public.warehouse_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_warehouse_views_warehouse_id ON public.warehouse_views(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_views_user_id ON public.warehouse_views(user_id);

-- Function to record warehouse view
CREATE OR REPLACE FUNCTION public.record_warehouse_view(
  p_warehouse_id UUID,
  p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.warehouse_views (warehouse_id, user_id)
  VALUES (p_warehouse_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS for new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_views ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Anyone can record warehouse views (for analytics)
CREATE POLICY "Anyone can record warehouse views" ON public.warehouse_views
  FOR INSERT WITH CHECK (true);

-- Users can view own warehouse views
CREATE POLICY "Users can view own views" ON public.warehouse_views
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Create function to validate password strength (for client-side use)
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  has_uppercase BOOLEAN;
  has_lowercase BOOLEAN;
  has_digit BOOLEAN;
  has_special BOOLEAN;
  is_long_enough BOOLEAN;
BEGIN
  has_uppercase := password ~ '[A-Z]';
  has_lowercase := password ~ '[a-z]';
  has_digit := password ~ '[0-9]';
  has_special := password ~ '[!@#$%^&*(),.?":{}|<>]';
  is_long_enough := length(password) >= 8;
  
  result := jsonb_build_object(
    'valid', has_uppercase AND has_lowercase AND has_digit AND is_long_enough,
    'strength', CASE
      WHEN has_uppercase AND has_lowercase AND has_digit AND has_special AND length(password) >= 12 THEN 'strong'
      WHEN has_uppercase AND has_lowercase AND has_digit AND length(password) >= 8 THEN 'medium'
      ELSE 'weak'
    END,
    'has_uppercase', has_uppercase,
    'has_lowercase', has_lowercase,
    'has_digit', has_digit,
    'has_special', has_special,
    'is_long_enough', is_long_enough
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to log booking creations
CREATE OR REPLACE FUNCTION public.log_booking_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.log_audit_event(
    NEW.seeker_id,
    'booking_created',
    'booking',
    NEW.id,
    jsonb_build_object(
      'warehouse_id', NEW.warehouse_id,
      'area_sqft', NEW.area_sqft,
      'monthly_rent', NEW.monthly_rent
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_creation();

-- Trigger to log warehouse approval
CREATE OR REPLACE FUNCTION public.log_warehouse_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_verified = false AND NEW.is_verified = true THEN
    PERFORM public.log_audit_event(
      auth.uid(),
      'warehouse_approved',
      'warehouse',
      NEW.id,
      jsonb_build_object('warehouse_name', NEW.warehouse_name)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_warehouse_approved
  AFTER UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.log_warehouse_approval();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.warehouse_views TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_warehouse_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_password_strength TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Security enhancements applied successfully!';
  RAISE NOTICE '✓ Audit logging enabled';
  RAISE NOTICE '✓ Warehouse view tracking enabled';
  RAISE NOTICE '✓ Enhanced RLS policies applied';
  RAISE NOTICE '✓ Password strength validation available';
END $$;
