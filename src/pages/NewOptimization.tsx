import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OptimizationEngineV2 } from '@/components/OptimizationEngineV2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import MapView from '@/components/MapView';
import AIChat from '@/components/AIChat';
import { Play, TrendingUp, Truck, MapPin, DollarSign, AlertCircle, MessageCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

const NewOptimization = () => {
  const { user, loading } = useAuth();
  const [optimizer] = useState(new OptimizationEngineV2());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    portId: '',
    fishType: 'tilapia',
    volume: 1000,
    selectedTrucks: [] as string[],
    useColdStorage: false,
  });
  
  // Data state
  const [ports, setPorts] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      const [
        { data: portsData },
        { data: trucksData },
      ] = await Promise.all([
        supabase.from('ports').select('*').eq('active', true),
        supabase.from('trucks').select('*').eq('available', true),
      ]);

      setPorts(portsData || []);
      setTrucks(trucksData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load initial data');
    }
  };

  const handleOptimize = async () => {
    if (!formData.portId || !formData.fishType || formData.volume <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsOptimizing(true);
    toast.info('Running optimization algorithm...');

    try {
      const optimizationResults = await optimizer.optimize(formData);
      setResults(optimizationResults);
      
      if (optimizationResults.length > 0) {
        setSelectedResult(optimizationResults[0]);
        toast.success(`Found ${optimizationResults.length} viable routes!`);
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

  const handleSaveResult = async (result: any) => {
    if (!user) return;

    try {
      await optimizer.saveOptimizationResult(result, user.id);
      toast.success('Optimization result saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save result');
    }
  };

  const getSpoilageBadgeColor = (spoilage: number) => {
    if (spoilage < 5) return "bg-green-100 text-green-800";
    if (spoilage < 15) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Smart Route Optimization
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered logistics planning for maximum profit and minimum spoilage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-600" />
                Optimization Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Port Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Port</label>
                <Select value={formData.portId} onValueChange={(value) => setFormData(prev => ({ ...prev, portId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select port" />
                  </SelectTrigger>
                  <SelectContent>
                    {ports.map((port) => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.name} ({port.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fish Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fish Type</label>
                <Select value={formData.fishType} onValueChange={(value) => setFormData(prev => ({ ...prev, fishType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
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

              {/* Volume */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Volume (kg)</label>
                <Input
                  type="number"
                  value={formData.volume}
                  onChange={(e) => setFormData(prev => ({ ...prev, volume: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>

              {/* Cold Storage Option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coldStorage"
                  checked={formData.useColdStorage}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useColdStorage: !!checked }))}
                />
                <label htmlFor="coldStorage" className="text-sm">Include cold storage routes</label>
              </div>

              {/* Truck Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Trucks ({trucks.length})</label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {trucks.map((truck) => (
                    <div key={truck.id} className="flex items-center space-x-2 text-sm">
                      <Checkbox
                        id={truck.id}
                        checked={formData.selectedTrucks.includes(truck.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({ ...prev, selectedTrucks: [...prev.selectedTrucks, truck.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, selectedTrucks: prev.selectedTrucks.filter(id => id !== truck.id) }));
                          }
                        }}
                      />
                      <label htmlFor={truck.id} className="cursor-pointer">
                        {truck.license_plate} ({truck.truck_type}, {truck.capacity_kg}kg)
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="w-full bg-blue-600 hover:bg-blue-700"
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
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            {selectedResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Route Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <MapView
                    ports={ports}
                    markets={[selectedResult.route.destination]}
                    coldStorage={selectedResult.route.coldStorage ? [selectedResult.route.coldStorage] : []}
                    routes={[selectedResult]}
                    className="h-[300px]"
                  />
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results ({results.length} routes found)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
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
                              Route #{index + 1}
                            </Badge>
                            <Badge className={getSpoilageBadgeColor(result.spoilagePercentage)}>
                              {result.spoilagePercentage.toFixed(1)}% spoilage
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${result.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(result.netProfit)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((result.netProfit / result.revenue) * 100).toFixed(1)}% margin
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Route</div>
                            <div className="font-medium">
                              {result.route.source.name} → {result.route.destination.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Distance</div>
                            <div className="font-medium">{result.distance.toFixed(0)} km</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Revenue</div>
                            <div className="font-medium text-green-600">{formatCurrency(result.revenue)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Cost</div>
                            <div className="font-medium text-red-600">{formatCurrency(result.totalCost)}</div>
                          </div>
                        </div>

                        {result.recommendations && result.recommendations.length > 0 && (
                          <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
                            <div className="flex items-center gap-1 text-amber-800 font-medium text-xs mb-1">
                              <Lightbulb className="h-3 w-3" />
                              AI Recommendations
                            </div>
                            <ul className="text-xs text-amber-700 space-y-1">
                              {result.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex justify-end mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveResult(result);
                            }}
                          >
                            Save Route
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Button */}
      <Button
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 z-40"
        onClick={() => setIsChatOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* AI Chat Modal */}
      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        context={{ results, selectedResult, formData }}
      />
    </div>
  );
};

export default NewOptimization;
