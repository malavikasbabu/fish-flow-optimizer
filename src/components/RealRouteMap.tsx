
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Truck, Navigation } from 'lucide-react';
import { toast } from 'sonner';

// Use Mapbox token from environment or public key
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface RoutePoint {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'port' | 'market' | 'storage';
}

interface RealRouteMapProps {
  origin: RoutePoint;
  destination: RoutePoint;
  waypoints?: RoutePoint[];
  className?: string;
}

const RealRouteMap = ({ origin, destination, waypoints = [], className }: RealRouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // Initialize map
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: origin.coordinates,
        zoom: 8,
      });

      map.current.on('load', () => {
        setIsLoading(false);
        fetchRoute();
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const fetchRoute = async () => {
    if (!map.current) return;

    try {
      setIsLoading(true);
      
      // Build coordinates string for Mapbox Directions API
      const coordinates = [
        origin.coordinates,
        ...waypoints.map(wp => wp.coordinates),
        destination.coordinates
      ].map(coord => `${coord[0]},${coord[1]}`).join(';');

      // Using Mapbox Directions API (free tier)
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData(route);
        displayRoute(route);
      } else {
        throw new Error('No route found');
      }
    } catch (err) {
      console.error('Route fetch error:', err);
      // Fallback to straight line if routing fails
      displayStraightLine();
      toast.error('Using straight line route - routing service unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const displayRoute = (route: any) => {
    if (!map.current) return;

    try {
      // Add route line
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: route.geometry,
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
        },
      });

      // Add markers
      addMarkers();

      // Fit map to route bounds
      const coordinates = route.geometry.coordinates;
      const bounds = coordinates.reduce(
        (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => bounds.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      );
      
      map.current.fitBounds(bounds, { padding: 50 });
    } catch (err) {
      console.error('Error displaying route:', err);
      displayStraightLine();
    }
  };

  const displayStraightLine = () => {
    if (!map.current) return;

    try {
      // Remove existing route if any
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      // Add straight line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [origin.coordinates, destination.coordinates],
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ef4444',
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });

      addMarkers();

      // Fit map to show both points
      const bounds = new mapboxgl.LngLatBounds()
        .extend(origin.coordinates)
        .extend(destination.coordinates);
      
      map.current.fitBounds(bounds, { padding: 100 });
    } catch (err) {
      console.error('Error displaying straight line:', err);
    }
  };

  const addMarkers = () => {
    if (!map.current) return;

    // Add origin marker
    const originEl = document.createElement('div');
    originEl.className = 'w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center';
    originEl.innerHTML = '<div class="w-3 h-3 bg-white rounded-full"></div>';
    
    new mapboxgl.Marker(originEl)
      .setLngLat(origin.coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${origin.name}</strong><br/>Origin ${origin.type}`))
      .addTo(map.current);

    // Add destination marker
    const destEl = document.createElement('div');
    destEl.className = 'w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center';
    destEl.innerHTML = '<div class="w-3 h-3 bg-white rounded-full"></div>';
    
    new mapboxgl.Marker(destEl)
      .setLngLat(destination.coordinates)
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${destination.name}</strong><br/>Destination ${destination.type}`))
      .addTo(map.current);

    // Add waypoint markers
    waypoints.forEach((waypoint) => {
      const waypointEl = document.createElement('div');
      waypointEl.className = 'w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg';
      
      new mapboxgl.Marker(waypointEl)
        .setLngLat(waypoint.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${waypoint.name}</strong><br/>Waypoint ${waypoint.type}`))
        .addTo(map.current);
    });
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Route Visualization
          </CardTitle>
          {routeData ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Real Route
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Straight Line
            </Badge>
          )}
        </div>
        
        {routeData && (
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{formatDistance(routeData.distance)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              <span>{formatDuration(routeData.duration)}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative">
          <div ref={mapContainer} className="h-96 w-full rounded-b-lg" />
          
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-b-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm font-medium">Loading route...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center rounded-b-lg">
              <div className="text-center">
                <p className="text-red-600 font-medium">{error}</p>
                <p className="text-red-500 text-sm mt-1">Showing straight line route</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Route data: {routeData ? 'Mapbox Directions API' : 'Calculated straight line'}</span>
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealRouteMap;
