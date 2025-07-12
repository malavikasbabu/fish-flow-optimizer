
import { useState, useEffect } from 'react';
import { OptimizationEngine } from '../components/OptimizationEngine';
import { mockPorts, mockTrucks, mockColdStorage, mockMarkets } from '../data/mockData';
import { OptimizationResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, TrendingUp, Truck, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const Optimization = () => {
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizer] = useState(new OptimizationEngine());

  const runOptimization = async () => {
    setIsOptimizing(true);
    toast.info("Running optimization algorithm...");
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const optimizedResults = optimizer.optimize(
        mockPorts,
        mockTrucks,
        mockColdStorage,
        mockMarkets
      );
      
      setResults(optimizedResults);
      toast.success(`Optimization complete! Found ${optimizedResults.length} viable routes.`);
    } catch (error) {
      toast.error("Optimization failed. Please try again.");
      console.error("Optimization error:", error);
    } finally {
      setIsOptimizing(false);
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

  useEffect(() => {
    // Auto-run optimization on component mount
    runOptimization();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Route Optimization
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered logistics planning for maximum profit and minimum spoilage
          </p>
        </div>

        {/* Control Panel */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Optimization Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-sm text-gray-600">
                Optimizing routes for {mockPorts.length} ports, {mockTrucks.filter(t => t.available).length} trucks, and {mockMarkets.length} markets
              </div>
              <Button 
                onClick={runOptimization}
                disabled={isOptimizing}
                className="bg-blue-600 hover:bg-blue-700"
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
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Profit</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(results.reduce((sum, r) => sum + r.netProfit, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Routes Found</p>
                    <p className="text-xl font-bold text-blue-600">{results.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Avg Spoilage</p>
                    <p className="text-xl font-bold text-orange-600">
                      {(results.reduce((sum, r) => sum + r.spoilagePercentage, 0) / results.length).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Distance</p>
                    <p className="text-xl font-bold text-purple-600">
                      {results.reduce((sum, r) => sum + r.distance, 0).toFixed(0)} km
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Optimization Results */}
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Route Info */}
                  <div className="lg:col-span-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        Route #{index + 1}
                      </Badge>
                      <Badge className={getSpoilageBadgeColor(result.spoilagePercentage)}>
                        {result.spoilagePercentage.toFixed(1)}% spoilage
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{result.route.source.name} → {result.route.destination.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        <span>{result.truck.type} ({result.truck.capacity}kg capacity)</span>
                      </div>
                    </div>
                  </div>

                  {/* Fish Details */}
                  <div className="lg:col-span-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{result.fishType}</p>
                      <p className="text-gray-600">{result.volume} kg</p>
                      <p className="text-xs text-gray-500">
                        {result.distance.toFixed(0)} km • {result.travelTime.toFixed(1)} hrs
                      </p>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="lg:col-span-3 space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Revenue: </span>
                      <span className="font-medium text-green-600">{formatCurrency(result.revenue)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Cost: </span>
                      <span className="font-medium text-red-600">{formatCurrency(result.totalCost)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Net Profit: </span>
                      <span className="font-bold text-blue-600">{formatCurrency(result.netProfit)}</span>
                    </div>
                  </div>

                  {/* Profit Indicator */}
                  <div className="lg:col-span-2 text-right">
                    <div className={`text-2xl font-bold ${result.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.netProfit > 0 ? '+' : ''}{formatCurrency(result.netProfit)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {((result.netProfit / result.revenue) * 100).toFixed(1)}% margin
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length === 0 && !isOptimizing && (
          <Card className="bg-white">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Found</h3>
              <p className="text-gray-600 mb-4">
                No viable routes were found with the current parameters.
              </p>
              <Button onClick={runOptimization} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Optimization;
