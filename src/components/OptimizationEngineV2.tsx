
import { supabase } from '@/integrations/supabase/client';

interface OptimizationParams {
  portId: string;
  fishType: string;
  volume: number;
  selectedTrucks?: string[];
  useColdStorage?: boolean;
}

interface OptimizationResult {
  id: string;
  route: {
    source: any;
    coldStorage?: any;
    destination: any;
  };
  fishType: string;
  volume: number;
  truck: any;
  distance: number;
  travelTime: number;
  spoilagePercentage: number;
  revenue: number;
  totalCost: number;
  netProfit: number;
  recommendations: string[];
}

export class OptimizationEngineV2 {
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

  private calculateSpoilage(fishType: string, travelTime: number, isRefrigerated: boolean, temperature: number = 25): number {
    const spoilageRates: Record<string, { unrefrigerated: number; refrigerated: number }> = {
      'tilapia': { unrefrigerated: 0.0417, refrigerated: 0.0139 },
      'pomfret': { unrefrigerated: 0.0357, refrigerated: 0.0125 },
      'mackerel': { unrefrigerated: 0.0500, refrigerated: 0.0167 },
      'sardine': { unrefrigerated: 0.0625, refrigerated: 0.0208 },
      'tuna': { unrefrigerated: 0.0313, refrigerated: 0.0104 },
    };

    const rates = spoilageRates[fishType.toLowerCase()] || spoilageRates['tilapia'];
    const baseRate = isRefrigerated ? rates.refrigerated : rates.unrefrigerated;
    
    // Temperature adjustment (higher temperature increases spoilage)
    const tempFactor = temperature > 25 ? 1 + ((temperature - 25) * 0.05) : 1;
    
    return Math.min(baseRate * travelTime * tempFactor * 100, 100);
  }

  async optimize(params: OptimizationParams): Promise<OptimizationResult[]> {
    try {
      // Fetch all required data
      const [
        { data: ports },
        { data: markets },
        { data: trucks },
        { data: coldStorage },
        { data: marketDemand },
      ] = await Promise.all([
        supabase.from('ports').select('*').eq('active', true),
        supabase.from('markets').select('*').eq('active', true),
        supabase.from('trucks').select('*').eq('available', true),
        supabase.from('cold_storage').select('*').eq('active', true),
        supabase.from('market_demand').select('*, markets(*)').eq('fish_type', params.fishType as any).gte('demand_date', new Date().toISOString().split('T')[0]),
      ]);

      if (!ports || !markets || !trucks || !coldStorage || !marketDemand) {
        throw new Error('Failed to fetch required data');
      }

      const sourcePort = ports.find(p => p.id === params.portId);
      if (!sourcePort) {
        throw new Error('Source port not found');
      }

      const results: OptimizationResult[] = [];

      // Filter trucks based on selection and capacity
      const availableTrucks = trucks.filter(truck => 
        truck.capacity_kg >= params.volume &&
        (!params.selectedTrucks || params.selectedTrucks.includes(truck.id))
      );

      // Calculate routes for each market with demand
      for (const demand of marketDemand) {
        if (!demand.markets) continue;
        
        const market = demand.markets;
        const volume = Math.min(params.volume, demand.quantity_kg);
        
        // Calculate direct route (without cold storage)
        const directDistance = this.calculateDistance(
          { lat: sourcePort.location_lat, lng: sourcePort.location_lng },
          { lat: market.location_lat, lng: market.location_lng }
        );

        for (const truck of availableTrucks) {
          // Check if truck can handle the distance
          if (directDistance > truck.max_distance_km) continue;

          const travelTime = directDistance / 60; // Assuming 60 km/hr average speed
          const isRefrigerated = truck.truck_type === 'refrigerated';
          
          // Calculate spoilage
          const spoilagePercentage = this.calculateSpoilage(
            params.fishType,
            travelTime,
            isRefrigerated
          );

          // Calculate financials
          const freshWeight = volume * (1 - spoilagePercentage / 100);
          const revenue = freshWeight * demand.price_per_kg;
          const transportCost = directDistance * truck.cost_per_km;
          const spoilageCost = (volume - freshWeight) * demand.price_per_kg;
          const totalCost = transportCost + spoilageCost;
          const netProfit = revenue - totalCost;

          // Generate recommendations
          const recommendations = this.generateRecommendations({
            spoilagePercentage,
            isRefrigerated,
            fishType: params.fishType,
            travelTime,
            netProfit,
          });

          results.push({
            id: `${sourcePort.id}-${market.id}-${truck.id}`,
            route: {
              source: sourcePort,
              destination: market,
            },
            fishType: params.fishType,
            volume,
            truck,
            distance: directDistance,
            travelTime,
            spoilagePercentage,
            revenue,
            totalCost,
            netProfit,
            recommendations,
          });

          // If cold storage is requested, calculate routes with cold storage
          if (params.useColdStorage) {
            for (const storage of coldStorage) {
              const distanceToStorage = this.calculateDistance(
                { lat: sourcePort.location_lat, lng: sourcePort.location_lng },
                { lat: storage.location_lat, lng: storage.location_lng }
              );
              
              const distanceFromStorage = this.calculateDistance(
                { lat: storage.location_lat, lng: storage.location_lng },
                { lat: market.location_lat, lng: market.location_lng }
              );

              const totalDistance = distanceToStorage + distanceFromStorage;
              
              if (totalDistance > truck.max_distance_km) continue;

              const totalTravelTime = totalDistance / 60;
              const storageTime = 2; // Assume 2 hours storage time
              
              // Spoilage calculation with cold storage
              const spoilageToStorage = this.calculateSpoilage(params.fishType, distanceToStorage / 60, isRefrigerated);
              const spoilageFromStorage = this.calculateSpoilage(params.fishType, distanceFromStorage / 60, true); // Storage is always refrigerated
              const totalSpoilagePercentage = Math.min(spoilageToStorage + spoilageFromStorage, 100);

              // Calculate costs with storage
              const storageCost = storageTime * storage.cost_per_hour;
              const freshWeightWithStorage = volume * (1 - totalSpoilagePercentage / 100);
              const revenueWithStorage = freshWeightWithStorage * demand.price_per_kg;
              const transportCostWithStorage = totalDistance * truck.cost_per_km;
              const spoilageCostWithStorage = (volume - freshWeightWithStorage) * demand.price_per_kg;
              const totalCostWithStorage = transportCostWithStorage + spoilageCostWithStorage + storageCost;
              const netProfitWithStorage = revenueWithStorage - totalCostWithStorage;

              const recommendationsWithStorage = this.generateRecommendations({
                spoilagePercentage: totalSpoilagePercentage,
                isRefrigerated: true,
                fishType: params.fishType,
                travelTime: totalTravelTime,
                netProfit: netProfitWithStorage,
                hasColdStorage: true,
              });

              results.push({
                id: `${sourcePort.id}-${storage.id}-${market.id}-${truck.id}`,
                route: {
                  source: sourcePort,
                  coldStorage: storage,
                  destination: market,
                },
                fishType: params.fishType,
                volume,
                truck,
                distance: totalDistance,
                travelTime: totalTravelTime,
                spoilagePercentage: totalSpoilagePercentage,
                revenue: revenueWithStorage,
                totalCost: totalCostWithStorage,
                netProfit: netProfitWithStorage,
                recommendations: recommendationsWithStorage,
              });
            }
          }
        }
      }

      // Sort by net profit descending
      return results.sort((a, b) => b.netProfit - a.netProfit);
    } catch (error) {
      console.error('Optimization error:', error);
      throw error;
    }
  }

