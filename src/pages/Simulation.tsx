
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Fuel, AlertTriangle, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

const Simulation = () => {
  const [fuelCostIncrease, setFuelCostIncrease] = useState([0]);
  const [storageFailure, setStorageFailure] = useState(false);
  const [demandSurge, setDemandSurge] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Base scenario data
  const baseScenario = {
    totalProfit: 180000,
    spoilagePercentage: 8.5,
    deliveryTime: 16,
    fuelCost: 45000,
    routesAffected: 0
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    toast.info("Running simulation...");

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    let results = { ...baseScenario };

    // Apply fuel cost increase
    const fuelMultiplier = 1 + (fuelCostIncrease[0] / 100);
    results.fuelCost = baseScenario.fuelCost * fuelMultiplier;
    results.totalProfit = baseScenario.totalProfit - (baseScenario.fuelCost * (fuelMultiplier - 1));

    // Apply storage failure
    if (storageFailure) {
      results.spoilagePercentage += 12;
      results.deliveryTime += 6;
      results.totalProfit -= 35000;
      results.routesAffected += 3;
    }

    // Apply demand surge
    if (demandSurge) {
      results.totalProfit += 50000;
      results.deliveryTime += 2;
      results.routesAffected += 2;
    }

    setSimulationResults(results);
    setIsSimulating(false);
    toast.success("Simulation completed!");
  };

  const resetSimulation = () => {
    setFuelCostIncrease([0]);
    setStorageFailure(false);
    setDemandSurge(false);
    setSimulationResults(null);
    toast.info("Simulation reset");
  };

  // Chart data for comparison
  const comparisonData = simulationResults ? [
    {
      metric: 'Profit',
      base: baseScenario.totalProfit / 1000,
      scenario: simulationResults.totalProfit / 1000,
    },
    {
      metric: 'Spoilage %',
      base: baseScenario.spoilagePercentage,
      scenario: simulationResults.spoilagePercentage,
    },
    {
      metric: 'Delivery Time',
      base: baseScenario.deliveryTime,
      scenario: simulationResults.deliveryTime,
    },
    {
      metric: 'Fuel Cost',
      base: baseScenario.fuelCost / 1000,
      scenario: simulationResults.fuelCost / 1000,
    }
  ] : [];

  const impactData = [
    { scenario: 'Base', profit: 180, spoilage: 8.5 },
    { scenario: '+10% Fuel', profit: 175, spoilage: 8.5 },
    { scenario: '+20% Fuel', profit: 170, spoilage: 8.5 },
    { scenario: 'Storage Fail', profit: 145, spoilage: 20.5 },
    { scenario: 'Demand Surge', profit: 230, spoilage: 8.5 },
    { scenario: 'Combined', profit: simulationResults?.totalProfit / 1000 || 180, spoilage: simulationResults?.spoilagePercentage || 8.5 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Scenario Simulation
          </h1>
          <p className="text-lg text-gray-600">
            Test how your logistics plan adapts to changing conditions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Simulation Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fuel Cost Slider */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-orange-600" />
                    <Label className="font-medium">Fuel Cost Increase</Label>
                  </div>
                  <div className="px-2">
                    <Slider
                      value={fuelCostIncrease}
                      onValueChange={setFuelCostIncrease}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span className="font-medium text-orange-600">+{fuelCostIncrease[0]}%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>

                {/* Storage Failure Toggle */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <Label className="font-medium text-red-800">Storage Failure</Label>
                      <p className="text-xs text-red-600">Hyderabad Cold Hub offline</p>
                    </div>
                  </div>
                  <Switch
                    checked={storageFailure}
                    onCheckedChange={setStorageFailure}
                  />
                </div>

                {/* Demand Surge Toggle */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <Label className="font-medium text-green-800">Demand Surge</Label>
                      <p className="text-xs text-green-600">Mumbai market +40% demand</p>
                    </div>
                  </div>
                  <Switch
                    checked={demandSurge}
                    onCheckedChange={setDemandSurge}
                  />
                </div>

                {/* Control Buttons */}
                <div className="space-y-2 pt-4">
                  <Button 
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSimulating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Run Simulation
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={resetSimulation}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Parameters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Scenarios */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Active Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={fuelCostIncrease[0] > 0 ? "destructive" : "secondary"}>
                  Fuel: +{fuelCostIncrease[0]}%
                </Badge>
                <Badge variant={storageFailure ? "destructive" : "secondary"}>
                  Storage: {storageFailure ? "Failed" : "Normal"}
                </Badge>
                <Badge variant={demandSurge ? "default" : "secondary"}>
                  Demand: {demandSurge ? "Surge" : "Normal"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 space-y-6">
            {simulationResults ? (
              <>
                {/* Impact Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className={`${simulationResults.totalProfit >= baseScenario.totalProfit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <CardContent className="p-4 text-center">
                      <h3 className={`text-2xl font-bold ${simulationResults.totalProfit >= baseScenario.totalProfit ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(simulationResults.totalProfit / 1000).toFixed(0)}K
                      </h3>
                      <p className="text-sm text-gray-600">Total Profit</p>
                      <div className={`text-xs mt-1 ${simulationResults.totalProfit >= baseScenario.totalProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {simulationResults.totalProfit >= baseScenario.totalProfit ? '+' : ''}
                        {(((simulationResults.totalProfit - baseScenario.totalProfit) / baseScenario.totalProfit) * 100).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`${simulationResults.spoilagePercentage <= baseScenario.spoilagePercentage ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <CardContent className="p-4 text-center">
                      <h3 className={`text-2xl font-bold ${simulationResults.spoilagePercentage <= baseScenario.spoilagePercentage ? 'text-green-600' : 'text-red-600'}`}>
                        {simulationResults.spoilagePercentage.toFixed(1)}%
                      </h3>
                      <p className="text-sm text-gray-600">Spoilage Rate</p>
                      <div className={`text-xs mt-1 ${simulationResults.spoilagePercentage <= baseScenario.spoilagePercentage ? 'text-green-600' : 'text-red-600'}`}>
                        {simulationResults.spoilagePercentage > baseScenario.spoilagePercentage ? '+' : ''}
                        {(simulationResults.spoilagePercentage - baseScenario.spoilagePercentage).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="text-2xl font-bold text-blue-600">
                        {simulationResults.deliveryTime}h
                      </h3>
                      <p className="text-sm text-gray-600">Avg Delivery</p>
                      <div className="text-xs mt-1 text-blue-600">
                        +{simulationResults.deliveryTime - baseScenario.deliveryTime}h
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <h3 className="text-2xl font-bold text-purple-600">
                        {simulationResults.routesAffected}
                      </h3>
                      <p className="text-sm text-gray-600">Routes Affected</p>
                      <div className="text-xs mt-1 text-purple-600">
                        {simulationResults.routesAffected > 0 ? 'Adjustment needed' : 'No changes'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Comparison Chart */}
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle>Base vs Scenario Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metric" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="base" fill="#94a3b8" name="Base Scenario" />
                        <Bar dataKey="scenario" fill="#3b82f6" name="Current Scenario" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-12 text-center">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Simulate</h3>
                  <p className="text-gray-600 mb-4">
                    Adjust the parameters on the left and run a simulation to see how your logistics plan adapts.
                  </p>
                  <Button onClick={runSimulation} className="bg-blue-600 hover:bg-blue-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Run First Simulation
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Scenario Impact Chart */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Scenario Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={impactData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="profit" stroke="#22c55e" name="Profit (₹K)" strokeWidth={2} />
                    <Line type="monotone" dataKey="spoilage" stroke="#ef4444" name="Spoilage %" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
