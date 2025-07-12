
import { Port, Truck, ColdStorage, Market, FishType, MarketDemand, SpoilageProfile } from '../types';

export const mockPorts: Port[] = [
  {
    id: 'port-1',
    name: 'Visakhapatnam Port',
    location: { lat: 17.7231, lng: 83.3011 },
    availableFish: [
      { type: FishType.TILAPIA, volume: 500 },
      { type: FishType.MACKEREL, volume: 300 },
      { type: FishType.POMFRET, volume: 200 }
    ]
  },
  {
    id: 'port-2',
    name: 'Cochin Port',
    location: { lat: 9.9312, lng: 76.2673 },
    availableFish: [
      { type: FishType.SARDINE, volume: 800 },
      { type: FishType.TUNA, volume: 150 },
      { type: FishType.MACKEREL, volume: 400 }
    ]
  },
  {
    id: 'port-3',
    name: 'Chennai Port',
    location: { lat: 13.0827, lng: 80.2707 },
    availableFish: [
      { type: FishType.POMFRET, volume: 350 },
      { type: FishType.TILAPIA, volume: 600 }
    ]
  }
];

export const mockTrucks: Truck[] = [
  {
    id: 'truck-1',
    type: 'Refrigerated',
    capacity: 1000,
    costPerKm: 25,
    maxDistance: 500,
    available: true
  },
  {
    id: 'truck-2',
    type: 'Refrigerated',
    capacity: 800,
    costPerKm: 22,
    maxDistance: 400,
    available: true
  },
  {
    id: 'truck-3',
    type: 'Regular',
    capacity: 1200,
    costPerKm: 15,
    maxDistance: 600,
    available: true
  },
  {
    id: 'truck-4',
    type: 'Regular',
    capacity: 900,
    costPerKm: 12,
    maxDistance: 450,
    available: false
  }
];

export const mockColdStorage: ColdStorage[] = [
  {
    id: 'storage-1',
    name: 'Hyderabad Cold Hub',
    location: { lat: 17.3850, lng: 78.4867 },
    capacity: 2000,
    costPerHour: 50,
    temperatureControl: true
  },
  {
    id: 'storage-2',
    name: 'Bangalore Storage',
    location: { lat: 12.9716, lng: 77.5946 },
    capacity: 1500,
    costPerHour: 45,
    temperatureControl: true
  }
];

export const mockMarkets: Market[] = [
  {
    id: 'market-1',
    name: 'Delhi Fish Market',
    location: { lat: 28.7041, lng: 77.1025 },
    maxDeliveryTime: 24,
    demand: [
      { fishType: FishType.TILAPIA, quantity: 400, pricePerKg: 180 },
      { fishType: FishType.POMFRET, quantity: 200, pricePerKg: 350 },
      { fishType: FishType.MACKEREL, quantity: 300, pricePerKg: 220 }
    ]
  },
  {
    id: 'market-2',
    name: 'Mumbai Seafood Hub',
    location: { lat: 19.0760, lng: 72.8777 },
    maxDeliveryTime: 18,
    demand: [
      { fishType: FishType.SARDINE, quantity: 600, pricePerKg: 150 },
      { fishType: FishType.TUNA, quantity: 100, pricePerKg: 500 },
      { fishType: FishType.MACKEREL, quantity: 350, pricePerKg: 200 }
    ]
  }
];

export const spoilageProfiles: SpoilageProfile[] = [
  { fishType: FishType.TILAPIA, unrefrigeratedHours: 12, refrigeratedHours: 36 },
  { fishType: FishType.MACKEREL, unrefrigeratedHours: 10, refrigeratedHours: 30 },
  { fishType: FishType.POMFRET, unrefrigeratedHours: 14, refrigeratedHours: 40 },
  { fishType: FishType.SARDINE, unrefrigeratedHours: 8, refrigeratedHours: 24 },
  { fishType: FishType.TUNA, unrefrigeratedHours: 16, refrigeratedHours: 48 }
];
