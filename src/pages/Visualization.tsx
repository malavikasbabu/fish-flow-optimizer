
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from 'recharts';

const Visualization = () => {
  // Sample data for visualizations
  const routeEfficiencyData = [
    { route: 'Vizag-Delhi', beforeOptimization: 35, afterOptimization: 18, profit: 45000 },
    { route: 'Cochin-Mumbai', beforeOptimization: 28, afterOptimization: 12, profit: 52000 },
    { route: 'Chennai-Bangalore', beforeOptimization: 22, afterOptimization: 8, profit: 38000 },
    { route: 'Vizag-Hyderabad', beforeOptimization: 15, afterOptimization: 5, profit: 42000 },
  ];

  const freshnessData = [
    { time: 0, tilapia: 100, mackerel: 100, pomfret: 100 },
    { time: 4, tilapia: 95, mackerel: 88, pomfret: 97 },
    { time: 8, tilapia: 88, mackerel: 72, pomfret: 92 },
    { time: 12, tilapia: 75, mackerel: 50, pomfret: 85 },
    { time: 16, tilapia: 60, mackerel: 25, pomfret: 75 },
    { time: 20, tilapia: 40, mackerel: 10, pomfret: 62 },
    { time: 24, tilapia: 20, mackerel: 5, pomfret: 45 },
  ];

  const costSpoilageData = [
    { cost: 12000, spoilage: 5, route: 'Route 1', size: 300 },
    { cost: 18000, spoilage: 15, route: 'Route 2', size: 500 },
    { cost: 25000, spoilage: 8, route: 'Route 3', size: 800 },
    { cost: 15000, spoilage: 22, route: 'Route 4', size: 400 },
    { cost: 20000, spoilage: 12, route: 'Route 5', size: 600 },
    { cost: 30000, spoilage: 3, route: 'Route 6', size: 1000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Route Visualization & Analytics
          </h1>
          <p className="text-lg text-gray-600">
            Interactive charts and maps showing optimization results
          </p>
        </div>

        {/* Map Placeholder */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-600" />
              Route Map with Freshness Overlay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Simulated Map Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-br from-blue-200 via-green-200 to-yellow-200"></div>
              </div>
              
              {/* Route Lines */}
              <svg className="absolute inset-0 w-full h-full">
                <path d="M50 200 Q200 100 350 180" stroke="#22c55e" strokeWidth="4" fill="none" className="animate-pulse" />
                <path d="M100 250 Q250 150 400 230" stroke="#eab308" strokeWidth="4" fill="none" className="animate-pulse" />
                <path d="M80 180 Q220 80 360 160" stroke="#ef4444" strokeWidth="4" fill="none" className="animate-pulse" />
              </svg>
              
              {/* Port and Market Points */}
              <div className="absolute top-20 left-12">
                <div className="bg-blue-600 w-4 h-4 rounded-full animate-pulse"></div>
                <Badge className="mt-1 text-xs bg-blue-100 text-blue-800">Vizag Port</Badge>
              </div>
              
              <div className="absolute bottom-16 right-12">
                <div className="bg-green-600 w-4 h-4 rounded-full animate-pulse"></div>
                <Badge className="mt-1 text-xs bg-green-100 text-green-800">Delhi Market</Badge>
              </div>
              
              <div className="absolute top-32 right-20">
                <div className="bg-yellow-600 w-4 h-4 rounded-full animate-pulse"></div>
                <Badge className="mt-1 text-xs bg-yellow-100 text-yellow-800">Mumbai Market</Badge>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
                <h4 className="text-sm font-semibold mb-2">Route Health</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-green-500 rounded"></div>
                    <span>Optimal (&lt;10% spoilage)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-yellow-500 rounded"></div>
                    <span>Moderate (10-20% spoilage)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-red-500 rounded"></div>
                    <span>High Risk (&gt;20% spoilage)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before vs After Optimization */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Spoilage: Before vs After Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={routeEfficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="route" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'Spoilage %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="beforeOptimization" fill="#ef4444" name="Before Optimization" />
                  <Bar dataKey="afterOptimization" fill="#22c55e" name="After Optimization" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Freshness Decay Over Time */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Freshness Decay Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={freshnessData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" label={{ value: 'Hours', position: 'insideBottom', offset: -10 }} />
                  <YAxis label={{ value: 'Freshness %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tilapia" stroke="#3b82f6" name="Tilapia" strokeWidth={2} />
                  <Line type="monotone" dataKey="mackerel" stroke="#ef4444" name="Mackerel" strokeWidth={2} />
                  <Line type="monotone" dataKey="pomfret" stroke="#22c55e" name="Pomfret" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cost-Spoilage Scatter Plot */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Cost vs Spoilage Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={costSpoilageData}>
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
            <div className="mt-4 text-sm text-gray-600">
              <p>• Each point represents a different route</p>
              <p>• Optimal routes are in the bottom-left quadrant (low cost, low spoilage)</p>
              <p>• Point size indicates cargo volume</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold">67%</h3>
              <p className="text-sm opacity-90">Average Spoilage Reduction</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold">₹1.8L</h3>
              <p className="text-sm opacity-90">Daily Profit Increase</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold">12</h3>
              <p className="text-sm opacity-90">Optimized Routes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold">89%</h3>
              <p className="text-sm opacity-90">On-Time Deliveries</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Visualization;
