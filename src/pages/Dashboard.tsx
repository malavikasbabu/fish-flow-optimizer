
import { Fish, Truck, Building2, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import { mockPorts, mockTrucks, mockMarkets } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  // Calculate summary statistics
  const totalCatch = mockPorts.reduce((sum, port) => 
    sum + port.availableFish.reduce((portSum, fish) => portSum + fish.volume, 0), 0
  );

  const availableTrucks = mockTrucks.filter(truck => truck.available).length;
  
  const totalDemand = mockMarkets.reduce((sum, market) =>
    sum + market.demand.reduce((marketSum, demand) => marketSum + demand.quantity, 0), 0
  );

  const estimatedRevenue = mockMarkets.reduce((sum, market) =>
    sum + market.demand.reduce((marketSum, demand) => marketSum + (demand.quantity * demand.pricePerKg), 0), 0
  );

  // Sample data for charts
  const catchByPort = mockPorts.map(port => ({
    name: port.name.split(' ')[0],
    volume: port.availableFish.reduce((sum, fish) => sum + fish.volume, 0)
  }));

  const demandByFishType = [
    { name: 'Tilapia', value: 400, color: '#0088FE' },
    { name: 'Mackerel', value: 650, color: '#00C49F' },
    { name: 'Pomfret', value: 200, color: '#FFBB28' },
    { name: 'Sardine', value: 600, color: '#FF8042' },
    { name: 'Tuna', value: 100, color: '#8884D8' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cold Chain Logistics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Optimizing fish transport from ports to markets
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Catch Today"
            value={`${totalCatch.toLocaleString()} kg`}
            subtitle="From all ports"
            icon={<Fish className="h-6 w-6" />}
            trend={{ value: 12, isPositive: true }}
            className="bg-white border-l-4 border-l-blue-500"
          />
          
          <DashboardCard
            title="Available Trucks"
            value={availableTrucks}
            subtitle={`${mockTrucks.length - availableTrucks} in transit`}
            icon={<Truck className="h-6 w-6" />}
            className="bg-white border-l-4 border-l-green-500"
          />
          
          <DashboardCard
            title="Market Demand"
            value={`${totalDemand.toLocaleString()} kg`}
            subtitle="Across all markets"
            icon={<Building2 className="h-6 w-6" />}
            trend={{ value: 8, isPositive: true }}
            className="bg-white border-l-4 border-l-purple-500"
          />
          
          <DashboardCard
            title="Potential Revenue"
            value={`₹${(estimatedRevenue / 1000).toFixed(0)}K`}
            subtitle="If optimally distributed"
            icon={<DollarSign className="h-6 w-6" />}
            trend={{ value: 15, isPositive: true }}
            className="bg-white border-l-4 border-l-yellow-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Catch by Port Chart */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-blue-600" />
                Catch Volume by Port
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={catchByPort}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} kg`, 'Volume']} />
                  <Bar dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Demand by Fish Type Chart */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Market Demand Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={demandByFishType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {demandByFishType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} kg`, 'Demand']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {demandByFishType.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Today's Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                <h3 className="font-semibold text-red-800">High Spoilage Risk</h3>
                <p className="text-sm text-red-600 mt-1">
                  2 shipments need immediate attention
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <h3 className="font-semibold text-yellow-800">Truck Shortage</h3>
                <p className="text-sm text-yellow-600 mt-1">
                  Consider hiring additional refrigerated trucks
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <h3 className="font-semibold text-green-800">Optimal Routes</h3>
                <p className="text-sm text-green-600 mt-1">
                  5 routes optimized for maximum profit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
