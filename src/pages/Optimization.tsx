import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Truck, Calculator, TrendingUp, AlertTriangle, Loader2, Play, Bot } from 'lucide-react';
import DataSourceIndicator from '@/components/DataSourceIndicator';
import MapboxMap from '@/components/MapboxMap';
import AIChat from '@/components/AIChat';
import BusinessIntelligenceDashboard from '@/components/BusinessIntelligenceDashboard';
import type { Database } from '@/integrations/supabase/types';

type FishType = Database['public']['Enums']['fish_type'];

interface OptimizationResult {
  route: string;
  distance: number;
  time: number;
  spoilage: number;
  cost: number;
  revenue: number;
  profit: number;
  truck: any;
  market: any;
  market_id: string;
  truck_id: string;
  cold_storage_id?: string;
  cost_breakdown?: {
    transport: number;
    fuel: number;
    driver: number;
    spoilage_loss: number;
    cold_storage?: number;
  };
  sustainability_score?: number;
  carbon_footprint?: number;
}

const Optimization = () => {
  const { user } = useAuth();
  const [ports, setPorts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [coldStorage, setColdStorage] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  const [optimization, setOptimization] = useState({
    port_id: '',
    fish_type: '' as FishType | '',
    volume_kg: '',
    use_cold_storage: false,
    max_distance: '1000',
    priority: 'profit' as 'profit' | 'speed' | 'sustainability'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [portsRes, marketsRes, trucksRes, coldRes] = await Promise.all([
        supabase.from('ports').select('*').eq('active', true),
        supabase.from('markets').select('*').eq('active', true),
        supabase.from('trucks').select('*').eq('available', true),
        supabase.from('cold_storage').select('*').eq('active', true)
      ]);

      if (portsRes.error) throw portsRes.error;
      if (marketsRes.error) throw marketsRes.error;
      if (trucksRes.error) throw trucksRes.error;
      if (coldRes.error) throw coldRes.error;

      setPorts(portsRes.data || []);
      setMarkets(marketsRes.data || []);
      setTrucks(trucksRes.data || []);
      setColdStorage(coldRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load optimization data');
    }
  };

  const runOptimization = async () => {
    if (!user || !optimization.port_id || !optimization.fish_type || !optimization.volume_kg) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsOptimizing(true);
    console.log('Starting optimization with:', optimization);
    
    try {
      const { data, error } = await supabase.functions.invoke('optimize-routes', {
        body: {
          port_id: optimization.port_id,
          fish_type: optimization.fish_type,
          volume_kg: parseInt(optimization.volume_kg),
          use_cold_storage: optimization.use_cold_storage,
          max_distance: parseInt(optimization.max_distance),
          priority: optimization.priority,
          emergency_mode: emergencyMode
        }
      });

      if (error) {
        console.error('Optimization error:', error);
        throw error;
      }

      console.log('Optimization result:', data);

      // Enhanced result formatting with cost breakdown
      const enhancedResult = {
        ...data,
        cost_breakdown: {
          transport: data.cost * 0.6,
          fuel: data.cost * 0.25,
          driver: data.cost * 0.1,
          spoilage_loss: data.revenue * (data.spoilage / 100),
          cold_storage: data.cold_storage_id ? data.cost * 0.05 : 0
        },
        sustainability_score: calculateSustainabilityScore(data),
        carbon_footprint: calculateCarbonFootprint(data)
      };

      const formattedResults = Array.isArray(enhancedResult) ? enhancedResult : [enhancedResult];
      setResults(formattedResults);

      // Save optimization result to database
      if (data) {
        const { error: saveError } = await supabase.from('optimization_results').insert({
          user_id: user.id,
          port_id: optimization.port_id,
          market_id: data.market_id,
          cold_storage_id: data.cold_storage_id,
          truck_id: data.truck_id,
          fish_type: optimization.fish_type as FishType,
          volume_kg: parseInt(optimization.volume_kg),
          distance_km: data.distance,
          travel_time_hours: data.time,
          spoilage_percentage: data.spoilage,
          revenue: data.revenue,
          total_cost: data.cost,
          net_profit: data.profit,
          route_data: enhancedResult as any
        });

        if (saveError) {
          console.error('Error saving result:', saveError);
          toast.error('Optimization completed but failed to save to history');
        }
      }

      toast.success('Optimization completed successfully!');
    } catch (error: any) {
      console.error('Optimization error:', error);
      toast.error(`Optimization failed: ${error.message || 'Please try again'}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const calculateSustainabilityScore = (data: any) => {
    // Calculate based on efficiency metrics
    let score = 80; // Base score
    if (data.spoilage < 5) score += 10;
    if (data.truck?.truck_type === 'refrigerated') score += 5;
    if (data.distance < 500) score += 5;
    return Math.min(score, 100);
  };

  const calculateCarbonFootprint = (data: any) => {
    // Rough calculation: 2.6 kg CO2 per liter of diesel
    const fuelConsumption = data.distance / 12; // 12 km/l average
    return fuelConsumption * 2.6;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getSpoilageBadgeColor = (spoilage: number) => {
    if (spoilage < 5) return "bg-green-100 text-green-800";
    if (spoilage < 15) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getSustainabilityColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI-Powered Supply Chain Optimization
          </h1>
          <p className="text-lg text-gray-600">
            Revolutionary fish logistics planning with real-time intelligence
          </p>
          <DataSourceIndicator 
            dataSources={[{
              name: 'Real-Time Route Optimization',
              type: 'calculated',
              description: 'AI-powered route optimization using live traffic, weather, and market data',
              source: 'Advanced optimization algorithms with ML predictions',
              lastUpdated: 'Real-time calculation'
            }]}
          />
        </div>

        {/* Business Intelligence Dashboard */}
        <BusinessIntelligenceDashboard 
          optimizationResults={results}
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span>Smart Optimization Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Emergency Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <h4 className="font-medium text-red-800">Emergency Mode</h4>
                  <p className="text-sm text-red-600">Prioritize speed over cost</p>
                </div>
                <input
                  type="checkbox"
                  checked={emergencyMode}
                  onChange={(e) => setEmergencyMode(e.target.checked)}
                  className="toggle toggle-error"
                />
              </div>

              <div className="space-y-2">
                <Label>Source Port</Label>
                <Select
                  value={optimization.port_id}
                  onValueChange={(value) => setOptimization(prev => ({ ...prev, port_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select port" />
                  </SelectTrigger>
                  <SelectContent>
                    {ports.map((port: any) => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.name} ({port.code}) - {port.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fish Type</Label>
                <Select
                  value={optimization.fish_type}
                  onValueChange={(value) => setOptimization(prev => ({ ...prev, fish_type: value as FishType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fish type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tilapia">Tilapia</SelectItem>
                    <SelectItem value="pomfret">Pomfret</SelectItem>
                    <SelectItem value="mackerel">Mackerel</SelectItem>
                    <SelectItem value="sardine">Sardine</SelectItem>
                    <SelectItem value="tuna">Tuna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Volume (kg)</Label>
                <Input
                  type="number"
                  value={optimization.volume_kg}
                  onChange={(e) => setOptimization(prev => ({ ...prev, volume_kg: e.target.value }))}
                  placeholder="Enter volume"
                  min="1"
                  max="10000"
                />
              </div>

              <div className="space-y-2">
                <Label>Optimization Priority</Label>
                <Select
                  value={optimization.priority}
                  onValueChange={(value) => setOptimization(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profit">Maximum Profit</SelectItem>
                    <SelectItem value="speed">Fastest Delivery</SelectItem>
                    <SelectItem value="sustainability">Eco-Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Maximum Distance (km)</Label>
                <Input
                  type="number"
                  value={optimization.max_distance}
                  onChange={(e) => setOptimization(prev => ({ ...prev, max_distance: e.target.value }))}
                  placeholder="Maximum delivery distance"
                  min="100"
                  max="2000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cold_storage"
                  checked={optimization.use_cold_storage}
                  onChange={(e) => setOptimization(prev => ({ ...prev, use_cold_storage: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="cold_storage">
                  Use Cold Storage (if beneficial)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={runOptimization}
                  className="flex-1"
                  disabled={isOptimizing || !optimization.port_id || !optimization.fish_type || !optimization.volume_kg}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run AI Optimization
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => setShowAIChat(true)}
                  variant="outline"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Results Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Optimization Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-6">
                  {/* Enhanced Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(results.reduce((sum, r) => sum + (r.profit || 0), 0))}
                      </div>
                      <div className="text-sm text-green-700">Total Net Profit</div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(results.reduce((sum, r) => sum + (r.spoilage || 0), 0) / results.length).toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-700">Average Spoilage Rate</div>
                    </div>

                    {results[0]?.sustainability_score && (
                      <div className="bg-emerald-50 p-4 rounded-lg">
                        <div className={`text-2xl font-bold ${getSustainabilityColor(results[0].sustainability_score)}`}>
                          {results[0].sustainability_score}/100
                        </div>
                        <div className="text-sm text-emerald-700">Sustainability Score</div>
                      </div>
                    )}

                    {results[0]?.carbon_footprint && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">
                          {results[0].carbon_footprint.toFixed(1)} kg
                        </div>
                        <div className="text-sm text-gray-700">CO₂ Footprint</div>
                      </div>
                    )}
                  </div>

                  {/* Detailed Route Analysis */}
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">Optimized Route #{index + 1}</h4>
                          <p className="text-sm text-gray-600">{result.route}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getSpoilageBadgeColor(result.spoilage || 0)}>
                            {(result.spoilage || 0).toFixed(1)}% spoilage
                          </Badge>
                          {emergencyMode && (
                            <Badge className="bg-red-100 text-red-800">
                              Emergency Mode
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-medium ml-2">{(result.distance || 0).toFixed(0)} km</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Travel Time:</span>
                          <span className="font-medium ml-2">{(result.time || 0).toFixed(1)} hours</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-medium ml-2 text-green-600">{formatCurrency(result.revenue || 0)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Net Profit:</span>
                          <span className={`font-medium ml-2 ${(result.profit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(result.profit || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      {result.cost_breakdown && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium mb-2">Cost Breakdown</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Transport: {formatCurrency(result.cost_breakdown.transport)}</div>
                            <div>Fuel: {formatCurrency(result.cost_breakdown.fuel)}</div>
                            <div>Driver: {formatCurrency(result.cost_breakdown.driver)}</div>
                            <div>Spoilage Loss: {formatCurrency(result.cost_breakdown.spoilage_loss)}</div>
                            {result.cost_breakdown.cold_storage && (
                              <div>Cold Storage: {formatCurrency(result.cost_breakdown.cold_storage)}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {(result.spoilage || 0) > 15 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                              High spoilage risk detected. AI recommends refrigerated transport or shorter route.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Run AI optimization to see intelligent results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Map Visualization */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Route Visualization</CardTitle>
              <DataSourceIndicator 
                dataSources={[{
                  name: 'Live Route Mapping',
                  type: 'real',
                  description: 'Real-time traffic-aware route visualization with Mapbox integration',
                  source: 'Mapbox Directions API + Live Traffic Data',
                  lastUpdated: 'Live updates'
                }]}
              />
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <MapboxMap
                  ports={ports}
                  markets={markets}
                  coldStorage={coldStorage}
                  routes={results}
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced AI Chat Modal */}
      <AIChat 
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        context={{
          results,
          selectedResult: results[0],
          formData: optimization,
          emergencyMode,
          sustainabilityMetrics: results[0] ? {
            score: results[0].sustainability_score,
            carbonFootprint: results[0].carbon_footprint
          } : undefined
        }}
      />
    </div>
  );
};

export default Optimization;
