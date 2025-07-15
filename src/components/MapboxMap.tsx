
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
  const [mapLoaded, setMapLoaded] = useState(false);
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

    // Wait for style to load before allowing data to be added
    map.current.on('style.load', () => {
      console.log('Map style loaded');
      setMapLoaded(true);
    });

    // Handle style data events for better reliability
    map.current.on('styledata', () => {
      if (map.current?.isStyleLoaded()) {
        setMapLoaded(true);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log('Adding map data to loaded map');

    // Clear existing markers and sources
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Clear existing sources and layers
    if (map.current.isStyleLoaded()) {
      const layers = map.current.getStyle().layers || [];
      layers.forEach(layer => {
        if (layer.id.startsWith('route-')) {
          try {
            map.current!.removeLayer(layer.id);
          } catch (e) {
            console.warn('Failed to remove layer:', layer.id);
          }
        }
      });

      const sources = map.current.getStyle().sources || {};
      Object.keys(sources).forEach(sourceId => {
        if (sourceId.startsWith('route-')) {
          try {
            map.current!.removeSource(sourceId);
          } catch (e) {
            console.warn('Failed to remove source:', sourceId);
          }
        }
      });
    }

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

    // Add route lines only if map is loaded and style is ready
    if (map.current.isStyleLoaded()) {
      routes.forEach((route, index) => {
        if (!route.route?.source || !route.route?.destination) return;

        const sourceId = `route-${index}`;
        const spoilageColor = route.spoilagePercentage < 5 ? '#10b981' : 
                             route.spoilagePercentage < 15 ? '#f59e0b' : '#ef4444';

        try {
          // Create route line
          if (!map.current!.getSource(sourceId)) {
            map.current!.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {
                  route: JSON.stringify(route),
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
              if (e.features && e.features[0] && e.features[0].properties) {
                const routeData = e.features[0].properties.route;
                if (routeData) {
                  const parsedRoute = JSON.parse(routeData);
                  setSelectedRoute(parsedRoute);
                  onRouteClick?.(parsedRoute);
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
        } catch (error) {
          console.warn('Failed to add route:', sourceId, error);
        }
      });
    }
  }, [ports, markets, coldStorage, routes, onRouteClick, mapLoaded]);

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
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
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
