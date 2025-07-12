
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

    const { portId, fishType, volume, useColdStorage } = await req.json()

    // Fetch optimization data
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
      supabaseClient.from('market_demand').select('*, markets(*)').eq('fish_type', fishType)
    ])

    // Advanced optimization logic would go here
    // This is a simplified example
    const results = []
    const sourcePort = ports?.find(p => p.id === portId)
    
    if (sourcePort && marketDemand) {
      for (const demand of marketDemand) {
        if (!demand.markets || !trucks) continue
        
        const market = demand.markets
        const availableTrucks = trucks.filter(t => t.capacity_kg >= volume)
        
        for (const truck of availableTrucks) {
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            sourcePort.location_lat, sourcePort.location_lng,
            market.location_lat, market.location_lng
          )
          
          if (distance > truck.max_distance_km) continue
          
          const travelTime = distance / 60 // Assuming 60 km/hr
          const spoilageProfile = spoilageProfiles?.find(s => s.fish_type === fishType)
          
          let spoilageRate = 0.05 // Default 5% spoilage
          if (spoilageProfile) {
            const maxHours = truck.truck_type === 'refrigerated' 
              ? spoilageProfile.refrigerated_hours 
              : spoilageProfile.unrefrigerated_hours
            spoilageRate = Math.min(travelTime / maxHours, 1)
          }
          
          const spoilagePercentage = spoilageRate * 100
          const freshWeight = volume * (1 - spoilageRate)
          const revenue = freshWeight * demand.price_per_kg
          const transportCost = distance * truck.cost_per_km
          const spoilageCost = (volume - freshWeight) * demand.price_per_kg
          const totalCost = transportCost + spoilageCost
          const netProfit = revenue - totalCost
          
          results.push({
            route: {
              source: sourcePort,
              destination: market
            },
            truck,
            distance,
            travelTime,
            spoilagePercentage,
            revenue,
            totalCost,
            netProfit,
            volume,
            fishType
          })
        }
      }
    }

    // Sort by net profit
    results.sort((a, b) => b.netProfit - a.netProfit)

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
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
