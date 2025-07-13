
-- Add admin role to existing enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';

-- Create a function to promote users to admin (run this manually for your user)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Update their role to admin
    UPDATE profiles 
    SET role = 'admin'
    WHERE id = target_user_id;
    
    RAISE NOTICE 'User % promoted to admin', user_email;
END;
$$;

-- Add some sample real data to work with
INSERT INTO ports (name, code, region, state, location_lat, location_lng, contact_person, phone) VALUES
('Chennai Port', 'MAA', 'tamil_nadu', 'Tamil Nadu', 13.0827, 80.2707, 'Rajesh Kumar', '+91-9876543210'),
('Tuticorin Port', 'TCR', 'tamil_nadu', 'Tamil Nadu', 8.7642, 78.1348, 'Priya Sharma', '+91-9876543211'),
('Cochin Port', 'COK', 'kerala', 'Kerala', 9.9312, 76.2673, 'Mohammed Ali', '+91-9876543212'),
('Visakhapatnam Port', 'VTZ', 'andhra_pradesh', 'Andhra Pradesh', 17.6868, 83.2185, 'Lakshmi Devi', '+91-9876543213')
ON CONFLICT (code) DO NOTHING;

INSERT INTO markets (name, city, state, location_lat, location_lng, market_type, population_served) VALUES
('Koyambedu Market', 'Chennai', 'Tamil Nadu', 13.0719, 80.1951, 'wholesale', 5000000),
('Bangalore Fish Market', 'Bangalore', 'Karnataka', 12.9716, 77.5946, 'retail', 8500000),
('Mumbai Crawford Market', 'Mumbai', 'Maharashtra', 18.9489, 72.8317, 'wholesale', 12500000),
('Hyderabad Fish Market', 'Hyderabad', 'Telangana', 17.3850, 78.4867, 'retail', 6800000)
ON CONFLICT DO NOTHING;

INSERT INTO trucks (license_plate, truck_type, capacity_kg, max_distance_km, cost_per_km, owner_name, phone, available) VALUES
('TN01AB1234', 'refrigerated', 5000, 800, 25.50, 'Murugan Transport', '+91-9876543220', true),
('TN02CD5678', 'regular', 3000, 600, 18.75, 'Tamil Transport Co', '+91-9876543221', true),
('KL03EF9012', 'refrigerated', 4000, 1000, 22.00, 'Kerala Logistics', '+91-9876543222', true),
('KA04GH3456', 'regular', 3500, 700, 20.25, 'Bangalore Freight', '+91-9876543223', false)
ON CONFLICT (license_plate) DO NOTHING;

INSERT INTO cold_storage (name, city, state, location_lat, location_lng, capacity_kg, cost_per_hour, temperature_range, refrigeration_type) VALUES
('Chennai Cold Storage', 'Chennai', 'Tamil Nadu', 13.0878, 80.2785, 10000, 150.00, '-2°C to 4°C', 'blast_freezing'),
('Bangalore Frozen Foods', 'Bangalore', 'Karnataka', 12.9698, 77.6124, 8000, 125.00, '0°C to 5°C', 'conventional'),
('Mumbai Ice Works', 'Mumbai', 'Maharashtra', 18.9750, 72.8258, 12000, 175.00, '-5°C to 2°C', 'blast_freezing')
ON CONFLICT DO NOTHING;

INSERT INTO market_demand (market_id, fish_type, demand_date, quantity_kg, price_per_kg, seasonal_factor) 
SELECT 
    m.id,
    ft.fish_type,
    CURRENT_DATE,
    (RANDOM() * 1000 + 500)::INTEGER,
    CASE ft.fish_type
        WHEN 'tilapia' THEN 120 + (RANDOM() * 30)
        WHEN 'pomfret' THEN 280 + (RANDOM() * 50)
        WHEN 'mackerel' THEN 150 + (RANDOM() * 40)
        WHEN 'sardine' THEN 80 + (RANDOM() * 20)
        WHEN 'tuna' THEN 450 + (RANDOM() * 100)
    END,
    1.0 + (RANDOM() * 0.3 - 0.15)
FROM markets m
CROSS JOIN (VALUES ('tilapia'), ('pomfret'), ('mackerel'), ('sardine'), ('tuna')) AS ft(fish_type)
ON CONFLICT DO NOTHING;

INSERT INTO spoilage_profiles (fish_type, spoilage_rate_per_hour, refrigerated_hours, unrefrigerated_hours, temperature_threshold_celsius) VALUES
('tilapia', 4.17, 24, 8, 25),
('pomfret', 3.57, 28, 10, 22),
('mackerel', 5.00, 20, 6, 20),
('sardine', 6.25, 16, 4, 18),
('tuna', 3.13, 32, 12, 25)
ON CONFLICT (fish_type) DO NOTHING;

-- To promote yourself to admin, run this with your email:
-- SELECT promote_to_admin('your-email@example.com');
