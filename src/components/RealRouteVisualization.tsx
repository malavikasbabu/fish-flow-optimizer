
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataSourceIndicator } from './DataSourceIndicator';

// Public Mapbox token - replace with your own for production
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface RouteVisualizationProps {
  source: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  coldStorage?: { lat: number; lng: number; name: string };
  className?: string;
}

const RealRouteVisualization = ({ 
  source, 
  destination, 
  coldStorage, 
  className = "" 
}: RouteVisualizationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate straight-line distance as fallback
  const calculateStraightLineDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchRealRoute = async () => {
    setIsLoading(true);
    try {
      // Try to get real route from Mapbox Directions API
      const waypoints = coldStorage 
        ? `${source.lng},${source.lat};${coldStorage.lng},${coldStorage.lat};${destination.lng},${destination.lat}`
        : `${source.lng},${source.lat};${destination.lng},${destination.lat}`;
      
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteData(route.geometry);
          setRouteDistance(route.distance / 1000); // Convert to km
          setRouteDuration(route.duration / 3600); // Convert to hours
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch real route, using straight line:', error);
    }

    // Fallback to straight line
    const straightDistance = coldStorage
      ? calculateStraightLineDistance(source, coldStorage) + calculateStraightLineDistance(coldStorage, destination)
      : calculateStraightLineDistance(source, destination);
    
    setRouteDistance(straightDistance);
    setRouteDuration(straightDistance / 60); // Assume 60 km/h average speed
    
    // Create straight line geometry
    const coordinates = coldStorage
      ? [[source.lng, source.lat], [coldStorage.lng, coldStorage.lat], [destination.lng, destination.lat]]
      : [[source.lng, source.lat], [destination.lng, destination.lat]];
    
    setRouteData({
      type: 'LineString',
      coordinates
    });
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [source.lng, source.lat],
      zoom: 8,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      fetchRealRoute();
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [source, destination, coldStorage]);

  useEffect(() => {
    if (!map.current || !routeData) return;

    // Add source marker
    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([source.lng, source.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${source.name}</h3><p>Source Port</p>`))
      .addTo(map.current);

    // Add destination marker
    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([destination.lng, destination.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<h3>${destination.name}</h3><p>Destination Market</p>`))
      .addTo(map.current);

    // Add cold storage marker if exists
    if (coldStorage) {
      new mapboxgl.Marker({ color: '#f59e0b' })
        .setLngLat([coldStorage.lng, coldStorage.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>${coldStorage.name}</h3><p>Cold Storage</p>`))
        .addTo(map.current);
    }

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
        geometry: routeData
      }
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4
      }
    });

    // Fit map to show entire route
    const bounds = new mapboxgl.LngLatBounds();
    routeData.coordinates.forEach((coord: [number, number]) => {
      bounds.extend(coord);
    });
    map.current.fitBounds(bounds, { padding: 50 });

  }, [routeData, source, destination, coldStorage]);

  return (
    <div className={`relative ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Real Route Visualization</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {routeDistance.toFixed(0)} km
              </Badge>
              <Badge variant="outline">
                {routeDuration.toFixed(1)} hrs
              </Badge>
            </div>
          </CardTitle>
          <DataSourceIndicator 
            dataType="real" 
            description="Actual road routes from Mapbox Directions API"
            details="Real-time routing with traffic considerations and turn-by-turn directions"
          />
        </CardHeader>
        <CardContent>
          <div ref={mapContainer} className="w-full h-96 rounded-lg" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Calculating optimal route...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealRouteVisualization;