  private generateRecommendations(params: {
    spoilagePercentage: number;
    isRefrigerated: boolean;
    fishType: string;
    travelTime: number;
    netProfit: number;
    hasColdStorage?: boolean;
  }): string[] {
    const recommendations: string[] = [];

    if (params.spoilagePercentage > 15) {
      recommendations.push('High spoilage risk! Consider using refrigerated transport or adding cold storage.');
    } else if (params.spoilagePercentage > 5 && !params.isRefrigerated) {
      recommendations.push('Medium spoilage risk. Refrigerated transport recommended for better margins.');
    }

    if (params.travelTime > 12 && !params.hasColdStorage) {
      recommendations.push('Long journey detected. Consider intermediate cold storage to maintain quality.');
    }

    if (params.fishType === 'mackerel' || params.fishType === 'sardine') {
      recommendations.push('This fish type spoils quickly. Prioritize speed and refrigeration.');
    }

    if (params.netProfit < 0) {
      recommendations.push('Negative profit margin. Consider alternative markets or reduce transport costs.');
    } else if (params.netProfit > 50000) {
      recommendations.push('Excellent profit opportunity! Consider increasing volume if possible.');
    }

    if (!params.isRefrigerated && (params.fishType === 'pomfret' || params.fishType === 'tuna')) {
      recommendations.push('Premium fish detected. Refrigerated transport will preserve value better.');
    }

    return recommendations;
  }

  async saveOptimizationResult(result: OptimizationResult, userId: string): Promise<void> {
    try {
      await supabase.from('optimization_results').insert({
        port_id: result.route.source.id,
        market_id: result.route.destination.id,
        cold_storage_id: result.route.coldStorage?.id || null,
        truck_id: result.truck.id,
        fish_type: result.fishType as any,
        volume_kg: result.volume,
        distance_km: result.distance,
        travel_time_hours: result.travelTime,
        spoilage_percentage: result.spoilagePercentage,
        revenue: result.revenue,
        total_cost: result.totalCost,
        net_profit: result.netProfit,
        route_data: result,
        user_id: userId,
      });
    } catch (error) {
      console.error('Failed to save optimization result:', error);
      throw error;
    }
  }
}
