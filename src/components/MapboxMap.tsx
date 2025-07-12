import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Route, TrendingUp, AlertTriangle } from 'lucide-react';

// Use a public Mapbox token or OpenStreetMap alternative
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface MapboxMapProps {
  ports?: any[];
  markets?: any[];
  coldStorage?: any[];
  routes?: any[];
  className?: string;
  onRouteClick?: (route: any) => void;
}

const MapboxMap = ({ 
  ports = [], 
  markets = [], 
  coldStorage = [], 
  routes = [], 
  className = "",
  onRouteClick 
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [layerFilters, setLayerFilters] = useState({
    refrigerated: true,
    regular: true,
    coldStorage: true,
    highProfit: true,
    lowSpoilage: true,
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [78.9629, 20.5937], // Center of India
      zoom: 5,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers and sources
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add port markers
    ports.forEach((port) => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.innerHTML = `
        <div style="
          background-color: #3b82f6;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        "></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold">${port.name}</h3>
          <p class="text-sm">Code: ${port.code}</p>
          <p class="text-sm">Region: ${port.region}</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([port.location_lng, port.location_lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add market markers
    markets.forEach((market) => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.innerHTML = `
        <div style="
          background-color: #10b981;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        "></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold">${market.name}</h3>
          <p class="text-sm">City: ${market.city}</p>
          <p class="text-sm">Type: ${market.market_type}</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([market.location_lng, market.location_lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add cold storage markers
    coldStorage.forEach((storage) => {
      const el = document.createElement('div');
      el.className = 'mapbox-marker';
      el.innerHTML = `
        <div style="
          background-color: #f59e0b;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        "></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold">${storage.name}</h3>
          <p class="text-sm">City: ${storage.city}</p>
          <p class="text-sm">Capacity: ${storage.capacity_kg}kg</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([storage.location_lng, storage.location_lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add route lines
    routes.forEach((route, index) => {
      if (!route.route?.source || !route.route?.destination) return;

      const sourceId = `route-${index}`;
      const spoilageColor = route.spoilagePercentage < 5 ? '#10b981' : 
                           route.spoilagePercentage < 15 ? '#f59e0b' : '#ef4444';

      // Create route line
      if (!map.current!.getSource(sourceId)) {
        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              route: route,
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [route.route.source.location_lng, route.route.source.location_lat],
                [route.route.destination.location_lng, route.route.destination.location_lat],
              ],
            },
          },
        });

        map.current!.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': spoilageColor,
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });

        // Add click handler for route
        map.current!.on('click', sourceId, (e) => {
          if (e.features && e.features[0]) {
            const routeData = e.features[0].properties?.route;
            if (routeData) {
              setSelectedRoute(JSON.parse(routeData));
              onRouteClick?.(JSON.parse(routeData));
            }
          }
        });

        // Change cursor on hover
        map.current!.on('mouseenter', sourceId, () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', sourceId, () => {
          map.current!.getCanvas().style.cursor = '';
        });
      }
    });
  }, [ports, markets, coldStorage, routes, onRouteClick]);

  const toggleLayer = (layer: keyof typeof layerFilters) => {
    setLayerFilters(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const getRouteColor = (route: any) => {
    if (route.spoilagePercentage < 5) return 'text-green-600';
    if (route.spoilagePercentage < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Layer Controls */}
      <Card className="absolute top-4 right-4 w-64">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4" />
            <h4 className="font-semibold">Map Layers</h4>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Refrigerated Routes</span>
              <Button
                variant={layerFilters.refrigerated ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLayer('refrigerated')}
              >
                {layerFilters.refrigerated ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Cold Storage Routes</span>
              <Button
                variant={layerFilters.coldStorage ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLayer('coldStorage')}
              >
                {layerFilters.coldStorage ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">High Profit Routes</span>
              <Button
                variant={layerFilters.highProfit ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLayer('highProfit')}
              >
                {layerFilters.highProfit ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Legend */}
      <Card className="absolute bottom-4 right-4 w-64">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3">Route Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500 rounded"></div>
              <span className="text-sm">Low Spoilage (&lt;5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-yellow-500 rounded"></div>
              <span className="text-sm">Medium Spoilage (5-15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500 rounded"></div>
              <span className="text-sm">High Spoilage (&gt;15%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Route Details */}
      {selectedRoute && (
        <Card className="absolute top-4 left-4 w-80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Route className="h-4 w-4" />
                Route Details
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRoute(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="font-medium">{selectedRoute.route.source.name} → {selectedRoute.route.destination.name}</p>
                <p className="text-sm text-gray-600">{selectedRoute.fishType} • {selectedRoute.volume}kg</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Distance</p>
                  <p className="font-medium">{selectedRoute.distance.toFixed(0)} km</p>
                </div>
                <div>
                  <p className="text-gray-600">Travel Time</p>
                  <p className="font-medium">{selectedRoute.travelTime.toFixed(1)} hrs</p>
                </div>
                <div>
                  <p className="text-gray-600">Spoilage</p>
                  <Badge className={getRouteColor(selectedRoute)}>
                    {selectedRoute.spoilagePercentage.toFixed(1)}%
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600">Net Profit</p>
                  <p className={`font-medium ${selectedRoute.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{selectedRoute.netProfit.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Revenue:</span>
                  <span className="text-green-600">₹{selectedRoute.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Cost:</span>
                  <span className="text-red-600">₹{selectedRoute.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MapboxMap;