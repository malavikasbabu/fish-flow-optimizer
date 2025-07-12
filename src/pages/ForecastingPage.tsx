
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, AlertTriangle, Fish, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const ForecastingPage = () => {
  const { user, loading } = useAuth();
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [selectedFishType, setSelectedFishType] = useState('tilapia');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMarkets();
      generateForecasts();
    }
  }, [user, selectedFishType, selectedMarket]);

  const fetchMarkets = async () => {
    try {
      const { data } = await supabase.from('markets').select('*').eq('active', true);
      setMarkets(data || []);
      if (data && data.length > 0 && !selectedMarket) {
        setSelectedMarket(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
    }
  };

  const generateForecasts = async () => {
    setIsLoading(true);
    try {
      // Generate mock forecast data based on historical patterns and seasonal factors
      const mockData = generateMockForecastData();
      setForecastData(mockData);
      
      // Generate alerts
      const forecastAlerts = generateAlerts(mockData);
      setAlerts(forecastAlerts);
      
    } catch (error) {
      console.error('Error generating forecasts:', error);
      toast.error('Failed to generate forecasts');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockForecastData = () => {
    const days = 7;
    const basePrice = {
      'tilapia': 250,
      'pomfret': 450,
      'mackerel': 180,
      'sardine': 150,
      'tuna': 600,
    }[selectedFishType] || 250;

    const baseDemand = Math.floor(Math.random() * 2000) + 1000;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Add some seasonal and random variation
      const seasonalFactor = 1 + (Math.sin((i / 7) * Math.PI) * 0.2);
      const randomFactor = 0.8 + Math.random() * 0.4;
      
      const demandForecast = Math.floor(baseDemand * seasonalFactor * randomFactor);
      const priceForecast = Math.floor(basePrice * (1 + (Math.random() - 0.5) * 0.3));
      const spoilageRisk = Math.random() * 20; // 0-20% risk
      
      return {
        date: date.toISOString().split('T')[0],
        dateLabel: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        demandForecast,
        priceForecast,
        spoilageRisk,
        confidence: 75 + Math.random() * 20, // 75-95% confidence
        revenue: demandForecast * priceForecast * (1 - spoilageRisk / 100),
      };
    });
  };

  const generateAlerts = (data: any[]) => {
    const alerts = [];
    
    // High demand alert
    const avgDemand = data.reduce((sum, d) => sum + d.demandForecast, 0) / data.length;
    const highDemandDays = data.filter(d => d.demandForecast > avgDemand * 1.3);
    if (highDemandDays.length > 0) {
      alerts.push({
        type: 'opportunity',
        icon: TrendingUp,
        title: 'High Demand Opportunity',
        message: `${highDemandDays.length} day(s) with demand 30% above average. Consider increasing supply.`,
        days: highDemandDays.map(d => d.dateLabel).join(', '),
      });
    }

    // High spoilage risk alert
    const highSpoilageDays = data.filter(d => d.spoilageRisk > 15);
    if (highSpoilageDays.length > 0) {
      alerts.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'High Spoilage Risk',
        message: `${highSpoilageDays.length} day(s) with spoilage risk >15%. Use refrigerated transport.`,
        days: highSpoilageDays.map(d => d.dateLabel).join(', '),
      });
    }

    // Price fluctuation alert
    const prices = data.map(d => d.priceForecast);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if ((maxPrice - minPrice) / minPrice > 0.2) {
      alerts.push({
        type: 'info',
        icon: DollarSign,
        title: 'Price Volatility',
        message: `Price expected to vary by ${((maxPrice - minPrice) / minPrice * 100).toFixed(0)}% this week.`,
        days: `₹${minPrice} - ₹${maxPrice}`,
      });
    }

    return alerts;
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
            Market Forecasting & Analytics
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered predictions for demand, pricing, and risk analysis
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Forecast Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fish Type</label>
                <Select value={selectedFishType} onValueChange={setSelectedFishType}>
                  <SelectTrigger className="w-[150px]">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Market</label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent>
                    {markets.map((market) => (
                      <SelectItem key={market.id} value={market.id}>
                        {market.name}, {market.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={generateForecasts} disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Refresh Forecast'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alerts.map((alert, index) => (
              <Card key={index} className={`border-l-4 ${
                alert.type === 'opportunity' ? 'border-l-green-500 bg-green-50' :
                alert.type === 'warning' ? 'border-l-red-500 bg-red-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <alert.icon className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'opportunity' ? 'text-green-600' :
                      alert.type === 'warning' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs font-medium mt-2">{alert.days}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demand Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>7-Day Demand Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="demandForecast" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Demand (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Price Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Price Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="priceForecast" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Price (₹/kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Spoilage Risk */}
          <Card>
            <CardHeader>
              <CardTitle>Spoilage Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="spoilageRisk" 
                    fill="#f59e0b"
                    name="Spoilage Risk (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="revenue" 
                    fill="#6366f1"
                    name="Revenue (₹)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Forecast Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Demand (kg)</th>
                    <th className="text-left p-2">Price (₹/kg)</th>
                    <th className="text-left p-2">Spoilage Risk</th>
                    <th className="text-left p-2">Revenue (₹)</th>
                    <th className="text-left p-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{row.dateLabel}</td>
                      <td className="p-2">{row.demandForecast.toLocaleString()}</td>
                      <td className="p-2">₹{row.priceForecast}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.spoilageRisk > 15 ? 'bg-red-100 text-red-800' :
                          row.spoilageRisk > 8 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {row.spoilageRisk.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2">₹{Math.floor(row.revenue).toLocaleString()}</td>
                      <td className="p-2">{row.confidence.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForecastingPage;
