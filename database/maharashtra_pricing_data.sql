-- SmartSpace Platform - Maharashtra Pricing Data
-- 50+ cities across Maharashtra with realistic warehouse pricing
-- Run this AFTER schema_enhancements.sql

-- ============================================
-- MAHARASHTRA PRICING REFERENCE DATA
-- ============================================

-- Clear existing data
TRUNCATE TABLE public.pricing_reference;

-- Mumbai Region (Premium pricing - ₹70-120/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Mumbai', 'Andheri East', 95.00, 10, 45, 0.92),
('Mumbai', 'Andheri West', 98.00, 10, 38, 0.95),
('Mumbai', 'Bandra East', 110.00, 10, 25, 0.97),
('Mumbai', 'Bandra West', 115.00, 10, 18, 0.98),
('Mumbai', 'Kurla', 70.00, 9, 52, 0.85),
('Mumbai', 'Vikhroli', 75.00, 9, 40, 0.88),
('Mumbai', 'Powai', 85.00, 9, 32, 0.90),
('Mumbai', 'Goregaon', 80.00, 9, 48, 0.87),
('Mumbai', 'Malad', 78.00, 9, 55, 0.86),
('Mumbai', 'Kandivali', 72.00, 8, 60, 0.84),
('Mumbai', 'Borivali', 68.00, 8, 65, 0.83),
('Mumbai', 'Mulund', 73.00, 8, 42, 0.85),
('Mumbai', 'Ghatkopar', 76.00, 9, 50, 0.86),
('Mumbai', 'Chembur', 82.00, 9, 38, 0.89);

-- Thane Region (Mid-high pricing - ₹35-70/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Thane', 'Thane City', 55.00, 8, 75, 0.82),
('Thane', 'Kalyan', 40.00, 7, 85, 0.78),
('Thane', 'Dombivli', 38.00, 7, 90, 0.76),
('Thane', 'Bhiwandi', 35.00, 8, 120, 0.88),
('Thane', 'Ambernath', 32.00, 6, 65, 0.74),
('Thane', 'Ulhasnagar', 36.00, 6, 70, 0.75),
('Thane', 'Mira Road', 45.00, 7, 55, 0.80),
('Thane', 'Virar', 30.00, 6, 48, 0.72),
('Navi Mumbai', 'Vashi', 60.00, 8, 68, 0.85),
('Navi Mumbai', 'Airoli', 52.00, 8, 72, 0.83),
('Navi Mumbai', 'Rabale', 55.00, 8, 80, 0.86),
('Navi Mumbai', 'Mahape', 58.00, 8, 62, 0.84),
('Navi Mumbai', 'Taloja', 42.00, 7, 95, 0.81),
('Navi Mumbai', 'Panvel', 40.00, 7, 100, 0.79);

-- Pune Region (Mid pricing - ₹40-70/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Pune', 'Hinjewadi', 50.00, 8, 110, 0.87),
('Pune', 'Kharadi', 60.00, 9, 95, 0.90),
('Pune', 'Wakad', 45.00, 7, 88, 0.82),
('Pune', 'Pimpri', 42.00, 7, 105, 0.85),
('Pune', 'Chinchwad', 43.00, 7, 98, 0.84),
('Pune', 'Hadapsar', 48.00, 8, 92, 0.86),
('Pune', 'Chakan', 38.00, 8, 130, 0.91),
('Pune', 'Talegaon', 35.00, 7, 115, 0.88),
('Pune', 'Ranjangaon', 32.00, 7, 105, 0.85),
('Pune', 'Shikrapur', 30.00, 6, 85, 0.80);

-- Nashik Region (₹20-35/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Nashik', 'Nashik Road', 25.00, 6, 78, 0.75),
('Nashik', 'MIDC Ambad', 28.00, 7, 95, 0.82),
('Nashik', 'Satpur', 27.00, 7, 88, 0.80),
('Nashik', 'Sinnar', 22.00, 6, 70, 0.73),
('Nashik', 'Igatpuri', 20.00, 5, 45, 0.68);

-- Nagpur Region (₹25-40/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Nagpur', 'MIHAN', 35.00, 7, 120, 0.86),
('Nagpur', 'Butibori', 30.00, 7, 105, 0.84),
('Nagpur', 'Hingna', 28.00, 6, 85, 0.79),
('Nagpur', 'Wardha Road', 32.00, 7, 92, 0.82),
('Nagpur', 'Kalmeshwar', 25.00, 6, 68, 0.74);

-- Aurangabad Region (₹25-35/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Aurangabad', 'MIDC Waluj', 30.00, 6, 95, 0.80),
('Aurangabad', 'Chikalthana', 32.00, 7, 88, 0.83),
('Aurangabad', 'Shendra', 28.00, 6, 76, 0.77),
('Aurangabad', 'Paithan Road', 26.00, 6, 65, 0.75);

-- Solapur Region (₹20-30/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Solapur', 'MIDC', 25.00, 5, 58, 0.72),
('Solapur', 'Akkalkot Road', 22.00, 5, 52, 0.70),
('Solapur', 'Hotgi Road', 20.00, 5, 45, 0.68);

-- Kolhapur Region (₹18-28/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Kolhapur', 'Shiroli', 20.00, 5, 62, 0.71),
('Kolhapur', 'Kagal', 22.00, 6, 70, 0.75),
('Kolhapur', 'Gokul Shirgaon', 24.00, 6, 65, 0.76);

-- Ahmednagar Region (₹22-30/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Ahmednagar', 'MIDC', 26.00, 6, 72, 0.74),
('Ahmednagar', 'Nagar Road', 24.00, 5, 65, 0.72),
('Ahmednagar', 'Shrirampur', 22.00, 5, 55, 0.70);

-- Satara Region (₹18-25/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Satara', 'Industrial Area', 20.00, 5, 48, 0.68),
('Satara', 'Koregaon', 22.00, 5, 52, 0.70);

-- Sangli Region (₹18-25/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Sangli', 'MIDC', 21.00, 5, 55, 0.69),
('Sangli', 'Miraj', 19.00, 5, 48, 0.67);

-- Ratnagiri - Konkan Region (₹15-22/sqft)
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Ratnagiri', 'Port Area', 18.00, 4, 35, 0.65),
('Raigad', 'Roha', 20.00, 5, 42, 0.68),
('Raigad', 'Pen', 17.00, 4, 38, 0.64);

-- Marathwada Region
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Jalna', 'MIDC', 23.00, 5, 45, 0.70),
('Bid', 'Industrial Area', 21.00, 5, 40, 0.68),
('Latur', 'MIDC', 24.00, 5, 48, 0.71),
('Osmanabad', 'Town Area', 20.00, 4, 35, 0.66),
('Parbhani', 'MIDC', 22.00, 5, 42, 0.69);

-- Vidarbha Region 
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Amravati', 'MIDC', 26.00, 6, 58, 0.73),
('Akola', 'Industrial Zone', 24.00, 5, 52, 0.71),
('Yavatmal', 'Cotton Market', 22.00, 5, 45, 0.69),
('Chandrapur', 'MIDC', 25.00, 6, 55, 0.72),
('Wardha', 'Industrial Area', 23.00, 5, 48, 0.70);

-- North Maharashtra
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Dhule', 'MIDC', 22.00, 5, 45, 0.69),
('Jalgaon', 'MIDC Five Star', 25.00, 6, 62, 0.74),
('Nandurbar', 'Industrial Area', 20.00, 4, 38, 0.66);

-- Western Maharashtra
INSERT INTO public.pricing_reference (city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy) VALUES
('Karad', 'Industrial Zone', 21.00, 5, 42, 0.68),
('Islampur', 'Sugar Belt', 22.00, 5, 48, 0.70),
('Baramati', 'MIDC', 28.00, 6, 55, 0.75);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count total cities
SELECT COUNT(DISTINCT city) as total_cities, 
       COUNT(DISTINCT district) as total_districts,
       COUNT(*) as total_locations
FROM public.pricing_reference;

-- Price distribution
SELECT 
  CASE 
    WHEN avg_price_per_sqft < 25 THEN '₹15-25 (Budget)'
    WHEN avg_price_per_sqft < 50 THEN '₹25-50 (Mid-range)'
    WHEN avg_price_per_sqft < 75 THEN '₹50-75 (Premium)'
    ELSE '₹75+ (Ultra-premium)'
  END as price_category,
  COUNT(*) as location_count,
  ROUND(AVG(avg_price_per_sqft), 2) as avg_price
FROM public.pricing_reference
GROUP BY price_category
ORDER BY avg_price DESC;

-- Top 10 most expensive locations
SELECT city, district, avg_price_per_sqft, demand_score, warehouse_count
FROM public.pricing_reference
ORDER BY avg_price_per_sqft DESC
LIMIT 10;

-- Top 10 high-demand locations
SELECT city, district, avg_price_per_sqft, demand_score, warehouse_count, avg_occupancy
FROM public.pricing_reference
ORDER BY demand_score DESC, avg_occupancy DESC
LIMIT 10;

-- City-wise summary
SELECT 
  city,
  COUNT(*) as districts,
  ROUND(AVG(avg_price_per_sqft), 2) as avg_city_price,
  ROUND(AVG(demand_score), 2) as avg_demand,
  SUM(warehouse_count) as total_warehouses
FROM public.pricing_reference
GROUP BY city
ORDER BY avg_city_price DESC;

