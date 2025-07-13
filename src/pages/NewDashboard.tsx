
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MapView from '@/components/MapView';
import AIChat from '@/components/AIChat';
import AdminDashboard from '@/components/AdminDashboard';
import { Fish, TrendingUp, Truck, AlertCircle, MessageCircle, User, Shield } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchMapData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      const [
        { data: catches },
        { data: trucks },
        { data: optimizations },
      ] = await Promise.all([
        supabase.from('daily_catches')
          .select('volume_kg')
          .gte('catch_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('trucks').select('*').eq('available', true),
        supabase.from('optimization_results')
          .select('spoilage_percentage, volume_kg, net_profit')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      console.log('Dashboard data fetched:', { catches, trucks, optimizations });

      const totalCatch = catches?.reduce((sum, catch_item) => sum + (catch_item.volume_kg || 0), 0) || 0;
      const availableTrucks = trucks?.length || 0;
      
      // Calculate spoilage saved (assuming 15% without optimization vs actual spoilage)
      const spoilageSaved = optimizations?.reduce((sum, opt) => {
        const wouldBeSpoiled = (opt.volume_kg || 0) * 0.15; // 15% without optimization
        const actualSpoiled = (opt.volume_kg || 0) * ((opt.spoilage_percentage || 0) / 100);
        return sum + Math.max(wouldBeSpoiled - actualSpoiled, 0);
      }, 0) || 0;
      
      const activeRoutes = optimizations?.length || 0;

      setDashboardData({
        totalCatch,
        availableTrucks,
        spoilageSaved: Math.round(spoilageSaved),
        activeRoutes,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(t('dashboard.fetchError', 'Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMapData = async () => {
    try {
      console.log('Fetching map data...');
      
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
          .select(`
            *,
            ports:port_id(*),
            markets:market_id(*)
          `)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      console.log('Map data fetched:', { ports, markets, coldStorage, recentOptimizations });

      // Convert optimization results to route format
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
      })).filter(route => route.source.location.lat && route.destination.location.lat) || [];

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'admin':
        return <AdminDashboard />;
      case 'chat':
        return (
          <div className="max-w-4xl mx-auto p-6">
            <AIChat />
          </div>
        );
      default:
        return (
          <>
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('dashboard.welcome', 'Welcome back')}, {profile?.full_name || user.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600">
                {t('dashboard.subtitle', "Here's what's happening with your cold chain operations today.")}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.totalCatch', 'Total Catch (7 days)')}
                  </CardTitle>
                  <Fish className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalCatch.toLocaleString()} kg</div>
                  <p className="text-xs text-gray-600">
                    {t('dashboard.recentHarvest', 'Recent harvest')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.availableTrucks', 'Available Trucks')}
                  </CardTitle>
                  <Truck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.availableTrucks}</div>
                  <p className="text-xs text-gray-600">
                    {t('dashboard.readyForDispatch', 'Ready for dispatch')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.spoilageSaved', 'Spoilage Saved')}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.spoilageSaved} kg</div>
                  <p className="text-xs text-gray-600">
                    {t('dashboard.preventedThisMonth', 'Prevented this month')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t('dashboard.activeRoutes', 'Optimized Routes')}
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.activeRoutes}</div>
                  <p className="text-xs text-gray-600">
                    {t('dashboard.thisMonth', 'This month')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Map Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{t('dashboard.liveRouteMap', 'Live Route Map')}</CardTitle>
                <CardDescription>
                  {t('dashboard.mapDescription', 'Real-time view of ports, markets, cold storage, and optimized routes')}
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
                  <CardTitle className="text-lg">{t('dashboard.dataEntry', 'Data Entry')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.dataEntryDesc', 'Record today\'s catch and available resources')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/input'}
                  >
                    {t('dashboard.enterCatchData', 'Enter Catch Data')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t('dashboard.routeOptimization', 'Route Optimization')}
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard.routeOptimizationDesc', 'Find the best routes for maximum profit')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/optimization'}
                  >
                    {t('dashboard.optimizeRoutes', 'Optimize Routes')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('dashboard.forecasting', 'Forecasting')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.forecastingDesc', 'Predict demand and plan ahead')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/forecasting'}
                  >
                    {t('dashboard.viewForecasts', 'View Forecasts')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 min-h-screen">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('navigation.dashboard', 'Dashboard')}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-1 ${
                  activeTab === 'chat' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{t('navigation.aiChat', 'AI Assistant')}</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-1 ${
                    activeTab === 'admin' 
                      ? 'bg-red-100 text-red-700' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>{t('navigation.admin', 'Admin')}</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                {profile?.role && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    profile.role === 'admin' 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profile.role}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
              >
                {t('navigation.signOut', 'Sign Out')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default NewDashboard;
