import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Fish, Truck, Building2, Plus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type FishType = Database['public']['Enums']['fish_type'];

const DataManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [ports, setPorts] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [catchData, setCatchData] = useState({
    port_id: '',
    fish_type: '' as FishType | '',
    volume_kg: '',
    quality_grade: 'Grade A',
    estimated_price_per_kg: '',
    weather_conditions: ''
  });

  useEffect(() => {
    fetchPorts();
    fetchTrucks();
  }, []);

  const fetchPorts = async () => {
    try {
      const { data, error } = await supabase
        .from('ports')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      setPorts(data || []);
    } catch (error) {
      console.error('Error fetching ports:', error);
      toast.error('Failed to load ports');
    }
  };

  const fetchTrucks = async () => {
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .eq('available', true)
        .order('license_plate');
      
      if (error) throw error;
      setTrucks(data || []);
    } catch (error) {
      console.error('Error fetching trucks:', error);
      toast.error('Failed to load trucks');
    }
  };

  const handleSubmitCatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('daily_catches')
        .insert({
          port_id: catchData.port_id,
          user_id: user.id,
          catch_date: new Date().toISOString().split('T')[0],
          fish_type: catchData.fish_type as FishType,
          volume_kg: parseInt(catchData.volume_kg),
          quality_grade: catchData.quality_grade,
          estimated_price_per_kg: parseFloat(catchData.estimated_price_per_kg),
          weather_conditions: catchData.weather_conditions
        });

      if (error) throw error;

      toast.success('Catch data recorded successfully!');
      setCatchData({
        port_id: '',
        fish_type: '',
        volume_kg: '',
        quality_grade: 'Grade A',
        estimated_price_per_kg: '',
        weather_conditions: ''
      });
    } catch (error) {
      console.error('Error submitting catch data:', error);
      toast.error('Failed to record catch data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
        <p className="text-gray-600">Record daily catch data and manage resources</p>
      </div>

      {/* Daily Catch Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Fish className="h-5 w-5 text-blue-600" />
            <span>Daily Catch Entry</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCatch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="port">Fishing Port</Label>
                <Select
                  value={catchData.port_id}
                  onValueChange={(value) => setCatchData(prev => ({ ...prev, port_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a port" />
                  </SelectTrigger>
                  <SelectContent>
                    {ports.map((port: any) => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.name} ({port.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fish_type">Fish Type</Label>
                <Select
                  value={catchData.fish_type}
                  onValueChange={(value) => setCatchData(prev => ({ ...prev, fish_type: value as FishType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fish type" />
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
                <Label htmlFor="volume">Volume (kg)</Label>
                <Input
                  id="volume"
                  type="number"
                  value={catchData.volume_kg}
                  onChange={(e) => setCatchData(prev => ({ ...prev, volume_kg: e.target.value }))}
                  placeholder="Enter volume in kg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Estimated Price per Kg (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={catchData.estimated_price_per_kg}
                  onChange={(e) => setCatchData(prev => ({ ...prev, estimated_price_per_kg: e.target.value }))}
                  placeholder="Enter price per kg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">Quality Grade</Label>
                <Select
                  value={catchData.quality_grade}
                  onValueChange={(value) => setCatchData(prev => ({ ...prev, quality_grade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade A">Grade A (Premium)</SelectItem>
                    <SelectItem value="Grade B">Grade B (Standard)</SelectItem>
                    <SelectItem value="Grade C">Grade C (Basic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weather">Weather Conditions</Label>
                <Input
                  id="weather"
                  value={catchData.weather_conditions}
                  onChange={(e) => setCatchData(prev => ({ ...prev, weather_conditions: e.target.value }))}
                  placeholder="e.g., Clear, Cloudy, Rainy"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !catchData.port_id || !catchData.fish_type || !catchData.volume_kg}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Recording...' : 'Record Catch Data'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Available Resources Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-green-600" />
              <span>Available Trucks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trucks.slice(0, 5).map((truck: any) => (
                <div key={truck.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{truck.license_plate}</span>
                  <div className="text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded text-xs ${
                      truck.truck_type === 'refrigerated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {truck.truck_type}
                    </span>
                    <span className="ml-2">{truck.capacity_kg}kg</span>
                  </div>
                </div>
              ))}
              {trucks.length === 0 && (
                <p className="text-gray-500 text-center py-4">No trucks available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <span>Nearby Ports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ports.slice(0, 5).map((port: any) => (
                <div key={port.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{port.name}</span>
                  <div className="text-sm text-gray-600">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      {port.region}
                    </span>
                  </div>
                </div>
              ))}
              {ports.length === 0 && (
                <p className="text-gray-500 text-center py-4">No ports available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataManagement;
