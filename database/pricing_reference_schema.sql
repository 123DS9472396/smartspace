-- Drop the old table completely (it has wrong schema)
DROP TABLE IF EXISTS pricing_reference CASCADE;

-- Create pricing_reference table with correct schema
CREATE TABLE pricing_reference (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
  avg_price_per_sqft DECIMAL(10, 2) NOT NULL,
  demand_score INTEGER NOT NULL CHECK (demand_score >= 1 AND demand_score <= 10),
  market_trend VARCHAR(20) DEFAULT 'stable', -- growing, stable, declining
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_pricing_city ON pricing_reference(city);
CREATE INDEX idx_pricing_city_district ON pricing_reference(city, district);

-- Insert sample pricing data for major Maharashtra cities
INSERT INTO pricing_reference (city, district, state, avg_price_per_sqft, demand_score, market_trend) VALUES
-- Mumbai
('Mumbai', 'Mumbai City', 'Maharashtra', 85, 9, 'growing'),
('Mumbai', 'Mumbai Suburban', 'Maharashtra', 75, 9, 'growing'),
('Mumbai', 'Thane', 'Maharashtra', 55, 8, 'growing'),

-- Pune
('Pune', 'Pune', 'Maharashtra', 60, 8, 'growing'),
('Pune', 'Pimpri-Chinchwad', 'Maharashtra', 50, 8, 'stable'),

-- Nagpur
('Nagpur', 'Nagpur', 'Maharashtra', 40, 7, 'stable'),

-- Nashik
('Nashik', 'Nashik', 'Maharashtra', 38, 7, 'growing'),

-- Aurangabad
('Aurangabad', 'Aurangabad', 'Maharashtra', 35, 6, 'stable'),

-- Solapur
('Solapur', 'Solapur', 'Maharashtra', 32, 6, 'stable'),

-- Kolhapur
('Kolhapur', 'Kolhapur', 'Maharashtra', 35, 6, 'stable'),

-- Amravati
('Amravati', 'Amravati', 'Maharashtra', 30, 5, 'stable'),

-- Navi Mumbai
('Navi Mumbai', 'Raigad', 'Maharashtra', 65, 8, 'growing'),

-- Kalyan-Dombivli
('Kalyan-Dombivli', 'Thane', 'Maharashtra', 48, 7, 'growing'),

-- Vasai-Virar
('Vasai-Virar', 'Palghar', 'Maharashtra', 42, 7, 'growing'),

-- Add more cities with general pricing
('Sangli', 'Sangli', 'Maharashtra', 30, 5, 'stable'),
('Ahmednagar', 'Ahmednagar', 'Maharashtra', 28, 5, 'stable'),
('Jalgaon', 'Jalgaon', 'Maharashtra', 28, 5, 'stable'),
('Akola', 'Akola', 'Maharashtra', 26, 5, 'stable'),
('Latur', 'Latur', 'Maharashtra', 28, 5, 'stable'),
('Dhule', 'Dhule', 'Maharashtra', 26, 5, 'stable'),
('Chandrapur', 'Chandrapur', 'Maharashtra', 25, 5, 'stable'),
('Parbhani', 'Parbhani', 'Maharashtra', 24, 4, 'stable'),
('Ichalkaranji', 'Kolhapur', 'Maharashtra', 30, 5, 'stable'),
('Jalna', 'Jalna', 'Maharashtra', 24, 4, 'stable'),
('Bhusawal', 'Jalgaon', 'Maharashtra', 26, 5, 'stable'),
('Panvel', 'Raigad', 'Maharashtra', 52, 7, 'growing'),
('Satara', 'Satara', 'Maharashtra', 28, 5, 'stable'),
('Beed', 'Beed', 'Maharashtra', 22, 4, 'stable'),
('Yavatmal', 'Yavatmal', 'Maharashtra', 22, 4, 'stable'),
('Kamptee', 'Nagpur', 'Maharashtra', 35, 6, 'stable'),
('Gondia', 'Gondia', 'Maharashtra', 24, 4, 'stable'),
('Barshi', 'Solapur', 'Maharashtra', 25, 4, 'stable'),
('Achalpur', 'Amravati', 'Maharashtra', 26, 5, 'stable'),
('Osmanabad', 'Osmanabad', 'Maharashtra', 23, 4, 'stable'),
('Nanded', 'Nanded', 'Maharashtra', 28, 5, 'stable'),
('Wardha', 'Wardha', 'Maharashtra', 24, 4, 'stable'),
('Udgir', 'Latur', 'Maharashtra', 24, 4, 'stable'),
('Hinganghat', 'Wardha', 'Maharashtra', 23, 4, 'stable');

COMMENT ON TABLE pricing_reference IS 'Reference pricing data for ML-powered pricing recommendations';
