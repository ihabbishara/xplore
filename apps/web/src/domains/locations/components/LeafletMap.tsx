'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationSearchResult } from '@xplore/shared';

// Fix for default markers in Leaflet
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  className?: string;
  locations: LocationSearchResult[];
  selectedLocation?: LocationSearchResult | null;
  onMarkerClick?: (location: LocationSearchResult) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  className = '',
  locations,
  selectedLocation,
  onMarkerClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([48.8566, 2.3522], 5);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (locations.length === 0) return;

    // Add markers for locations
    const bounds = L.latLngBounds([]);
    
    locations.forEach((location) => {
      const isSelected = selectedLocation?.id === location.id;
      
      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative">
            <div class="absolute inset-0 rounded-full ${isSelected ? 'bg-red-400' : 'bg-blue-400'} animate-ping opacity-75"></div>
            <div class="relative w-10 h-10 rounded-full shadow-lg ${
              isSelected
                ? 'bg-gradient-to-br from-red-400 to-red-600 ring-4 ring-red-200'
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            }">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([location.coordinates.lat, location.coordinates.lng], { icon })
        .addTo(mapInstanceRef.current!)
        .bindTooltip(location.name, { 
          permanent: false, 
          direction: 'top',
          offset: [0, -20]
        });

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(location));
      }

      markersRef.current.push(marker);
      bounds.extend([location.coordinates.lat, location.coordinates.lng]);
    });

    // Fit map to show all markers
    if (locations.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, selectedLocation, onMarkerClick]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Map Controls */}
      <div className="absolute bottom-24 right-4 z-[1000] space-y-2">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="block p-3 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
          title="Zoom In"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="block p-3 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300"
          title="Zoom Out"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Location Counter */}
      {locations.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="bg-white/90 backdrop-blur-lg rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-medium text-gray-900">
              {locations.length} location{locations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};