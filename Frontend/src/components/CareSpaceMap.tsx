import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap
} from '@vis.gl/react-google-maps';
import {
  DesignatedRoute,
  LatLng
} from '../services/careSpaceService';
import {
  MapPin,
  Home,
  Navigation,
  Compass,
  AlertOctagon,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface CareSpaceMapProps {
  route: DesignatedRoute;
  currentPosition: LatLng;
  isDeviated: boolean;
  deviatedMeters: number;
  isTrackingActive: boolean;
  interactive?: boolean;
}

// Polyline manager component using Google Maps JS API via useMap hook
const RoutePolylineLayer: React.FC<{
  path: LatLng[];
  currentPosition: LatLng;
  isDeviated: boolean;
}> = ({ path, currentPosition, isDeviated }) => {
  const map = useMap();
  const mainPolylineRef = useRef<google.maps.Polyline | null>(null);
  const corridorPolylineRef = useRef<google.maps.Polyline | null>(null);
  const deviationLineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    // Remove existing
    if (mainPolylineRef.current) mainPolylineRef.current.setMap(null);
    if (corridorPolylineRef.current) corridorPolylineRef.current.setMap(null);
    if (deviationLineRef.current) deviationLineRef.current.setMap(null);

    // 1. Broad Safe Corridor (translucent buffer)
    corridorPolylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#10b981', // emerald
      strokeOpacity: 0.25,
      strokeWeight: 24,
      map
    });

    // 2. Primary Route Polyline (DemenX dark stroke)
    mainPolylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#09090b',
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map
    });

    // 3. Deviation Polyline (red dashed line from nearest path point to deviated position)
    if (isDeviated) {
      // Connect nearest waypoint to deviated point
      const nearestPoint = path[1] || path[0];
      deviationLineRef.current = new google.maps.Polyline({
        path: [nearestPoint, currentPosition],
        geodesic: true,
        strokeColor: '#ef4444', // red
        strokeOpacity: 0.9,
        strokeWeight: 4,
        icons: [
          {
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
            offset: '0',
            repeat: '14px'
          }
        ],
        map
      });
    }

    return () => {
      if (mainPolylineRef.current) mainPolylineRef.current.setMap(null);
      if (corridorPolylineRef.current) corridorPolylineRef.current.setMap(null);
      if (deviationLineRef.current) deviationLineRef.current.setMap(null);
    };
  }, [map, path, isDeviated, currentPosition]);

  return null;
};

// Camera auto-follow component
const CameraFollower: React.FC<{ target: LatLng }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(target);
    }
  }, [map, target]);
  return null;
};

export const CareSpaceMap: React.FC<CareSpaceMapProps> = ({
  route,
  currentPosition,
  isDeviated,
  deviatedMeters,
  isTrackingActive
}) => {
  const apiKey = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_MAPS_API_KEY;
  const [mapError, setMapError] = useState(!apiKey);

  // Center coordinate between start and destination
  const centerLat = (route.origin.lat + route.destination.lat) / 2;
  const centerLng = (route.origin.lng + route.destination.lng) / 2;

  return (
    <div className="relative w-full aspect-square max-w-[540px] mx-auto rounded-3xl border-2 border-[#09090b] shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] overflow-hidden bg-neutral-100 flex flex-col">
      
      {/* Map Top Floating Header / Status Badge */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-300 shadow-sm flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isDeviated ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="text-[11px] font-bold text-black uppercase tracking-wider">
            {isDeviated ? `DEVIATED (+${deviatedMeters}m)` : 'ON SAFE ROUTE'}
          </span>
        </div>

        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-neutral-300 shadow-sm flex items-center gap-1.5 text-[10px] font-semibold text-neutral-700">
          <Compass className="w-3.5 h-3.5 text-neutral-600 animate-spin" style={{ animationDuration: '10s' }} />
          <span>Live GPS</span>
        </div>
      </div>

      {/* Main Google Map Container */}
      <div className="w-full h-full relative">
        {!mapError ? (
          <APIProvider apiKey={apiKey}>
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={{ lat: centerLat, lng: centerLng }}
              defaultZoom={15.5}
              gestureHandling="greedy"
              disableDefaultUI={true}
              zoomControl={true}
              className="w-full h-full"
            >
              <CameraFollower target={currentPosition} />
              <RoutePolylineLayer
                path={route.path}
                currentPosition={currentPosition}
                isDeviated={isDeviated}
              />

              {/* Start Marker (Home) */}
              <AdvancedMarker position={route.origin}>
                <div className="p-2 rounded-2xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transform -translate-y-1 hover:scale-110 transition-transform">
                  <Home className="w-4 h-4 text-black" />
                </div>
              </AdvancedMarker>

              {/* Destination Marker */}
              <AdvancedMarker position={route.destination}>
                <div className="p-2 rounded-2xl bg-emerald-500 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center transform -translate-y-1 hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4 fill-white" />
                </div>
              </AdvancedMarker>

              {/* Patient Live Location Marker */}
              <AdvancedMarker position={currentPosition}>
                <div className="relative flex items-center justify-center">
                  {/* Radar pulse ring */}
                  <span
                    className={`absolute w-12 h-12 rounded-full animate-ping opacity-75 ${
                      isDeviated ? 'bg-red-500' : 'bg-emerald-400'
                    }`}
                  />
                  {/* Main Avatar Beacon */}
                  <div
                    className={`relative w-9 h-9 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-bold text-xs text-white z-10 transition-colors ${
                      isDeviated ? 'bg-red-600 animate-bounce' : 'bg-[#09090b]'
                    }`}
                  >
                    <Navigation className="w-4 h-4 fill-white -rotate-45" />
                  </div>
                </div>
              </AdvancedMarker>
            </Map>
          </APIProvider>
        ) : (
          /* Fallback interactive canvas in case of network restrictions */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-100">
            <AlertOctagon className="w-10 h-10 text-neutral-400 mb-2" />
            <p className="text-xs font-bold text-black">Live Tracker Offline Map</p>
            <p className="text-[11px] text-neutral-500">Connecting to Google Maps Satellite Service...</p>
          </div>
        )}
      </div>

      {/* Map Bottom Information Strip */}
      <div className="p-3 bg-white border-t-2 border-[#09090b] flex items-center justify-between shrink-0 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black" />
          <span className="font-bold text-neutral-900 truncate max-w-[210px] sm:max-w-xs">
            {route.destinationName}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-600 shrink-0">
          <span>{route.totalDistanceKm} km</span>
          <span>•</span>
          <span>~{route.estimatedMinutes} min</span>
        </div>
      </div>

    </div>
  );
};
