import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CSVLink } from 'react-csv';
import MapboxMap from './MapboxMap';
import {
  Play,
  TrendingUp,
  AlertTriangle,
  Download,
  Target,
  Zap,
  BarChart3,
  MapPin,
  Clock,
  DollarSign,
  Thermometer
} from 'lucide-react';
import { toast } from 'sonner';

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
  efficiency: number;
}

const EnhancedOptimization = () => {
  const { user } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<'profit' | 'spoilage'>('profit');
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<OptimizationResult | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Form state
  const [formData, setFormData] = useState({
    portIds: [] as string[],
    fishTypes: ['tilapia'] as string[],
    volume: 1000,
    maxDistance: 1000,
    useColdStorage: false,
    weatherAdjustment: true,
    multiMarket: true,
  });

  // Data state
  const [ports, setPorts] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [coldStorage, setColdStorage] = useState<any[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [
        { data: portsData },
        { data: trucksData },
        { data: marketsData },
        { data: coldStorageData },
      ] = await Promise.all([
        supabase.from('ports').select('*').eq('active', true),
        supabase.from('trucks').select('*').eq('available', true),
        supabase.from('markets').select('*').eq('active', true),
        supabase.from('cold_storage').select('*').eq('active', true),
      ]);

      setPorts(portsData || []);
      setTrucks(trucksData || []);
      setMarkets(marketsData || []);
      setColdStorage(coldStorageData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load initial data');
    }
  };

  const runOptimization = async () => {
    if (formData.portIds.length === 0) {
      toast.error('Please select at least one port');
      return;
    }

    setIsOptimizing(true);
    toast.info('Running advanced optimization algorithm...');

    try {
      // Simulate advanced optimization logic
      await new Promise(resolve => setTimeout(resolve, 3000));

      const optimizedResults = await generateOptimizationResults();
      setResults(optimizedResults);
      
      if (optimizedResults.length > 0) {
        setSelectedResult(optimizedResults[0]);
        toast.success(`Found ${optimizedResults.length} optimized routes!`);
      } else {
        toast.warning('No viable routes found with current parameters');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Optimization failed. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const generateOptimizationResults = async (): Promise<OptimizationResult[]> => {
    const results: OptimizationResult[] = [];
    
    // Get market demand data
    const { data: marketDemand } = await supabase
      .from('market_demand')
      .select('*, markets(*)')
      .in('fish_type', formData.fishTypes as any);

    if (!marketDemand) return [];

    for (const portId of formData.portIds) {
      const port = ports.find(p => p.id === portId);
      if (!port) continue;

      for (const fishType of formData.fishTypes) {
        const relevantDemand = marketDemand.filter(d => d.fish_type === fishType);
        
        for (const demand of relevantDemand) {
          if (!demand.markets) continue;
          
          const market = demand.markets;
          const availableTrucks = trucks.filter(t => t.capacity_kg >= formData.volume);
          
          for (const truck of availableTrucks) {
            const distance = calculateDistance(
              { lat: port.location_lat, lng: port.location_lng },
              { lat: market.location_lat, lng: market.location_lng }
            );
            
            if (distance > formData.maxDistance || distance > truck.max_distance_km) continue;
            
            const travelTime = distance / 60; // Assuming 60 km/hr
            const isRefrigerated = truck.truck_type === 'refrigerated';
            
            // Calculate spoilage with weather adjustment
            let spoilagePercentage = calculateSpoilage(fishType, travelTime, isRefrigerated);
            if (formData.weatherAdjustment) {
              spoilagePercentage *= 1.15; // 15% increase due to weather
            }
            
            // Calculate financials
            const volume = Math.min(formData.volume, demand.quantity_kg);
            const freshWeight = volume * (1 - spoilagePercentage / 100);
            const revenue = freshWeight * demand.price_per_kg;
            const transportCost = distance * truck.cost_per_km;
            const spoilageCost = (volume - freshWeight) * demand.price_per_kg;
            const totalCost = transportCost + spoilageCost;
            const netProfit = revenue - totalCost;
            
            // Calculate efficiency score
            const efficiency = calculateEfficiency(spoilagePercentage, netProfit, distance);
            
            // Generate recommendations
            const recommendations = generateRecommendations({
              spoilagePercentage,
              isRefrigerated,
              fishType,
              travelTime,
              netProfit,
              distance,
            });
            
            results.push({
              id: `${port.id}-${market.id}-${truck.id}`,
              route: {
                source: port,
                destination: market,
              },
              fishType,
              volume,
              truck,
              distance,
              travelTime,
              spoilagePercentage,
              revenue,
              totalCost,
              netProfit,
              recommendations,
              efficiency,
            });
          }
        }
      }
    }
    
    // Sort based on optimization mode
    if (optimizationMode === 'profit') {
      results.sort((a, b) => b.netProfit - a.netProfit);
    } else {
      results.sort((a, b) => a.spoilagePercentage - b.spoilagePercentage);
    }
    
    return results.slice(0, 20); // Return top 20 results
  };

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateSpoilage = (fishType: string, travelTime: number, isRefrigerated: boolean): number => {
    const spoilageRates: Record<string, { unrefrigerated: number; refrigerated: number }> = {
      'tilapia': { unrefrigerated: 0.0417, refrigerated: 0.0139 },
      'pomfret': { unrefrigerated: 0.0357, refrigerated: 0.0125 },
      'mackerel': { unrefrigerated: 0.0500, refrigerated: 0.0167 },
      'sardine': { unrefrigerated: 0.0625, refrigerated: 0.0208 },
      'tuna': { unrefrigerated: 0.0313, refrigerated: 0.0104 },
    };

    const rates = spoilageRates[fishType.toLowerCase()] || spoilageRates['tilapia'];
    const baseRate = isRefrigerated ? rates.refrigerated : rates.unrefrigerated;
    
    return Math.min(baseRate * travelTime * 100, 100);
  };

  const calculateEfficiency = (spoilage: number, profit: number, distance: number): number => {
    const spoilageScore = Math.max(0, 100 - spoilage * 2);
    const profitScore = Math.max(0, Math.min(100, profit / 1000));
    const distanceScore = Math.max(0, 100 - distance / 10);
    
    return (spoilageScore + profitScore + distanceScore) / 3;
  };

  const generateRecommendations = (params: {
    spoilagePercentage: number;
    isRefrigerated: boolean;
    fishType: string;
    travelTime: number;
    netProfit: number;
    distance: number;
  }): string[] => {
    const recommendations: string[] = [];

    if (params.spoilagePercentage > 15) {
      recommendations.push('High spoilage risk! Use refrigerated transport and minimize delays.');
    }
    
    if (params.travelTime > 12) {
      recommendations.push('Long journey detected. Consider intermediate cold storage.');
    }
    
    if (params.netProfit < 0) {
      recommendations.push('Negative profit. Consider alternative markets or reduce costs.');
    }
    
    if (params.fishType === 'mackerel' || params.fishType === 'sardine') {
      recommendations.push('Highly perishable fish. Prioritize speed and refrigeration.');
    }

    return recommendations;
  };

  const getSpoilageBadgeColor = (spoilage: number) => {
    if (spoilage < 5) return "bg-green-100 text-green-800";
    if (spoilage < 15) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getProfitColor = (profit: number) => {
    if (profit > 30000) return "text-green-600";
    if (profit > 0) return "text-blue-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Advanced Route Optimization</h2>
          <p className="text-gray-600">AI-powered multi-parameter optimization engine</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Real-time optimization
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            Weather-adjusted
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Optimization Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Optimization Mode */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Optimization Goal</Label>
              <RadioGroup value={optimizationMode} onValueChange={(value: 'profit' | 'spoilage') => setOptimizationMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="profit" id="profit" />
                  <Label htmlFor="profit" className="text-sm">Maximize Profit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spoilage" id="spoilage" />
                  <Label htmlFor="spoilage" className="text-sm">Minimize Spoilage</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Port Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Source Ports</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {ports.map((port) => (
                  <div key={port.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={port.id}
                      checked={formData.portIds.includes(port.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, portIds: [...prev.portIds, port.id] }));
                        } else {
                          setFormData(prev => ({ ...prev, portIds: prev.portIds.filter(id => id !== port.id) }));
                        }
                      }}
                    />
                    <Label htmlFor={port.id} className="text-sm cursor-pointer">
                      {port.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fish Types */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fish Types</Label>
              <div className="space-y-1">
                {['tilapia', 'pomfret', 'mackerel', 'sardine', 'tuna'].map((fish) => (
                  <div key={fish} className="flex items-center space-x-2">
                    <Checkbox
                      id={fish}
                      checked={formData.fishTypes.includes(fish)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({ ...prev, fishTypes: [...prev.fishTypes, fish] }));
                        } else {
                          setFormData(prev => ({ ...prev, fishTypes: prev.fishTypes.filter(f => f !== fish) }));
                        }
                      }}
                    />
                    <Label htmlFor={fish} className="text-sm cursor-pointer capitalize">
                      {fish}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <Label htmlFor="volume" className="text-sm font-medium">Volume (kg)</Label>
              <Input
                id="volume"
                type="number"
                value={formData.volume}
                onChange={(e) => setFormData(prev => ({ ...prev, volume: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>

            {/* Max Distance */}
            <div className="space-y-2">
              <Label htmlFor="maxDistance" className="text-sm font-medium">Max Distance (km)</Label>
              <Input
                id="maxDistance"
                type="number"
                value={formData.maxDistance}
                onChange={(e) => setFormData(prev => ({ ...prev, maxDistance: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coldStorage"
                  checked={formData.useColdStorage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useColdStorage: !!checked }))}
                />
                <Label htmlFor="coldStorage" className="text-sm">Include cold storage routes</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weather"
                  checked={formData.weatherAdjustment}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, weatherAdjustment: !!checked }))}
                />
                <Label htmlFor="weather" className="text-sm">Weather adjustment</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multiMarket"
                  checked={formData.multiMarket}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, multiMarket: !!checked }))}
                />
                <Label htmlFor="multiMarket" className="text-sm">Multi-market optimization</Label>
              </div>
            </div>

            <Button 
              onClick={runOptimization}
              disabled={isOptimizing || formData.portIds.length === 0}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Optimization
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results and Map */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Route Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <MapboxMap
                  ports={ports}
                  markets={markets}
                  coldStorage={coldStorage}
                  routes={results}
                  className="h-[400px]"
                  onRouteClick={setSelectedResult}
                />
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Optimization Results ({results.length} routes)</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                    >
                      Cards
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      Table
                    </Button>
                    <CSVLink data={results} filename="optimization_results.csv">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </CSVLink>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'cards' ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {results.map((result, index) => (
                      <div
                        key={result.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedResult?.id === result.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedResult(result)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                              #{index + 1}
                            </Badge>
                            <Badge className={getSpoilageBadgeColor(result.spoilagePercentage)}>
                              {result.spoilagePercentage.toFixed(1)}% spoilage
                            </Badge>
                            <Badge variant="secondary">
                              {result.efficiency.toFixed(0)}% efficiency
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getProfitColor(result.netProfit)}`}>
                              ₹{result.netProfit.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((result.netProfit / result.revenue) * 100).toFixed(1)}% margin
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Route
                            </div>
                            <div className="font-medium">
                              {result.route.source.name} → {result.route.destination.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Time
                            </div>
                            <div className="font-medium">{result.travelTime.toFixed(1)} hrs</div>
                          </div>
                          <div>
                            <div className="text-gray-600 flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Revenue
                            </div>
                            <div className="font-medium text-green-600">₹{result.revenue.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Fish Type</div>
                            <div className="font-medium capitalize">{result.fishType} ({result.volume}kg)</div>
                          </div>
                        </div>

                        {result.recommendations.length > 0 && (
                          <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                            <div className="text-xs font-medium text-amber-800 mb-1">AI Recommendations:</div>
                            <div className="text-xs text-amber-700">
                              {result.recommendations[0]}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Fish</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Spoilage</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Efficiency</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result, index) => (
                          <TableRow 
                            key={result.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedResult(result)}
                          >
                            <TableCell>
                              <div className="font-medium">
                                {result.route.source.name} → {result.route.destination.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {result.distance.toFixed(0)} km • {result.travelTime.toFixed(1)} hrs
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="capitalize">{result.fishType}</div>
                              <div className="text-xs text-gray-500">{result.volume}kg</div>
                            </TableCell>
                            <TableCell>{result.distance.toFixed(0)} km</TableCell>
                            <TableCell>
                              <Badge className={getSpoilageBadgeColor(result.spoilagePercentage)}>
                                {result.spoilagePercentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-green-600">₹{result.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-red-600">₹{result.totalCost.toLocaleString()}</TableCell>
                            <TableCell className={getProfitColor(result.netProfit)}>
                              ₹{result.netProfit.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {result.efficiency.toFixed(0)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {results.length === 0 && !isOptimizing && (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Optimize</h3>
                <p className="text-gray-600 mb-4">
                  Configure your parameters and run the optimization to find the best routes.
                </p>
                <Button onClick={runOptimization} disabled={formData.portIds.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Optimization
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedOptimization;