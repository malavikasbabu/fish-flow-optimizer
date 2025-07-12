import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MapboxMap from '@/components/MapboxMap';
import { 
  Map, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Layers,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';

const EnhancedVisualization = () => {
  const { user, loading } = useAuth();
  const [mapData, setMapData] = useState({
    ports: [],
    markets: [],
    coldStorage: [],
    routes: [],
  });
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    refrigerated: true,
    regular: true,
    highProfit: true,
    lowSpoilage: true,
  });

  useEffect(() => {
    if (user) {
      fetchVisualizationData();
    }
  }, [user]);

  const fetchVisualizationData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: ports },
        { data: markets },
        { data: coldStorage },
        { data: optimizationResults },
        { data: dailyCatches },
        { data: marketDemand },
      ] = await Promise.all([
        supabase.from('ports').select('*').eq('active', true),
        supabase.from('markets').select('*').eq('active', true),
        supabase.from('cold_storage').select('*').eq('active', true),
        supabase.from('optimization_results')
          .select('*, ports(*), markets(*), trucks(*)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('daily_catches')
          .select('*')
          .gte('catch_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('market_demand')
          .select('*, markets(*)')
          .gte('demand_date', new Date().toISOString().split('T')[0]),
      ]);

      // Process routes for map
      const routes = optimizationResults?.map(result => ({
        id: result.id,
        route: {
          source: result.ports,
          destination: result.markets,
        },
        spoilagePercentage: result.spoilage_percentage,
        fishType: result.fish_type,
        netProfit: result.net_profit,
        distance: result.distance_km,
        travelTime: result.travel_time_hours,
        revenue: result.revenue,
        totalCost: result.total_cost,
        volume: result.volume_kg,
        truck: result.trucks,
      })) || [];

      setMapData({
        ports: ports || [],
        markets: markets || [],
        coldStorage: coldStorage || [],
        routes,
      });

      // Generate analytics data
      generateAnalyticsData(optimizationResults, dailyCatches, marketDemand);
    } catch (error) {
      console.error('Error fetching visualization data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnalyticsData = (optimizations: any[], catches: any[], demand: any[]) => {
    // Route efficiency analysis
    const routeEfficiency = optimizations?.slice(0, 10).map((opt, index) => ({
      route: `Route ${index + 1}`,
      beforeOptimization: Math.random() * 30 + 15, // Simulated
      afterOptimization: opt.spoilage_percentage,
      profit: opt.net_profit,
    })) || [];

    // Fish type performance
    const fishPerformance = ['tilapia', 'pomfret', 'mackerel', 'sardine', 'tuna'].map(fish => {
      const fishOptimizations = optimizations?.filter(opt => opt.fish_type === fish) || [];
      const avgSpoilage = fishOptimizations.reduce((sum, opt) => sum + opt.spoilage_percentage, 0) / (fishOptimizations.length || 1);
      const totalProfit = fishOptimizations.reduce((sum, opt) => sum + opt.net_profit, 0);
      
      return {
        name: fish,
        spoilage: avgSpoilage,
        profit: totalProfit / 1000, // In thousands
        volume: fishOptimizations.reduce((sum, opt) => sum + opt.volume_kg, 0),
      };
    });

    // Cost vs Spoilage scatter
    const costSpoilageData = optimizations?.slice(0, 20).map((opt, index) => ({
      cost: opt.total_cost,
      spoilage: opt.spoilage_percentage,
      route: `Route ${index + 1}`,
      size: opt.volume_kg,
      profit: opt.net_profit,
    })) || [];

    // Time series data for trends
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        spoilage: Math.random() * 15 + 5,
        profit: Math.random() * 50000 + 20000,
        volume: Math.random() * 5000 + 2000,
      };
    });

    // Market distribution
    const marketDistribution = demand?.reduce((acc: any[], d) => {
      const existing = acc.find(item => item.name === d.markets?.name);
      if (existing) {
        existing.value += d.quantity_kg;
      } else {
        acc.push({
          name: d.markets?.name || 'Unknown',
          value: d.quantity_kg,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        });
      }
      return acc;
    }, []) || [];

    setAnalyticsData({
      routeEfficiency,
      fishPerformance,
      costSpoilageData,
      trendData,
      marketDistribution,
    });
  };

  const handleRouteClick = (route: any) => {
    setSelectedRoute(route);
  };

  const toggleFilter = (filter: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Visualization & Analytics</h1>
          <p className="text-gray-600">Interactive maps and real-time performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchVisualizationData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Map Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Map Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(activeFilters).map(([key, value]) => (
                  <Button
                    key={key}
                    variant={value ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFilter(key as keyof typeof activeFilters)}
                  >
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Map */}
          <Card>
            <CardHeader>
              <CardTitle>Live Route Map</CardTitle>
            </CardHeader>
            <CardContent>
              <MapboxMap
                ports={mapData.ports}
                markets={mapData.markets}
                coldStorage={mapData.coldStorage}
                routes={mapData.routes}
                className="h-[600px]"
                onRouteClick={handleRouteClick}
              />
            </CardContent>
          </Card>

          {/* Route Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-blue-600">{mapData.routes.length}</h3>
                <p className="text-sm text-gray-600">Active Routes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-green-600">
                  {mapData.routes.reduce((sum, r) => sum + r.netProfit, 0).toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600">Total Profit (₹)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-orange-600">
                  {(mapData.routes.reduce((sum, r) => sum + r.spoilagePercentage, 0) / (mapData.routes.length || 1)).toFixed(1)}%
                </h3>
                <p className="text-sm text-gray-600">Avg Spoilage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <h3 className="text-2xl font-bold text-purple-600">
                  {mapData.routes.reduce((sum, r) => sum + r.distance, 0).toFixed(0)}
                </h3>
                <p className="text-sm text-gray-600">Total Distance (km)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Route Efficiency Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Route Optimization Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.routeEfficiency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route" />
                  <YAxis label={{ value: 'Spoilage %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="beforeOptimization" fill="#ef4444" name="Before Optimization" />
                  <Bar dataKey="afterOptimization" fill="#22c55e" name="After Optimization" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fish Performance Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Fish Type Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.fishPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="profit" fill="#3b82f6" name="Profit (₹K)" />
                  <Bar dataKey="spoilage" fill="#f59e0b" name="Avg Spoilage %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Market Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Market Demand Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.marketDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.marketDistribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} kg`, 'Demand']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>7-Day Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="spoilage" stroke="#ef4444" name="Spoilage %" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#22c55e" name="Profit (₹)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost vs Spoilage Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Cost vs Spoilage Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={analyticsData.costSpoilageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="cost" 
                    type="number" 
                    domain={['dataMin - 2000', 'dataMax + 2000']}
                    label={{ value: 'Transport Cost (₹)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    dataKey="spoilage" 
                    type="number"
                    label={{ value: 'Spoilage %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      name === 'spoilage' ? `${value}%` : `₹${value.toLocaleString()}`,
                      name === 'spoilage' ? 'Spoilage' : 'Cost'
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.route} (${payload[0].payload.size}kg)`;
                      }
                      return '';
                    }}
                  />
                  <Scatter dataKey="spoilage" fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Best Performing Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Chennai → Bangalore (Pomfret)
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs">Profit:</span>
                    <span className="text-xs font-medium text-green-600">₹45,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Spoilage:</span>
                    <span className="text-xs font-medium">8.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Efficiency:</span>
                    <span className="text-xs font-medium">92%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  High Risk Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  3 routes with >20% spoilage
                </p>
                <div className="space-y-1">
                  <p className="text-xs">• Sardine routes need refrigeration</p>
                  <p className="text-xs">• Weather impact on long routes</p>
                  <p className="text-xs">• Consider cold storage stops</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <BarChart3 className="h-5 w-5" />
                  Optimization Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  67% average spoilage reduction
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs">Profit increase:</span>
                    <span className="text-xs font-medium text-green-600">₹1.8L daily</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Routes optimized:</span>
                    <span className="text-xs font-medium">12 today</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Opportunity Identified</h4>
                  <p className="text-sm text-green-700">
                    Mumbai market shows 40% increased demand for Tuna. Consider redirecting 2-3 routes from Chennai port to maximize profit.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Weather Alert</h4>
                  <p className="text-sm text-yellow-700">
                    High temperatures expected tomorrow (35°C). Recommend using refrigerated transport for all routes and avoiding afternoon departures.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Cost Optimization</h4>
                  <p className="text-sm text-blue-700">
                    Consolidating 3 small shipments to Bangalore could reduce transport costs by ₹8,000 while maintaining freshness quality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedVisualization;