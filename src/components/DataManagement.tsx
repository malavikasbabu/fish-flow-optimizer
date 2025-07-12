import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CSVLink } from 'react-csv';
import Papa from 'papaparse';
import {
  Database,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  Truck,
  Building2,
  Fish,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

const DataManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ports');
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Data states
  const [ports, setPorts] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [coldStorage, setColdStorage] = useState<any[]>([]);
  const [marketDemand, setMarketDemand] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: portsData },
        { data: marketsData },
        { data: trucksData },
        { data: coldStorageData },
        { data: demandData },
      ] = await Promise.all([
        supabase.from('ports').select('*').order('name'),
        supabase.from('markets').select('*').order('name'),
        supabase.from('trucks').select('*').order('license_plate'),
        supabase.from('cold_storage').select('*').order('name'),
        supabase.from('market_demand').select('*, markets(name)').order('demand_date', { ascending: false }),
      ]);

      setPorts(portsData || []);
      setMarkets(marketsData || []);
      setTrucks(trucksData || []);
      setColdStorage(coldStorageData || []);
      setMarketDemand(demandData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (tableName: string, data: any) => {
    try {
      if (editingItem?.id) {
        // Update existing
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Item updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from(tableName)
          .insert(data);
        
        if (error) throw error;
        toast.success('Item created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
      fetchAllData();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleDelete = async (tableName: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Item deleted successfully');
      fetchAllData();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const handleImport = (file: File, tableName: string) => {
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const { error } = await supabase
            .from(tableName)
            .insert(results.data);
          
          if (error) throw error;
          toast.success(`Imported ${results.data.length} items`);
          fetchAllData();
        } catch (error: any) {
          console.error('Import error:', error);
          toast.error(error.message || 'Failed to import data');
        }
      },
      error: (error) => {
        console.error('Parse error:', error);
        toast.error('Failed to parse CSV file');
      }
    });
  };

  const PortsTable = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Ports Management</h3>
          <Badge variant="secondary">{ports.length} ports</Badge>
        </div>
        <div className="flex gap-2">
          <CSVLink data={ports} filename="ports.csv">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CSVLink>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0], 'ports')}
            className="hidden"
            id="import-ports"
          />
          <Button variant="outline" size="sm" onClick={() => document.getElementById('import-ports')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditingItem(null); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Port
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Port' : 'Add New Port'}</DialogTitle>
              </DialogHeader>
              <PortForm onSave={(data) => handleSave('ports', data)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ports.map((port) => (
            <TableRow key={port.id}>
              <TableCell className="font-medium">{port.name}</TableCell>
              <TableCell>{port.code}</TableCell>
              <TableCell>{port.location_lat.toFixed(4)}, {port.location_lng.toFixed(4)}</TableCell>
              <TableCell>{port.region}</TableCell>
              <TableCell>
                <Badge variant={port.active ? "default" : "secondary"}>
                  {port.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingItem(port); setIsDialogOpen(true); }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete('ports', port.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const PortForm = ({ onSave }: { onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      name: editingItem?.name || '',
      code: editingItem?.code || '',
      location_lat: editingItem?.location_lat || '',
      location_lng: editingItem?.location_lng || '',
      region: editingItem?.region || '',
      state: editingItem?.state || '',
      contact_person: editingItem?.contact_person || '',
      phone: editingItem?.phone || '',
      active: editingItem?.active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        location_lat: parseFloat(formData.location_lat),
        location_lng: parseFloat(formData.location_lng),
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Port Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="code">Port Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={formData.location_lat}
              onChange={(e) => setFormData(prev => ({ ...prev, location_lat: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              value={formData.location_lng}
              onChange={(e) => setFormData(prev => ({ ...prev, location_lng: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              value={formData.region}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact">Contact Person</Label>
            <Input
              id="contact"
              value={formData.contact_person}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">
            {editingItem ? 'Update' : 'Create'} Port
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Data Management</h2>
        </div>
        <Button onClick={fetchAllData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ports" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ports
          </TabsTrigger>
          <TabsTrigger value="markets" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Markets
          </TabsTrigger>
          <TabsTrigger value="trucks" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Trucks
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Cold Storage
          </TabsTrigger>
          <TabsTrigger value="demand" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Market Demand
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ports">
          <Card>
            <CardContent className="p-6">
              <PortsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markets">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Markets Management</h3>
                <p className="text-gray-600">Manage market locations and demand data</p>
                <Button className="mt-4">Add Market</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trucks">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fleet Management</h3>
                <p className="text-gray-600">Manage truck fleet and availability</p>
                <Button className="mt-4">Add Truck</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Cold Storage Management</h3>
                <p className="text-gray-600">Manage cold storage facilities and capacity</p>
                <Button className="mt-4">Add Storage Facility</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Market Demand</h3>
                <p className="text-gray-600">Manage market demand and pricing data</p>
                <Button className="mt-4">Add Demand Entry</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;