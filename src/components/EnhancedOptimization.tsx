
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Truck, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';

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
}

const EnhancedOptimization = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [ports, setPorts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [coldStorage, setColdStorage] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  
  const [optimization, setOptimization] = useState({
    port_id: '',
    fish_type: '',
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

      if (error) throw error;

      // Save optimization result
      await supabase.from('optimization_results').insert({
        user_id: user.id,
        port_id: optimization.port_id,
        market_id: data.market_id,
        cold_storage_id: data.cold_storage_id,
        truck_id: data.truck_id,
        fish_type: optimization.fish_type,
        volume_kg: parseInt(optimization.volume_kg),
        distance_km: data.distance,
        travel_time_hours: data.time,
        spoilage_percentage: data.spoilage,
        revenue: data.revenue,
        total_cost: data.cost,
        net_profit: data.profit,
        route_data: data
      });

      setResult(data);
      toast.success('Optimization completed successfully!');
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Route Optimization</h1>
        <p className="text-gray-600">Find the optimal delivery route for maximum profit</p>
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
                      {port.name} ({port.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fish Type</Label>
              <Select
                value={optimization.fish_type}
                onValueChange={(value) => setOptimization(prev => ({ ...prev, fish_type: value }))}
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
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Distance (km)</Label>
              <Input
                type="number"
                value={optimization.max_distance}
                onChange={(e) => setOptimization(prev => ({ ...prev, max_distance: e.target.value }))}
                placeholder="Maximum delivery distance"
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
              <Label htmlFor="cold_storage">Use Cold Storage (if beneficial)</Label>
            </div>

            <Button 
              onClick={runOptimization}
              className="w-full"
              disabled={isOptimizing || !optimization.port_id || !optimization.fish_type}
            >
              {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
            </Button>
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
            {result ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{result.profit.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700">Net Profit</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.spoilage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-700">Spoilage Rate</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{result.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Travel Time:</span>
                    <span className="font-medium">{result.time.toFixed(1)} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium">₹{result.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium">₹{result.cost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Recommended Route:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{result.route}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        {result.truck?.license_plate} ({result.truck?.truck_type})
                      </span>
                    </div>
                  </div>
                </div>

                {result.spoilage > 15 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        High spoilage risk. Consider using refrigerated transport or cold storage.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Run optimization to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedOptimization;
