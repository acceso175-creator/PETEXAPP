'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MapMarker, MapPolygon, StopStatus } from '@/types';

// TODO: Replace with Google Maps JS API
// import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api';

interface MapPlaceholderProps {
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  showControls?: boolean;
  selectedMarkerId?: string;
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  delivered: '#22c55e',
  failed: '#ef4444',
  active: '#3b82f6',
};

export function MapPlaceholder({
  markers = [],
  polygons = [],
  center = { lat: 28.6353, lng: -106.0889 }, // Chihuahua center
  zoom = 13,
  onMarkerClick,
  onMapClick,
  className,
  showControls = true,
  selectedMarkerId,
}: MapPlaceholderProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  // TODO: Replace this entire component with actual Google Maps implementation
  // const { isLoaded } = useJsApiLoader({
  //   id: 'google-map-script',
  //   googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  // });

  const handleZoomIn = () => setCurrentZoom(prev => Math.min(prev + 1, 20));
  const handleZoomOut = () => setCurrentZoom(prev => Math.max(prev - 1, 5));

  return (
    <Card className={cn('relative overflow-hidden bg-slate-100', className)}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full min-h-[300px] relative"
        onClick={(e) => {
          // TODO: Replace with actual Google Maps click coordinates
          const rect = mapRef.current?.getBoundingClientRect();
          if (rect && onMapClick) {
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            // Mock coordinates calculation
            const lat = center.lat + (0.5 - y) * 0.02;
            const lng = center.lng + (x - 0.5) * 0.03;
            onMapClick({ lat, lng });
          }
        }}
      >
        {/* Placeholder Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200">
          {/* Grid lines to simulate map */}
          <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Roads simulation */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/4 top-0 bottom-0 w-2 bg-slate-300/50" />
            <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-slate-300/70" />
            <div className="absolute left-3/4 top-0 bottom-0 w-2 bg-slate-300/50" />
            <div className="absolute top-1/3 left-0 right-0 h-2 bg-slate-300/50" />
            <div className="absolute top-1/2 left-0 right-0 h-3 bg-slate-300/70" />
            <div className="absolute top-2/3 left-0 right-0 h-2 bg-slate-300/50" />
          </div>
        </div>

        {/* Zone Polygons Placeholder */}
        {polygons.map((polygon, idx) => (
          <div
            key={polygon.id}
            className="absolute opacity-20 rounded-lg"
            style={{
              backgroundColor: polygon.fillColor,
              border: `2px solid ${polygon.strokeColor}`,
              left: `${20 + idx * 15}%`,
              top: `${20 + idx * 10}%`,
              width: '30%',
              height: '25%',
            }}
          >
            {polygon.label && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-slate-700">
                {polygon.label}
              </span>
            )}
          </div>
        ))}

        {/* Markers */}
        {markers.map((marker, idx) => {
          // Calculate position based on lat/lng relative to center
          const x = 50 + ((marker.lng - center.lng) / 0.05) * 30;
          const y = 50 - ((marker.lat - center.lat) / 0.03) * 30;

          return (
            <button
              type="button"
              key={marker.id}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-full transition-all cursor-pointer',
                'hover:scale-110 z-10',
                selectedMarkerId === marker.id && 'scale-125 z-20'
              )}
              style={{
                left: `${Math.max(5, Math.min(95, x))}%`,
                top: `${Math.max(10, Math.min(90, y))}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMarkerClick?.(marker);
              }}
            >
              <div className="relative">
                <MapPin
                  className="h-8 w-8 drop-shadow-md"
                  style={{ color: statusColors[marker.status || 'pending'] }}
                  fill={statusColors[marker.status || 'pending']}
                />
                {marker.label && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold bg-white px-1.5 py-0.5 rounded shadow-sm">
                    {marker.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-lg" />
        </div>

        {/* Map placeholder label */}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          Chihuahua, MX • Zoom {currentZoom}x
        </div>
      </div>

      {/* Map Controls */}
      {showControls && (
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white shadow-md"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white shadow-md"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white shadow-md mt-2"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white shadow-md"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Integration Notice */}
      <div className="absolute bottom-2 right-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded border border-orange-200">
        Google Maps pendiente
      </div>
    </Card>
  );
}

// Export type for map events
export type { MapMarker, MapPolygon };
