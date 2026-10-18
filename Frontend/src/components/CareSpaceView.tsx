import React, { useState, useEffect, useRef } from 'react';
import {
  DESIGNATED_ROUTES,
  DesignatedRoute,
  DEVIATION_OFFSET,
  LatLng,
  getCareSpaceState,
  saveCareSpaceState,
  addCareSpaceAlert,
  alertSiren,
  playVoiceGuidance,
  calculateDistanceMeters
} from '../services/careSpaceService';
import { CareSpaceMap } from './CareSpaceMap';
import {
  Navigation,
  Compass,
  AlertTriangle,
  Volume2,
  VolumeX,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Home,
  Send,
  Bell,
  Info,
  Footprints,
  PhoneCall,
  UserCheck
} from 'lucide-react';

interface CareSpaceViewProps {
  patientName?: string;
  onNavigateTab?: (tab: string) => void;
}

export const CareSpaceView: React.FC<CareSpaceViewProps> = ({
  patientName = 'Demo Patient (DX-4091)',
  onNavigateTab
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('morning-walk');
  const [currentRoute, setCurrentRoute] = useState<DesignatedRoute>(DESIGNATED_ROUTES[0]);
  const [pathIndex, setPathIndex] = useState<number>(1);
  const [currentPosition, setCurrentPosition] = useState<LatLng>(DESIGNATED_ROUTES[0].path[1]);
  const [isDeviated, setIsDeviated] = useState<boolean>(false);
  const [deviatedMeters, setDeviatedMeters] = useState<number>(0);
  const [isSirenMuted, setIsSirenMuted] = useState<boolean>(false);
  const [isWalkingAuto, setIsWalkingAuto] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'active' | 'unavailable'>('requesting');
  const lastGpsAlertAt = useRef(0);

  // Sync route selection
  useEffect(() => {
    const found = DESIGNATED_ROUTES.find((r) => r.id === selectedRouteId) || DESIGNATED_ROUTES[0];
    setCurrentRoute(found);
    setPathIndex(1);
    setCurrentPosition(found.path[1] || found.origin);
    setIsDeviated(false);
    setDeviatedMeters(0);
    alertSiren.stop();
  }, [selectedRouteId]);

  // Load initial shared state
  useEffect(() => {
    const state = getCareSpaceState();
    if (state) {
      setSelectedRouteId(state.selectedRouteId || 'morning-walk');
      setIsDeviated(state.isDeviated);
      setDeviatedMeters(state.deviatedMeters);
      if (state.currentPosition) {
        setCurrentPosition(state.currentPosition);
      }
    }

    return () => {
      alertSiren.stop();
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        const nearest = currentRoute.path.reduce(
          (closest, point, index) => {
            const distance = calculateDistanceMeters(location, point);
            return distance < closest.distance ? { distance, index } : closest;
          },
          { distance: Number.POSITIVE_INFINITY, index: 0 }
        );
        const deviated = nearest.distance > 100;
        setGpsStatus('active');
        setCurrentPosition(location);
        setPathIndex(nearest.index);
        setIsDeviated(deviated);
        setDeviatedMeters(deviated ? nearest.distance : 0);
        broadcastState(location, deviated, deviated ? nearest.distance : 0, nearest.index);

        if (deviated && Date.now() - lastGpsAlertAt.current > 30000) {
          lastGpsAlertAt.current = Date.now();
          if (!isSirenMuted) alertSiren.start();
          const guidance = `Attention: you are outside your designated route to ${currentRoute.destinationName}. Please turn around and continue along the safe path.`;
          playVoiceGuidance(guidance);
          addCareSpaceAlert({
            severity: 'critical',
            patientId: 'DX-4091',
            patientName,
            routeName: currentRoute.name,
            routeReason: currentRoute.reason,
            deviatedMeters: nearest.distance,
            location,
            locationDescription: 'Live GPS position outside the safe route corridor',
            message: `${patientName} has deviated ${nearest.distance}m from the designated route.`,
            guidanceGiven: guidance,
            sirenActive: !isSirenMuted,
            status: 'active'
          });
          showToast('Route deviation detected. Caretaker has been alerted.');
        }
      },
      () => setGpsStatus('unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentRoute, isSirenMuted, patientName]);

  // Update shared state in localStorage whenever position or deviation changes
  const broadcastState = (pos: LatLng, deviated: boolean, devMeters: number, pIdx: number) => {
    saveCareSpaceState({
      selectedRouteId: currentRoute.id,
      isTrackingActive: true,
      currentPosition: pos,
      pathIndex: pIdx,
      isDeviated: deviated,
      deviatedMeters: devMeters,
      sirenActive: deviated && !isSirenMuted,
      lastPingTime: new Date().toISOString()
    });
  };

  // Trigger Deviation (Go Outside Route)
  const handleSimulateDeviation = () => {
    const basePathPoint = currentRoute.path[pathIndex] || currentRoute.path[1];
    const deviatedPoint: LatLng = {
      lat: basePathPoint.lat + DEVIATION_OFFSET.lat,
      lng: basePathPoint.lng + DEVIATION_OFFSET.lng
    };

    const dist = calculateDistanceMeters(basePathPoint, deviatedPoint);
    setIsDeviated(true);
    setDeviatedMeters(dist);
    setCurrentPosition(deviatedPoint);

    // 1. Play audible alert siren
    if (!isSirenMuted) {
      alertSiren.start();
    }

    // 2. Play spoken guidance to remind the patient of their designated route & reason
    const guidanceText = `Attention: You have stepped outside your route. You are walking to ${currentRoute.destinationName} for your ${currentRoute.reason}. Please turn around and keep walking down your designated path.`;
    playVoiceGuidance(guidanceText);

    // 3. Dispatch automated emergency message to Caretaker
    const caretakerMessage = `🚨 [CareSpace Safety Alert] ${patientName} has deviated ${dist}m from safe route '${currentRoute.name}'. Destination: ${currentRoute.destinationName} (${currentRoute.reason}). Current GPS: ${deviatedPoint.lat.toFixed(5)}, ${deviatedPoint.lng.toFixed(5)}. Alert siren triggered on device.`;
    
    addCareSpaceAlert({
      severity: 'critical',
      patientId: 'DX-4091',
      patientName,
      routeName: currentRoute.name,
      routeReason: currentRoute.reason,
      deviatedMeters: dist,
      location: deviatedPoint,
      locationDescription: 'Alleyway off Elm & Franklin St (~140m from path)',
      message: caretakerMessage,
      guidanceGiven: guidanceText,
      sirenActive: true,
      status: 'active'
    });

    broadcastState(deviatedPoint, true, dist, pathIndex);
    showToast('🚨 Siren Alert Active & Safety Message Sent to Caretaker!');
  };

  // Return safely onto the designated route
  const handleReturnToRoute = () => {
    alertSiren.stop();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const safePoint = currentRoute.path[pathIndex] || currentRoute.path[1];
    setIsDeviated(false);
    setDeviatedMeters(0);
    setCurrentPosition(safePoint);

    // Dispatch safe return notice to caretaker
    addCareSpaceAlert({
      severity: 'info',
      patientId: 'DX-4091',
      patientName,
      routeName: currentRoute.name,
      routeReason: currentRoute.reason,
      location: safePoint,
      locationDescription: 'Back within safe designated corridor',
      message: `✅ Patient safely returned to designated path for '${currentRoute.name}'. Siren deactivated.`,
      guidanceGiven: 'Safe corridor restored.',
      sirenActive: false,
      status: 'resolved'
    });

    broadcastState(safePoint, false, 0, pathIndex);
    showToast('✅ Safely returned to designated path. Siren silenced.');
  };

  // Step forward along path
  const handleStepForward = () => {
    if (isDeviated) {
      handleReturnToRoute();
      return;
    }
    const nextIdx = (pathIndex + 1) % currentRoute.path.length;
    setPathIndex(nextIdx);
    const nextPoint = currentRoute.path[nextIdx];
    setCurrentPosition(nextPoint);
    broadcastState(nextPoint, false, 0, nextIdx);
    showToast(`Step advanced to waypoint #${nextIdx + 1}`);
  };

  const toggleSirenMute = () => {
    if (isSirenMuted) {
      setIsSirenMuted(false);
      if (isDeviated) alertSiren.start();
    } else {
      setIsSirenMuted(true);
      alertSiren.stop();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#09090b] text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-3 animate-in slide-in-from-top-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              CareSpace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide border border-emerald-300">
              Patients Safety Suite
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-normal mt-0.5">
            Live route tracking, designated walking corridor, and automated caretaker safety broadcast
          </p>
          <p className="mt-2 text-[11px] font-semibold text-neutral-500">
            GPS: <span className={gpsStatus === 'active' ? 'text-emerald-700' : 'text-amber-700'}>
              {gpsStatus === 'active' ? 'live location active' : gpsStatus === 'requesting' ? 'requesting permission' : 'unavailable; simulation available'}
            </span>
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2.5">
          {isDeviated ? (
            <button
              onClick={handleReturnToRoute}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Designated Route</span>
            </button>
          ) : (
            <button
              onClick={handleStepForward}
              className="px-4 py-2 rounded-xl bg-[#09090b] hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Footprints className="w-4 h-4" />
              <span>Simulate Walk Step</span>
            </button>
          )}

          {isDeviated && (
            <button
              onClick={toggleSirenMute}
              className={`p-2 rounded-xl border border-neutral-300 flex items-center justify-center cursor-pointer transition-colors ${
                isSirenMuted ? 'bg-neutral-100 text-neutral-600' : 'bg-red-50 text-red-600 border-red-300 animate-pulse'
              }`}
              title={isSirenMuted ? 'Unmute Siren' : 'Mute Siren'}
            >
              {isSirenMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* ALERT SIREN & GUIDANCE BANNER (ACTIVE WHEN DEVIATED) */}
      {isDeviated && (
        <div className="p-4 sm:p-5 rounded-3xl bg-red-50 border-2 border-red-500 shadow-[5px_5px_0px_0px_rgba(239,68,68,1)] space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                <AlertTriangle className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-red-900 tracking-tight">
                    ROUTE DEVIATION DETECTED ({deviatedMeters}m OFF PATH)
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-red-200 text-red-900 font-mono text-[10px] font-bold animate-pulse">
                    SIREN ACTIVE
                  </span>
                </div>
                <p className="text-xs text-red-800 mt-1 leading-relaxed font-medium">
                  <strong>Patient Guidance Reminder:</strong> You are heading towards <u>{currentRoute.destinationName}</u> for your <em>{currentRoute.reason}</em>. Please turn back towards Elm Street to stay on your safe route!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReturnToRoute}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Steer Back to Route →
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-red-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-red-800">
            <div className="flex items-center gap-1.5 font-semibold">
              <Send className="w-3.5 h-3.5 text-red-600" />
              <span>Automated SOS dispatch sent to Caretaker (Rahul Caregiver)</span>
            </div>
            <span className="font-mono text-red-700">GPS Ping: {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}</span>
          </div>
        </div>
      )}

      {/* ROUTE SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DESIGNATED_ROUTES.map((route) => {
          const isSelected = route.id === selectedRouteId;
          return (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border-2 ${
                isSelected
                  ? 'bg-[#09090b] text-white border-black shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-black hover:text-black'
              }`}
            >
              {route.name}
            </button>
          );
        })}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT INFO CARDS & RIGHT SQUARE GOOGLE MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ROUTE DETAILS & PURPOSE (Spans 6 cols on LG) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Card 1: Route Purpose & XYZ Reason */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Designated Safe Route
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[10px] font-bold border border-neutral-300">
                Geofence Corridor ±30m
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-black tracking-tight">
                {currentRoute.name}
              </h2>
              {/* XYZ Reason Callout */}
              <div className="mt-2.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs leading-relaxed">
                <span className="font-bold text-black block mb-0.5">Route Purpose & Medical Reason:</span>
                "{currentRoute.reason}"
              </div>
            </div>

            {/* Origin & Destination Nodes */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-300 flex items-center justify-center shrink-0 font-bold text-black text-xs">
                  <Home className="w-4 h-4 text-neutral-800" />
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Starting Point</div>
                  <div className="text-xs font-bold text-black">{currentRoute.startName}</div>
                </div>
              </div>

              <div className="ml-4 w-0.5 h-4 bg-neutral-300 border-dashed border-l" />

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0 font-bold text-emerald-800 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Target Destination</div>
                  <div className="text-xs font-bold text-black">{currentRoute.destinationName}</div>
                </div>
              </div>
            </div>

            {/* Route Stats */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-neutral-100">
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                <div className="text-[10px] text-neutral-400 font-normal">Distance</div>
                <div className="text-sm font-extrabold text-black">{currentRoute.totalDistanceKm} km</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                <div className="text-[10px] text-neutral-400 font-normal">Est. Walking</div>
                <div className="text-sm font-extrabold text-black">~{currentRoute.estimatedMinutes} min</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                <div className="text-[10px] text-neutral-400 font-normal">Corridor Status</div>
                <div className={`text-sm font-extrabold ${isDeviated ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isDeviated ? 'Breached' : 'Secure'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Simulation & Testing Controls */}
          <div className="bg-white rounded-3xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-black" />
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                Geofence & Alert Test Controls
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-normal">
              Test how CareSpace protects the patient: advance along the route, or simulate wandering outside the designated boundary to trigger the audible siren and caretaker notification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleStepForward}
                className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-neutral-200"
              >
                <Footprints className="w-4 h-4" />
                <span>Advance Walk (Step {pathIndex + 1}/{currentRoute.path.length})</span>
              </button>

              <button
                onClick={handleSimulateDeviation}
                className="py-2.5 px-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span>Simulate Deviation (Off Route)</span>
              </button>
            </div>

            {isDeviated && (
              <button
                onClick={handleReturnToRoute}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve Deviation & Return to Path</span>
              </button>
            )}
          </div>

          {/* Card 3: Caretaker Integration Sync Note */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-neutral-700" />
              <div>
                <div className="font-bold text-black">Synchronized with Caretaker CareSpace</div>
                <div className="text-[11px] text-neutral-500">Live alerts broadcast to Rahul Caregiver in real time</div>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

        </div>

        {/* RIGHT COLUMN: SQUARE-SIZED GOOGLE MAP (Spans 6 cols on LG) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <CareSpaceMap
            route={currentRoute}
            currentPosition={currentPosition}
            isDeviated={isDeviated}
            deviatedMeters={deviatedMeters}
            isTrackingActive={true}
          />

          <div className="w-full max-w-[540px] mt-3 flex items-center justify-between text-[11px] text-neutral-500 px-2">
            <span>Square Google Maps Tracker (1:1 Aspect Ratio)</span>
            <span>Google Maps Platform SDK</span>
          </div>
        </div>

      </div>

    </div>
  );
};
