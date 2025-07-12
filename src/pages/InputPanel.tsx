
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Save, Fish, Truck, Building2 } from 'lucide-react';
import { FishType } from '../types';
import { mockPorts, mockTrucks } from '../data/mockData';
import { toast } from 'sonner';

interface FishEntry {
  type: FishType;
  volume: number;
}

const InputPanel = () => {
  const [selectedPort, setSelectedPort] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fishEntries, setFishEntries] = useState<FishEntry[]>([
    { type: FishType.TILAPIA, volume: 0 }
  ]);
  const [truckAvailability, setTruckAvailability] = useState(
    mockTrucks.map(truck => ({ ...truck, count: truck.available ? 1 : 0 }))
  );

  const addFishEntry = () => {
    setFishEntries([...fishEntries, { type: FishType.TILAPIA, volume: 0 }]);
  };

  const removeFishEntry = (index: number) => {
    if (fishEntries.length > 1) {
      setFishEntries(fishEntries.filter((_, i) => i !== index));
    }
  };

  const updateFishEntry = (index: number, field: keyof FishEntry, value: any) => {
    const updated = fishEntries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    );
    setFishEntries(updated);
  };

  const updateTruckCount = (truckId: string, count: number) => {
    setTruckAvailability(prev => 
      prev.map(truck => 
        truck.id === truckId ? { ...truck, count: Math.max(0, count) } : truck
      )
    );
  };

  const handleSave = () => {
    if (!selectedPort) {
      toast.error("Please select a port");
      return;
    }

    const totalCatch = fishEntries.reduce((sum, entry) => sum + entry.volume, 0);
    if (totalCatch === 0) {
      toast.error("Please enter fish catch volumes");
      return;
    }

    const totalTrucks = truckAvailability.reduce((sum, truck) => sum + truck.count, 0);
    if (totalTrucks === 0) {
      toast.error("Please specify truck availability");
      return;
    }

    // Here you would typically save to a database or state management
    toast.success("Daily data saved successfully!");
    console.log({
      port: selectedPort,
      date: selectedDate,
      fishEntries,
      truckAvailability: truckAvailability.filter(t => t.count > 0)
    });
  };

  const getTotalCatch = () => {
    return fishEntries.reduce((sum, entry) => sum + entry.volume, 0);
  };

  const getTotalTrucks = () => {
    return truckAvailability.reduce((sum, truck) => sum + truck.count, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Daily Data Entry
          </h1>
          <p className="text-lg text-gray-600">
            Input catch volumes and resource availability
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Catch</p>
                  <p className="text-xl font-bold text-blue-600">{getTotalCatch()} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Available Trucks</p>
                  <p className="text-xl font-bold text-green-600">{getTotalTrucks()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Selected Port</p>
                  <p className="text-lg font-bold text-purple-600">
                    {selectedPort ? mockPorts.find(p => p.id === selectedPort)?.name : 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Port and Date Selection */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Port & Date Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="port">Select Port</Label>
                <Select value={selectedPort} onValueChange={setSelectedPort}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a port" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPorts.map(port => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fish Catch Entry */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-blue-600" />
                Fish Catch Data
              </CardTitle>
              <Button onClick={addFishEntry} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Fish Type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fishEntries.map((entry, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm">Fish Type</Label>
                  <Select
                    value={entry.type}
                    onValueChange={(value: FishType) => updateFishEntry(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(FishType).map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-sm">Volume (kg)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={entry.volume}
                    onChange={(e) => updateFishEntry(index, 'volume', parseInt(e.target.value) || 0)}
                    placeholder="Enter volume"
                  />
                </div>

                {fishEntries.length > 1 && (
                  <Button
                    onClick={() => removeFishEntry(index)}
                    size="sm"
                    variant="destructive"
                    className="mt-6"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Truck Availability */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Truck Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {truckAvailability.map((truck) => (
              <div key={truck.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={truck.type === 'Refrigerated' ? 'default' : 'secondary'}>
                      {truck.type}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {truck.capacity}kg capacity • ₹{truck.costPerKm}/km
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Max distance: {truck.maxDistance}km
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => updateTruckCount(truck.id, truck.count - 1)}
                    size="sm"
                    variant="outline"
                    disabled={truck.count === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{truck.count}</span>
                  <Button
                    onClick={() => updateTruckCount(truck.id, truck.count + 1)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <Button 
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Daily Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InputPanel;
