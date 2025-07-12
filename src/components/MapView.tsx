
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  ports?: any[];
  markets?: any[];
  coldStorage?: any[];
  routes?: any[];
  className?: string;
}

const MapView = ({ ports = [], markets = [], coldStorage = [], routes = [], className = "" }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView([10.8505, 76.2711], 7); // Kerala center
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Custom icons
    const portIcon = L.divIcon({
      html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
      className: 'custom-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const marketIcon = L.divIcon({
      html: '<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
      className: 'custom-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const coldStorageIcon = L.divIcon({
      html: '<div style="background-color: #f59e0b; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
      className: 'custom-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    // Add port markers
    ports.forEach((port) => {
      L.marker([port.location_lat, port.location_lng], { icon: portIcon })
        .bindPopup(`<b>${port.name}</b><br>Port Code: ${port.code}<br>Region: ${port.region}`)
        .addTo(map);
    });

    // Add market markers
    markets.forEach((market) => {
      L.marker([market.location_lat, market.location_lng], { icon: marketIcon })
        .bindPopup(`<b>${market.name}</b><br>City: ${market.city}<br>Type: ${market.market_type}`)
        .addTo(map);
    });

    // Add cold storage markers
    coldStorage.forEach((storage) => {
      L.marker([storage.location_lat, storage.location_lng], { icon: coldStorageIcon })
        .bindPopup(`<b>${storage.name}</b><br>City: ${storage.city}<br>Capacity: ${storage.capacity_kg}kg`)
        .addTo(map);
    });

    // Add routes with freshness gradient
    routes.forEach((route, index) => {
      const spoilageColor = route.spoilage_percentage < 5 ? '#10b981' : 
                           route.spoilage_percentage < 15 ? '#f59e0b' : '#ef4444';
      
      if (route.source && route.destination) {
        const routeLine = L.polyline([
          [route.source.location.lat, route.source.location.lng],
          [route.destination.location.lat, route.destination.location.lng]
        ], {
          color: spoilageColor,
          weight: 4,
          opacity: 0.7,
        }).addTo(map);

        routeLine.bindPopup(`
          <b>Route ${index + 1}</b><br>
          ${route.source.name} → ${route.destination.name}<br>
          Fish: ${route.fishType}<br>
          Spoilage: ${route.spoilage_percentage.toFixed(1)}%<br>
          Profit: ₹${route.netProfit.toLocaleString()}
        `);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ports, markets, coldStorage, routes]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full rounded-lg" />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-sm">
        <h4 className="font-semibold mb-2">Map Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Ports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Markets</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Cold Storage</span>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-gray-600">Route Colors:</div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-1 bg-green-500"></div>
              <span>Low Spoilage (&lt;5%)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-1 bg-amber-500"></div>
              <span>Medium (5-15%)</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-1 bg-red-500"></div>
              <span>High (&gt;15%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
