
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Plus, Edit, Trash2, Save, Users, Truck, Building2, MapPin } from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [ports, setPorts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [coldStorage, setColdStorage] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({});

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    try {
      const [portsRes, marketsRes, trucksRes, coldRes, profilesRes] = await Promise.all([
        supabase.from('ports').select('*').order('name'),
        supabase.from('markets').select('*').order('name'),
        supabase.from('trucks').select('*').order('license_plate'),
        supabase.from('cold_storage').select('*').order('name'),
        supabase.from('profiles').select('*').order('full_name')
      ]);

      setPorts(portsRes.data || []);
      setMarkets(marketsRes.data || []);
      setTrucks(trucksRes.data || []);
      setColdStorage(coldRes.data || []);
      setUsers(profilesRes.data || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const handleSave = async (table: string, item: any) => {
    try {
      if (item.id) {
        // Update existing
        const { error } = await supabase.from(table).update(item).eq('id', item.id);
        if (error) throw error;
        toast.success(`${table} updated successfully`);
      } else {
        // Create new
        const { error } = await supabase.from(table).insert(item);
        if (error) throw error;
        toast.success(`${table} created successfully`);
      }
      
      setEditingItem(null);
      setNewItem({});
      fetchAllData();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      toast.success(`${table} deleted successfully`);
      fetchAllData();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You need administrator privileges to access this page.</p>
            <p className="text-sm text-gray-500">
              Contact your system administrator to request admin access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTable = (data: any[], columns: string[], tableName: string) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold capitalize">{tableName.replace('_', ' ')}</h3>
        <Button onClick={() => setNewItem({ table: tableName })}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(col => (
                <th key={col} className="border border-gray-300 p-2 text-left text-sm font-medium">
                  {col.replace('_', ' ').toUpperCase()}
                </th>
              ))}
              <th className="border border-gray-300 p-2 text-left text-sm font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="border border-gray-300 p-2 text-sm">
                    {editingItem?.id === item.id ? (
                      <Input
                        value={editingItem[col] || ''}
                        onChange={(e) => setEditingItem(prev => ({ ...prev, [col]: e.target.value }))}
                        className="text-sm"
                      />
                    ) : (
                      <span>
                        {typeof item[col] === 'boolean' 
                          ? (item[col] ? 'Yes' : 'No')
                          : item[col]?.toString() || '-'
                        }
                      </span>
                    )}
                  </td>
                ))}
                <td className="border border-gray-300 p-2">
                  <div className="flex space-x-2">
                    {editingItem?.id === item.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSave(tableName, editingItem)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem({ ...item, table: tableName })}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(tableName, item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage all system data and users</p>
      </div>

      <Tabs defaultValue="ports" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ports" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Ports</span>
          </TabsTrigger>
          <TabsTrigger value="markets" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Markets</span>
          </TabsTrigger>
          <TabsTrigger value="trucks" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Trucks</span>
          </TabsTrigger>
          <TabsTrigger value="cold_storage" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Cold Storage</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ports">
          <Card>
            <CardContent className="p-6">
              {renderTable(ports, ['name', 'code', 'region', 'state', 'active'], 'ports')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="markets">
          <Card>
            <CardContent className="p-6">
              {renderTable(markets, ['name', 'city', 'state', 'market_type', 'active'], 'markets')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trucks">
          <Card>
            <CardContent className="p-6">
              {renderTable(trucks, ['license_plate', 'truck_type', 'capacity_kg', 'cost_per_km', 'available'], 'trucks')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cold_storage">
          <Card>
            <CardContent className="p-6">
              {renderTable(coldStorage, ['name', 'city', 'state', 'capacity_kg', 'cost_per_hour', 'active'], 'cold_storage')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-6">
              {renderTable(users, ['full_name', 'role', 'region', 'organization'], 'profiles')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
