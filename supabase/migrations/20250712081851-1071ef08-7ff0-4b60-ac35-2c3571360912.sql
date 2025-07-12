
-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'planner');
CREATE TYPE public.fish_type AS ENUM ('tilapia', 'pomfret', 'mackerel', 'sardine', 'tuna');
CREATE TYPE public.truck_type AS ENUM ('refrigerated', 'regular');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  role app_role DEFAULT 'operator',
  region TEXT DEFAULT 'tamil_nadu',
  phone TEXT,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create ports table with real Tamil Nadu & Kerala ports
CREATE TABLE public.ports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  region TEXT NOT NULL,
  state TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create markets table with major urban markets
CREATE TABLE public.markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  state TEXT NOT NULL,
  population_served INTEGER,
  market_type TEXT DEFAULT 'urban',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cold storage facilities
CREATE TABLE public.cold_storage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  capacity_kg INTEGER NOT NULL,
  cost_per_hour DECIMAL(10, 2) NOT NULL,
  temperature_range TEXT DEFAULT '-2°C to 2°C',
  refrigeration_type TEXT DEFAULT 'blast_freezing',
  contact_person TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trucks table
CREATE TABLE public.trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT UNIQUE NOT NULL,
  truck_type truck_type NOT NULL,
  capacity_kg INTEGER NOT NULL,
  cost_per_km DECIMAL(8, 2) NOT NULL,
  max_distance_km INTEGER NOT NULL,
  fuel_efficiency_kmpl DECIMAL(5, 2) DEFAULT 12.0,
  owner_name TEXT,
  phone TEXT,
  home_port_id UUID REFERENCES public.ports(id),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily catch entries
CREATE TABLE public.daily_catches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  port_id UUID REFERENCES public.ports(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  catch_date DATE NOT NULL,
  fish_type fish_type NOT NULL,
  volume_kg INTEGER NOT NULL,
  quality_grade TEXT DEFAULT 'Grade A',
  estimated_price_per_kg DECIMAL(8, 2),
  weather_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(port_id, catch_date, fish_type)
);

-- Create market demand entries
CREATE TABLE public.market_demand (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID REFERENCES public.markets(id) NOT NULL,
  demand_date DATE NOT NULL,
  fish_type fish_type NOT NULL,
  quantity_kg INTEGER NOT NULL,
  price_per_kg DECIMAL(8, 2) NOT NULL,
  seasonal_factor DECIMAL(3, 2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_id, demand_date, fish_type)
);

