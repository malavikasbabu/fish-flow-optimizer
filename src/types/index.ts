
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
  TILAPIA = 'Tilapia',
  POMFRET = 'Pomfret',
  MACKEREL = 'Mackerel',
  SARDINE = 'Sardine',
  TUNA = 'Tuna'
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
