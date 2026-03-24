-- SmartSpace Platform - Product Market Prices (Mock Data)
-- Agricultural and commodity pricing for farmer booking calculations
-- Run this AFTER maharashtra_pricing_data.sql

-- ============================================
-- AGRICULTURAL PRODUCTS PRICING
-- ============================================

INSERT INTO public.product_market_prices (product_type, product_category, current_price_per_kg, unit, market_name, price_trend) VALUES
-- Vegetables
('Potato', 'Vegetable', 20.00, 'kg', 'Maharashtra APMC', 'stable'),
('Onion', 'Vegetable', 25.00, 'kg', 'Maharashtra APMC', 'rising'),
('Tomato', 'Vegetable', 30.00, 'kg', 'Maharashtra APMC', 'falling'),
('Cabbage', 'Vegetable', 15.00, 'kg', 'Maharashtra APMC', 'stable'),
('Cauliflower', 'Vegetable', 18.00, 'kg', 'Maharashtra APMC', 'stable'),
('Carrot', 'Vegetable', 22.00, 'kg', 'Maharashtra APMC', 'stable'),
('Beetroot', 'Vegetable', 24.00, 'kg', 'Maharashtra APMC', 'rising'),
('Green Chilli', 'Vegetable', 40.00, 'kg', 'Maharashtra APMC', 'stable'),
('Ginger', 'Vegetable', 80.00, 'kg', 'Maharashtra APMC', 'rising'),
('Garlic', 'Vegetable', 120.00, 'kg', 'Maharashtra APMC', 'stable'),

-- Fruits
('Banana', 'Fruit', 30.00, 'kg', 'Maharashtra APMC', 'stable'),
('Apple', 'Fruit', 150.00, 'kg', 'Maharashtra APMC', 'stable'),
('Orange', 'Fruit', 50.00, 'kg', 'Maharashtra APMC', 'falling'),
('Pomegranate', 'Fruit', 100.00, 'kg', 'Maharashtra APMC', 'stable'),
('Grapes', 'Fruit', 80.00, 'kg', 'Maharashtra APMC', 'rising'),
('Mango', 'Fruit', 120.00, 'kg', 'Maharashtra APMC', 'stable'),
('Papaya', 'Fruit', 25.00, 'kg', 'Maharashtra APMC', 'stable'),
('Watermelon', 'Fruit', 15.00, 'kg', 'Maharashtra APMC', 'falling'),
('Pineapple', 'Fruit', 35.00, 'kg', 'Maharashtra APMC', 'stable'),

-- Grains & Cereals
('Wheat', 'Grain', 28.00, 'kg', 'Maharashtra APMC', 'stable'),
('Rice (Paddy)', 'Grain', 32.00, 'kg', 'Maharashtra APMC', 'rising'),
('Rice (Basmati)', 'Grain', 80.00, 'kg', 'Maharashtra APMC', 'stable'),
('Jowar (Sorghum)', 'Grain', 35.00, 'kg', 'Maharashtra APMC', 'stable'),
('Bajra (Pearl Millet)', 'Grain', 30.00, 'kg', 'Maharashtra APMC', 'stable'),
('Maize (Corn)', 'Grain', 25.00, 'kg', 'Maharashtra APMC', 'falling'),
('Ragi (Finger Millet)', 'Grain', 45.00, 'kg', 'Maharashtra APMC', 'rising'),

-- Pulses & Lentils
('Tur Dal (Pigeon Pea)', 'Pulse', 120.00, 'kg', 'Maharashtra APMC', 'stable'),
('Moong Dal (Green Gram)', 'Pulse', 110.00, 'kg', 'Maharashtra APMC', 'stable'),
('Urad Dal (Black Gram)', 'Pulse', 100.00, 'kg', 'Maharashtra APMC', 'rising'),
('Chana (Chickpea)', 'Pulse', 90.00, 'kg', 'Maharashtra APMC', 'stable'),
('Masoor Dal (Lentil)', 'Pulse', 85.00, 'kg', 'Maharashtra APMC', 'stable'),
('Rajma (Kidney Beans)', 'Pulse', 95.00, 'kg', 'Maharashtra APMC', 'stable'),

-- Spices
('Turmeric', 'Spice', 150.00, 'kg', 'Maharashtra APMC', 'rising'),
('Coriander Seeds', 'Spice', 120.00, 'kg', 'Maharashtra APMC', 'stable'),
('Cumin Seeds', 'Spice', 400.00, 'kg', 'Maharashtra APMC', 'stable'),
('Black Pepper', 'Spice', 600.00, 'kg', 'Maharashtra APMC', 'rising'),
('Cardamom', 'Spice', 1200.00, 'kg', 'Maharashtra APMC', 'stable'),
('Red Chilli', 'Spice', 180.00, 'kg', 'Maharashtra APMC', 'falling'),

-- Oil Seeds
('Groundnut', 'Oilseed', 70.00, 'kg', 'Maharashtra APMC', 'stable'),
('Soybean', 'Oilseed', 55.00, 'kg', 'Maharashtra APMC', 'rising'),
('Sunflower', 'Oilseed', 60.00, 'kg', 'Maharashtra APMC', 'stable'),
('Sesame', 'Oilseed', 180.00, 'kg', 'Maharashtra APMC', 'stable'),

-- Sugarcane & Jaggery
('Sugarcane', 'Cash Crop', 3.00, 'kg', 'Maharashtra APMC', 'stable'),
('Jaggery (Gur)', 'Processed', 50.00, 'kg', 'Maharashtra APMC', 'stable'),