-- Create spoilage profiles (reference data)
CREATE TABLE public.spoilage_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fish_type fish_type NOT NULL UNIQUE,
  unrefrigerated_hours INTEGER NOT NULL,
  refrigerated_hours INTEGER NOT NULL,
  temperature_threshold_celsius INTEGER DEFAULT 25,
  spoilage_rate_per_hour DECIMAL(5, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimization results for tracking
CREATE TABLE public.optimization_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  port_id UUID REFERENCES public.ports(id) NOT NULL,
  market_id UUID REFERENCES public.markets(id) NOT NULL,
  cold_storage_id UUID REFERENCES public.cold_storage(id),
  truck_id UUID REFERENCES public.trucks(id) NOT NULL,
  fish_type fish_type NOT NULL,
  volume_kg INTEGER NOT NULL,
  distance_km DECIMAL(8, 2) NOT NULL,
  travel_time_hours DECIMAL(5, 2) NOT NULL,
  spoilage_percentage DECIMAL(5, 2) NOT NULL,
  revenue DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  net_profit DECIMAL(10, 2) NOT NULL,
  route_data JSONB,
  optimization_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forecasting data
CREATE TABLE public.forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_type TEXT NOT NULL, -- 'demand', 'spoilage', 'revenue'
  target_date DATE NOT NULL,
  fish_type fish_type,
  market_id UUID REFERENCES public.markets(id),
  predicted_value DECIMAL(12, 2) NOT NULL,
  confidence_level DECIMAL(3, 2) DEFAULT 0.85,
  factors JSONB, -- weather, seasonal, historical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert real port data for Tamil Nadu & Kerala
INSERT INTO public.ports (name, code, location_lat, location_lng, region, state, contact_person, phone) VALUES
('Chennai Fishing Harbor', 'MAA', 13.0827, 80.2707, 'tamil_nadu', 'Tamil Nadu', 'Port Manager', '+91-44-2561-2345'),
('Tuticorin Port', 'TCR', 8.7642, 78.1348, 'tamil_nadu', 'Tamil Nadu', 'Harbor Master', '+91-461-2344-567'),
('Rameswaram Port', 'RMM', 9.2876, 79.3129, 'tamil_nadu', 'Tamil Nadu', 'Fisheries Officer', '+91-4573-221-234'),
('Cochin Port', 'COK', 9.9312, 76.2673, 'kerala', 'Kerala', 'Marine Officer', '+91-484-266-1234'),
('Vizhinjam Port', 'VZM', 8.3784, 76.9661, 'kerala', 'Kerala', 'Port Authority', '+91-471-248-1234'),
('Kollam Port', 'KLM', 8.8932, 76.6141, 'kerala', 'Kerala', 'Fisheries Head', '+91-474-274-5678'),
('Mangalore Port', 'MNG', 12.8697, 74.8420, 'karnataka', 'Karnataka', 'Dock Manager', '+91-824-242-3456');

-- Insert major urban markets
INSERT INTO public.markets (name, city, location_lat, location_lng, state, population_served, market_type) VALUES
('KR Market', 'Bangalore', 12.9716, 77.5946, 'Karnataka', 12000000, 'urban'),
('Rythu Bazaar', 'Hyderabad', 17.3850, 78.4867, 'Telangana', 10000000, 'urban'),
('Crawford Market', 'Mumbai', 18.9467, 72.8347, 'Maharashtra', 20000000, 'urban'),
('Palayam Market', 'Trivandrum', 8.5241, 76.9366, 'Kerala', 1000000, 'urban'),
('Broadway Market', 'Chennai', 13.0878, 80.2785, 'Tamil Nadu', 9000000, 'urban'),
('Devaraja Market', 'Mysore', 12.3052, 76.6551, 'Karnataka', 900000, 'regional'),
('Central Market', 'Coimbatore', 11.0168, 76.9558, 'Tamil Nadu', 2100000, 'regional');

-- Insert cold storage facilities
INSERT INTO public.cold_storage (name, location_lat, location_lng, city, state, capacity_kg, cost_per_hour, contact_person, phone) VALUES
('Snowman Logistics', 12.9716, 77.5946, 'Bangalore', 'Karnataka', 50000, 25.00, 'Cold Chain Manager', '+91-80-4567-8901'),
('Khadim India', 17.3850, 78.4867, 'Hyderabad', 'Telangana', 75000, 30.00, 'Operations Head', '+91-40-2345-6789'),
('Gateway Cold Storage', 18.9467, 72.8347, 'Mumbai', 'Maharashtra', 100000, 35.00, 'Facility Manager', '+91-22-6789-0123'),
('Kerala Cold Storage', 8.5241, 76.9366, 'Trivandrum', 'Kerala', 25000, 20.00, 'Plant Manager', '+91-471-234-5678'),
('Chennai Cold Chain', 13.0878, 80.2785, 'Chennai', 'Tamil Nadu', 60000, 28.00, 'Unit Head', '+91-44-8901-2345'),
('Mysore Frozen Foods', 12.3052, 76.6551, 'Mysore', 'Karnataka', 30000, 22.00, 'Store Manager', '+91-821-567-8901');

-- Insert truck fleet data
INSERT INTO public.trucks (license_plate, truck_type, capacity_kg, cost_per_km, max_distance_km, fuel_efficiency_kmpl, owner_name, phone) VALUES
('TN01AB1234', 'refrigerated', 5000, 18.50, 800, 10.5, 'Raman Transport', '+91-98765-43210'),
('TN02CD5678', 'refrigerated', 7500, 22.00, 1000, 9.8, 'Coastal Logistics', '+91-98765-43211'),
('KL07EF9012', 'refrigerated', 6000, 20.00, 900, 10.2, 'Kerala Cold Chain', '+91-98765-43212'),
('TN33GH3456', 'regular', 4000, 12.00, 600, 14.0, 'Quick Transport', '+91-98765-43213'),
('KA05IJ7890', 'refrigerated', 8000, 25.00, 1200, 9.5, 'Bangalore Freight', '+91-98765-43214'),
('AP09KL1234', 'regular', 5000, 15.00, 700, 13.5, 'Andhra Logistics', '+91-98765-43215'),
('MH12MN5678', 'refrigerated', 10000, 30.00, 1500, 8.8, 'Mumbai Express', '+91-98765-43216');

-- Insert spoilage profiles based on FAO data
INSERT INTO public.spoilage_profiles (fish_type, unrefrigerated_hours, refrigerated_hours, temperature_threshold_celsius, spoilage_rate_per_hour) VALUES
('tilapia', 12, 36, 25, 0.0417),
('pomfret', 14, 40, 25, 0.0357),
('mackerel', 10, 30, 25, 0.0500),
('sardine', 8, 24, 25, 0.0625),
('tuna', 16, 48, 25, 0.0313);

-- Insert sample market demand data
INSERT INTO public.market_demand (market_id, demand_date, fish_type, quantity_kg, price_per_kg, seasonal_factor) VALUES
((SELECT id FROM public.markets WHERE name = 'KR Market'), CURRENT_DATE, 'tilapia', 2000, 250.00, 1.2),
((SELECT id FROM public.markets WHERE name = 'KR Market'), CURRENT_DATE, 'pomfret', 1500, 450.00, 1.1),
((SELECT id FROM public.markets WHERE name = 'Rythu Bazaar'), CURRENT_DATE, 'mackerel', 3000, 180.00, 1.3),
((SELECT id FROM public.markets WHERE name = 'Crawford Market'), CURRENT_DATE, 'tuna', 1000, 600.00, 0.9),
((SELECT id FROM public.markets WHERE name = 'Broadway Market'), CURRENT_DATE, 'sardine', 2500, 150.00, 1.4);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_catches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for daily catches
CREATE POLICY "Users can view catches in their region" ON public.daily_catches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR 
           EXISTS (SELECT 1 FROM public.ports WHERE ports.id = daily_catches.port_id AND ports.region = profiles.region))
    )
  );

CREATE POLICY "Users can insert their own catches" ON public.daily_catches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catches" ON public.daily_catches
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for optimization results
CREATE POLICY "Users can view their optimization results" ON public.optimization_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their optimization results" ON public.optimization_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, region)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'operator',
    'tamil_nadu'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;
