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
import { MapPin, Truck, Calculator, TrendingUp, AlertTriangle, Loader2, Play } from 'lucide-react';
import DataSourceIndicator from '@/components/DataSourceIndicator';
import MapboxMap from '@/components/MapboxMap';
import AIChat from '@/components/AIChat';
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
  
  const [optimization, setOptimization] = useState({
    port_id: '',
    fish_type: '' as FishType | '',
    volume_kg: '',
    use_cold_storage: false,
    max_distance: '1000'
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
          max_distance: parseInt(optimization.max_distance)
        }
      });

      if (error) {
        console.error('Optimization error:', error);
        throw error;
      }

      console.log('Optimization result:', data);

      // Format the results to match the expected structure
      const formattedResults = Array.isArray(data) ? data : [data];
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
          route_data: data as any
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

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getSpoilageBadgeColor = (spoilage: number) => {
    if (spoilage < 5) return "bg-green-100 text-green-800";
    if (spoilage < 15) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Supply Chain Route Optimization
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered logistics planning for maximum profit and minimum spoilage
          </p>
          <DataSourceIndicator 
            dataSources={[{
              name: 'Route Optimization',
              type: 'calculated',
              description: 'Route optimization using real port, market, and truck data',
              source: 'Custom optimization algorithm',
              lastUpdated: 'Real-time calculation'
            }]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span>Optimization Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      Run Optimization
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => setShowAIChat(true)}
                  variant="outline"
                >
                  AI Assistant
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
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
                  {/* Summary Cards */}
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
                  </div>

                  {/* Route Details */}
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">Route #{index + 1}</h4>
                          <p className="text-sm text-gray-600">{result.route}</p>
                        </div>
                        <Badge className={getSpoilageBadgeColor(result.spoilage || 0)}>
                          {(result.spoilage || 0).toFixed(1)}% spoilage
                        </Badge>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Run optimization to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map Visualization */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Route Visualization</CardTitle>
              <DataSourceIndicator 
                dataType="real" 
                description="Interactive map showing optimized routes"
                details="Real geographic data with calculated optimal paths"
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

      {/* AI Chat Modal */}
      <AIChat 
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        context={{
          results,
          selectedResult: results[0],
          formData: optimization
        }}
      />
    </div>
  );
};

export default Optimization;
