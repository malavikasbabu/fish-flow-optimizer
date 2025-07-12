
// Legacy types for backward compatibility
export interface Port {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  availableFish: FishCatch[];
}

export interface FishCatch {
  type: FishType;
  volume: number; // kg
}

export enum FishType {
  TILAPIA = 'tilapia',
  POMFRET = 'pomfret',
  MACKEREL = 'mackerel',
  SARDINE = 'sardine',
  TUNA = 'tuna'
}

export interface Truck {
  id: string;
  type: 'Refrigerated' | 'Regular';
  capacity: number; // kg
  costPerKm: number; // ₹
  maxDistance: number; // km
  available: boolean;
}

export interface ColdStorage {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  capacity: number; // kg
  costPerHour: number; // ₹
  temperatureControl: boolean;
}

export interface Market {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  demand: MarketDemand[];
  maxDeliveryTime: number; // hours
}

export interface MarketDemand {
  fishType: FishType;
  quantity: number; // kg
  pricePerKg: number; // ₹
}

export interface SpoilageProfile {
  fishType: FishType;
  unrefrigeratedHours: number;
  refrigeratedHours: number;
}

export interface OptimizationResult {
  route: {
    source: Port;
    coldStorage?: ColdStorage;
    destination: Market;
  };
  fishType: FishType;
  volume: number;
  truck: Truck;
  distance: number;
  travelTime: number;
  spoilagePercentage: number;
  revenue: number;
  totalCost: number;
  netProfit: number;
}

// New database types
export type DatabaseFishType = 'tilapia' | 'pomfret' | 'mackerel' | 'sardine' | 'tuna';
export type DatabaseTruckType = 'refrigerated' | 'regular';
export type DatabaseAppRole = 'admin' | 'operator' | 'planner';

export interface DatabasePort {
  id: string;
  name: string;
  code: string;
  location_lat: number;
  location_lng: number;
  region: string;
  state: string;
  contact_person: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}

export interface DatabaseMarket {
  id: string;
  name: string;
  city: string;
  location_lat: number;
  location_lng: number;
  state: string;
  population_served: number | null;
  market_type: string;
  active: boolean;
  created_at: string;
}

export interface DatabaseTruck {
  id: string;
  license_plate: string;
  truck_type: DatabaseTruckType;
  capacity_kg: number;
  cost_per_km: number;
  max_distance_km: number;
  fuel_efficiency_kmpl: number;
  owner_name: string | null;
  phone: string | null;
  home_port_id: string | null;
  available: boolean;
  created_at: string;
}

export interface DatabaseColdStorage {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  city: string;
  state: string;
  capacity_kg: number;
  cost_per_hour: number;
  temperature_range: string;
  refrigeration_type: string;
  contact_person: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
}
