
import { Port, Truck, ColdStorage, Market, FishType, OptimizationResult, SpoilageProfile } from '../types';
import { spoilageProfiles } from '../data/mockData';

export class OptimizationEngine {
  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateSpoilage(
    fishType: FishType, 
    travelTime: number, 
    isRefrigerated: boolean
  ): number {
    const profile = spoilageProfiles.find(p => p.fishType === fishType);
    if (!profile) return 0;

    const maxHours = isRefrigerated ? profile.refrigeratedHours : profile.unrefrigeratedHours;
    const spoilageRate = Math.min(travelTime / maxHours, 1);
    return spoilageRate * 100; // Return as percentage
  }

  private findBestTruck(
    trucks: Truck[], 
    volume: number, 
    distance: number,
    fishType: FishType,
    travelTime: number
  ): Truck | null {
    const availableTrucks = trucks.filter(t => 
      t.available && 
      t.capacity >= volume && 
      t.maxDistance >= distance
    );

    if (availableTrucks.length === 0) return null;

    // Sort by efficiency: consider spoilage reduction vs cost
    return availableTrucks.reduce((best, current) => {
      const currentSpoilage = this.calculateSpoilage(fishType, travelTime, current.type === 'Refrigerated');
      const bestSpoilage = this.calculateSpoilage(fishType, travelTime, best.type === 'Refrigerated');
      
      const currentCost = current.costPerKm * distance;
      const bestCost = best.costPerKm * distance;
      
      // Simple scoring: lower spoilage is heavily weighted
      const currentScore = currentCost + (currentSpoilage * 100);
      const bestScore = bestCost + (bestSpoilage * 100);
      
      return currentScore < bestScore ? current : best;
    });
  }

  optimize(
    ports: Port[],
    trucks: Truck[],
    coldStorages: ColdStorage[],
    markets: Market[]
  ): OptimizationResult[] {
    const results: OptimizationResult[] = [];

    ports.forEach(port => {
      port.availableFish.forEach(fishCatch => {
        // Find markets demanding this fish type
        const demandingMarkets = markets.filter(market =>
          market.demand.some(d => d.fishType === fishCatch.type)
        );

        demandingMarkets.forEach(market => {
          const marketDemand = market.demand.find(d => d.fishType === fishCatch.type);
          if (!marketDemand) return;

          const volume = Math.min(fishCatch.volume, marketDemand.quantity);
          const distance = this.calculateDistance(port.location, market.location);
          const travelTime = distance / 60; // Assuming 60 km/hr average speed

          // Check if delivery time is acceptable
          if (travelTime > market.maxDeliveryTime) return;

          const bestTruck = this.findBestTruck(trucks, volume, distance, fishCatch.type, travelTime);
          if (!bestTruck) return;

          const spoilagePercentage = this.calculateSpoilage(
            fishCatch.type, 
            travelTime, 
            bestTruck.type === 'Refrigerated'
          );

          const freshWeight = volume * (1 - spoilagePercentage / 100);
          const revenue = freshWeight * marketDemand.pricePerKg;
          const transportCost = distance * bestTruck.costPerKm;
          const spoilageCost = (volume - freshWeight) * marketDemand.pricePerKg;
          const totalCost = transportCost + spoilageCost;
          const netProfit = revenue - totalCost;

          results.push({
            route: {
              source: port,
              destination: market
            },
            fishType: fishCatch.type,
            volume,
            truck: bestTruck,
            distance,
            travelTime,
            spoilagePercentage,
            revenue,
            totalCost,
            netProfit
          });
        });
      });
    });

    // Sort by net profit descending
    return results.sort((a, b) => b.netProfit - a.netProfit);
  }
}
