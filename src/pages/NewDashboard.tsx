
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';
import AIChat from '@/components/AIChat';
import { Fish, TrendingUp, Truck, AlertCircle, MessageCircle, User } from 'lucide-react';
import { toast } from 'sonner';

const NewDashboard = () => {
  const { t } = useTranslation();
  const { user, signOut, loading, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalCatch: 0,
    availableTrucks: 0,
    spoilageSaved: 0,
    activeRoutes: 0,
  });
  const [mapData, setMapData] = useState({
    ports: [],
    markets: [],
    coldStorage: [],
    routes: [],
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchMapData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [
        { data: catches },
        { data: trucks },
        { data: optimizations },
      ] = await Promise.all([
        supabase.from('daily_catches')
          .select('volume_kg')
          .eq('catch_date', new Date().toISOString().split('T')[0]),
        supabase.from('trucks').select('*').eq('available', true),
        supabase.from('optimization_results')
          .select('spoilage_percentage, volume_kg')
          .eq('optimization_date', new Date().toISOString().split('T')[0]),
      ]);

      const totalCatch = catches?.reduce((sum, catch_item) => sum + catch_item.volume_kg, 0) || 0;
      const availableTrucks = trucks?.length || 0;
      const spoilageSaved = optimizations?.reduce((sum, opt) => {
        const wouldBeSpoiled = opt.volume_kg * 0.15; // Assume 15% without optimization
        const actualSpoiled = opt.volume_kg * (opt.spoilage_percentage / 100);
        return sum + (wouldBeSpoiled - actualSpoiled);
      }, 0) || 0;
      const activeRoutes = optimizations?.length || 0;

      setDashboardData({
        totalCatch,
        availableTrucks,
        spoilageSaved: spoilageSaved,
        activeRoutes,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMapData = async () => {
    try {
      const [
        { data: ports },
        { data: markets },
        { data: coldStorage },
        { data: recentOptimizations },
      ] = await Promise.all([
        supabase.from('ports').select('*').eq('active', true),
        supabase.from('markets').select('*').eq('active', true),
        supabase.from('cold_storage').select('*').eq('active', true),
        supabase.from('optimization_results')
          .select('*, ports(*), markets(*)')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      // Convert optimization results to route format for map
      const routes = recentOptimizations?.map(opt => ({
        source: {
          location: {
            lat: opt.ports?.location_lat,
            lng: opt.ports?.location_lng,
          },
          name: opt.ports?.name,
        },
        destination: {
          location: {
            lat: opt.markets?.location_lat,
            lng: opt.markets?.location_lng,
          },
          name: opt.markets?.name,
        },
        spoilage_percentage: opt.spoilage_percentage,
        fishType: opt.fish_type,
        netProfit: opt.net_profit,
      })) || [];

      setMapData({
        ports: ports || [],
        markets: markets || [],
        coldStorage: coldStorage || [],
        routes,
      });
    } catch (error) {
      console.error('Error fetching map data:', error);
    }
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
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your cold chain operations today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.totalCatch')}
              </CardTitle>
              <Fish className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalCatch.toLocaleString()} kg</div>
              <p className="text-xs text-gray-600">Today's harvest</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.availableTrucks')}
              </CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.availableTrucks}</div>
              <p className="text-xs text-gray-600">Ready for dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.spoilageSaved')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.spoilageSaved.toFixed(0)} kg</div>
              <p className="text-xs text-gray-600">Prevented this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.activeRoutes')}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.activeRoutes}</div>
              <p className="text-xs text-gray-600">Optimized today</p>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Live Route Map</CardTitle>
            <CardDescription>
              Real-time view of ports, markets, cold storage, and optimized routes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MapView
              ports={mapData.ports}
              markets={mapData.markets}
              coldStorage={mapData.coldStorage}
              routes={mapData.routes}
              className="h-[500px]"
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Entry</CardTitle>
              <CardDescription>Record today's catch and available resources</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/input'}>
                Enter Catch Data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Route Optimization</CardTitle>
              <CardDescription>Find the best routes for maximum profit</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/optimization'}>
                Optimize Routes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Forecasting</CardTitle>
              <CardDescription>Predict demand and plan ahead</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => window.location.href = '/forecasting'}>
                View Forecasts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
