
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { port_id, fish_type, volume_kg, use_cold_storage, max_distance } = await req.json()

    console.log('Optimization request:', { port_id, fish_type, volume_kg, use_cold_storage, max_distance })

    // Fetch all necessary data
    const [
      { data: ports },
      { data: markets },
      { data: trucks },
      { data: coldStorage },
      { data: spoilageProfiles },
      { data: marketDemand }
    ] = await Promise.all([
      supabaseClient.from('ports').select('*').eq('active', true),
      supabaseClient.from('markets').select('*').eq('active', true),
      supabaseClient.from('trucks').select('*').eq('available', true),
      supabaseClient.from('cold_storage').select('*').eq('active', true),
      supabaseClient.from('spoilage_profiles').select('*'),
      supabaseClient.from('market_demand').select('*, markets(*)').eq('fish_type', fish_type).eq('demand_date', new Date().toISOString().split('T')[0])
    ])

    if (!ports || !markets || !trucks || !marketDemand) {
      throw new Error('Failed to fetch required data')
    }

    const sourcePort = ports.find(p => p.id === port_id)
    if (!sourcePort) {
      throw new Error('Source port not found')
    }

    const spoilageProfile = spoilageProfiles?.find(s => s.fish_type === fish_type)
    if (!spoilageProfile) {
      throw new Error('Spoilage profile not found for fish type')
    }

    // Find viable routes
    const viableRoutes = []
    
    for (const demand of marketDemand) {
      if (!demand.markets) continue
      
      const market = demand.markets
      const availableTrucks = trucks.filter(t => t.capacity_kg >= volume_kg)
      
      for (const truck of availableTrucks) {
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          sourcePort.location_lat, sourcePort.location_lng,
          market.location_lat, market.location_lng
        )
        
        if (distance > Math.min(truck.max_distance_km, max_distance)) continue
        
        // Calculate travel time (assuming average speed of 50 km/hr)
        const travelTime = distance / 50
        
        // Calculate spoilage based on truck type and travel time
        const maxHours = truck.truck_type === 'refrigerated' 
          ? spoilageProfile.refrigerated_hours 
          : spoilageProfile.unrefrigerated_hours
        
        let spoilageRate = Math.min((travelTime / maxHours) * spoilageProfile.spoilage_rate_per_hour, 0.95)
        
        // Cold storage benefit
        if (use_cold_storage && coldStorage && coldStorage.length > 0) {
          spoilageRate = Math.max(spoilageRate - 0.05, 0.02) // 5% reduction, minimum 2%
        }
        
        const spoilagePercentage = spoilageRate * 100
        const freshWeight = volume_kg * (1 - spoilageRate)
        const revenue = freshWeight * demand.price_per_kg
        const transportCost = distance * truck.cost_per_km
        const spoilageCost = (volume_kg - freshWeight) * demand.price_per_kg * 0.5 // Loss cost
        let coldStorageCost = 0
        
        if (use_cold_storage && coldStorage && coldStorage.length > 0) {
          coldStorageCost = travelTime * coldStorage[0].cost_per_hour
        }
        
        const totalCost = transportCost + spoilageCost + coldStorageCost
        const netProfit = revenue - totalCost
        
        viableRoutes.push({
          market_id: market.id,
          cold_storage_id: use_cold_storage && coldStorage?.length > 0 ? coldStorage[0].id : null,
          truck_id: truck.id,
          distance,
          time: travelTime,
          spoilage: spoilagePercentage,
          revenue,
          cost: totalCost,
          profit: netProfit,
          route: `${sourcePort.name} → ${market.name}`,
          truck: truck,
          market: market
        })
      }
    }

    // Sort by profit and return the best option
    viableRoutes.sort((a, b) => b.profit - a.profit)
    const bestRoute = viableRoutes[0]

    if (!bestRoute) {
      throw new Error('No viable routes found')
    }

    console.log('Best route found:', bestRoute)

    return new Response(
      JSON.stringify(bestRoute),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    console.error('Optimization error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  }
})

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