-- Cotton
('Cotton (Raw)', 'Fiber', 85.00, 'kg', 'Maharashtra APMC', 'stable'),

-- Dairy & Processed (for wholesalers)
('Milk Powder', 'Dairy', 400.00, 'kg', 'Maharashtra APMC', 'stable'),
('Paneer', 'Dairy', 350.00, 'kg', 'Maharashtra APMC', 'rising'),
('Butter', 'Dairy', 500.00, 'kg', 'Maharashtra APMC', 'stable'),
('Ghee', 'Dairy', 550.00, 'kg', 'Maharashtra APMC', 'stable'),

-- FMCG Products (for quick commerce warehouses)
('Packaged Rice', 'FMCG', 40.00, 'kg', 'Wholesale Market', 'stable'),
('Packaged Atta', 'FMCG', 35.00, 'kg', 'Wholesale Market', 'stable'),
('Cooking Oil (Bottle)', 'FMCG', 150.00, 'liter', 'Wholesale Market', 'rising'),
('Sugar (Packaged)', 'FMCG', 45.00, 'kg', 'Wholesale Market', 'stable'),
('Salt (Packaged)', 'FMCG', 10.00, 'kg', 'Wholesale Market', 'stable'),
('Tea Leaves', 'FMCG', 400.00, 'kg', 'Wholesale Market', 'stable'),
('Coffee Powder', 'FMCG', 600.00, 'kg', 'Wholesale Market', 'rising');

-- ============================================
-- STORAGE RATE CONFIGURATIONS
-- ============================================

-- Create table for storage rates by product category
CREATE TABLE IF NOT EXISTS public.storage_rate_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_category TEXT NOT NULL,
  storage_type_required TEXT NOT NULL,
  rate_per_kg_per_day NUMERIC NOT NULL,
  min_storage_days INTEGER DEFAULT 7,
  insurance_percentage NUMERIC DEFAULT 2.0,
  special_handling_required BOOLEAN DEFAULT false,
  temperature_control TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.storage_rate_config (product_category, storage_type_required, rate_per_kg_per_day, min_storage_days, insurance_percentage, special_handling_required, temperature_control) VALUES
('Vegetable', 'cold_storage', 0.50, 7, 2.0, true, '2-8°C'),
('Fruit', 'cold_storage', 0.60, 7, 2.5, true, '0-4°C'),
('Grain', 'general', 0.20, 30, 1.5, false, 'Ambient'),
('Pulse', 'general', 0.25, 30, 1.5, false, 'Ambient'),
('Spice', 'general', 0.30, 30, 2.0, false, 'Cool & Dry'),
('Oilseed', 'general', 0.25, 30, 1.5, false, 'Ambient'),
('Cash Crop', 'general', 0.15, 15, 1.0, false, 'Ambient'),
('Fiber', 'general', 0.20, 60, 1.5, false, 'Dry'),
('Dairy', 'cold_storage', 1.00, 7, 3.0, true, '-2 to 4°C'),
('Processed', 'cold_storage', 0.40, 15, 2.0, true, '10-15°C'),
('FMCG', 'general', 0.10, 30, 1.0, false, 'Ambient');

-- ============================================
-- VERIFICATION & ANALYTICS QUERIES
-- ============================================

-- Count products by category
SELECT 
  product_category,
  COUNT(*) as product_count,
  ROUND(AVG(current_price_per_kg), 2) as avg_price,
  ROUND(MIN(current_price_per_kg), 2) as min_price,
  ROUND(MAX(current_price_per_kg), 2) as max_price
FROM public.product_market_prices
GROUP BY product_category
ORDER BY product_count DESC;

-- Price distribution
SELECT 
  CASE 
    WHEN current_price_per_kg < 50 THEN 'Budget (< ₹50/kg)'
    WHEN current_price_per_kg < 150 THEN 'Mid-range (₹50-150/kg)'
    WHEN current_price_per_kg < 500 THEN 'Premium (₹150-500/kg)'
    ELSE 'Ultra-premium (₹500+/kg)'
  END as price_range,
  COUNT(*) as product_count
FROM public.product_market_prices
GROUP BY price_range
ORDER BY product_count DESC;

-- Products with rising prices
SELECT product_type, product_category, current_price_per_kg, price_trend
FROM public.product_market_prices
WHERE price_trend = 'rising'
ORDER BY current_price_per_kg DESC;

-- Storage requirements
SELECT 
  storage_type_required,
  COUNT(*) as categories,
  ROUND(AVG(rate_per_kg_per_day), 3) as avg_daily_rate,
  ROUND(AVG(insurance_percentage), 2) as avg_insurance_pct
FROM public.storage_rate_config
GROUP BY storage_type_required;

-- Sample calculation for potato storage
SELECT 
  p.product_type,
  p.current_price_per_kg,
  s.storage_type_required,
  s.rate_per_kg_per_day,
  s.insurance_percentage,
  -- Example: 100 sacks × 50 kg × 15 days
  (100 * 50 * s.rate_per_kg_per_day * 15) as storage_cost_15_days,
  (100 * 50 * p.current_price_per_kg * s.insurance_percentage / 100) as insurance_amount,
  (100 * 50 * s.rate_per_kg_per_day * 15) + (100 * 50 * p.current_price_per_kg * s.insurance_percentage / 100) as total_cost
FROM public.product_market_prices p
JOIN public.storage_rate_config s ON p.product_category = s.product_category
WHERE p.product_type = 'Potato';

