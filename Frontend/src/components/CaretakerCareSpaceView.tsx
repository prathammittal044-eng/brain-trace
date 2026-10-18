import React, { useState, useEffect } from 'react';
import {
  CareSpaceAlert,
  CareSpaceState,
  DESIGNATED_ROUTES,
  DesignatedRoute,
  getCareSpaceAlerts,
  getCareSpaceState,
  resolveAllCareSpaceAlerts,
  playVoiceGuidance
} from '../services/careSpaceService';
import { CareSpaceMap } from './CareSpaceMap';
import {
  Navigation,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Clock,
  Compass,
  Radio,
  MapPin,
  ShieldAlert,
  Volume2,
  Send,
  UserCheck,
  RefreshCw,
  Bell
} from 'lucide-react';

interface CaretakerCareSpaceViewProps {
  patientName?: string;
  caretakerName?: string;
}

export const CaretakerCareSpaceView: React.FC<CaretakerCareSpaceViewProps> = ({
  patientName = 'Demo Patient (DX-4091)',
  caretakerName = 'Rahul Caregiver'
}) => {
  const [state, setState] = useState<CareSpaceState>(getCareSpaceState());
  const [alerts, setAlerts] = useState<CareSpaceAlert[]>(getCareSpaceAlerts());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync state and alerts in real-time
  const refreshData = () => {
    setState(getCareSpaceState());
    setAlerts(getCareSpaceAlerts());
  };

  useEffect(() => {
    refreshData();

    const handleStateChange = () => refreshData();
    const handleAlertsChange = () => refreshData();

    window.addEventListener('demenx_carespace_state_change', handleStateChange);
    window.addEventListener('demenx_carespace_alerts_change', handleAlertsChange);
    window.addEventListener('storage', handleStateChange);

    const interval = setInterval(refreshData, 2000);

    return () => {
      window.removeEventListener('demenx_carespace_state_change', handleStateChange);
      window.removeEventListener('demenx_carespace_alerts_change', handleAlertsChange);
      window.removeEventListener('storage', handleStateChange);
      clearInterval(interval);
    };
  }, []);

  const activeRoute: DesignatedRoute =
    DESIGNATED_ROUTES.find((r) => r.id === state.selectedRouteId) || DESIGNATED_ROUTES[0];

  const activeDeviationAlerts = alerts.filter((a) => a.severity === 'critical' && a.status === 'active');

  const handleSendVoiceGuide = () => {
    const msg = `Caregiver Voice Reminder sent: "${patientName}, this is ${caretakerName}. Please stay on your designated route towards ${activeRoute.destinationName}."`;
    playVoiceGuidance(msg);
    showToast('Voice guidance dispatched to patient device!');
  };

  const handleResolveAlerts = () => {
    resolveAllCareSpaceAlerts();
    refreshData();
    showToast('All active deviation alerts acknowledged & marked resolved.');
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#09090b] text-white px-4 py-3 rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-3 animate-in slide-in-from-top-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
              CareSpace — Live Patient Safety & Location Monitor
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              state.isDeviated
                ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              {state.isDeviated ? '🚨 DEVIATION ACTIVE' : '● LIVE TRACKING'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-normal mt-1">
            Receives automated boundary breach alerts and coordinates real-time location tracking for {patientName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeDeviationAlerts.length > 0 && (
            <button
              onClick={handleResolveAlerts}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Acknowledge Alerts ({activeDeviationAlerts.length})</span>
            </button>
          )}

          <button
            onClick={refreshData}
            className="p-2 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50 text-neutral-700 cursor-pointer"
            title="Refresh GPS Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ACTIVE CRITICAL ALERT BANNER FOR CARETAKER */}
      {state.isDeviated && (
        <div className="p-4 sm:p-5 rounded-3xl bg-red-50 border-2 border-red-500 shadow-[5px_5px_0px_0px_rgba(239,68,68,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
              <ShieldAlert className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-red-900 tracking-tight">
                  IMMEDIATE ATTENTION: {patientName.toUpperCase()} DEVIATED FROM ROUTE
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-red-200 text-red-900 font-mono text-[10px] font-bold">
                  +{state.deviatedMeters}m OFF PATH
                </span>
              </div>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">
                Patient walked off designated route <strong>"{activeRoute.name}"</strong>. Current destination is <u>{activeRoute.destinationName}</u>. Alert siren has been triggered on patient device with audio guidance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSendVoiceGuide}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Send Audio Guide</span>
            </button>
          </div>
        </div>
      )}

      {/* TWO-COLUMN GRID: LEFT MESSAGES/STATUS & RIGHT SQUARE GOOGLE MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: LIVE STATUS & RECEIVED MESSAGES (6 cols on LG) */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Card 1: Live Patient Telemetry */}
          <div className="bg-white rounded-3xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                  Live Patient Telemetry
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                Ping: Just now
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Monitored Patient</span>
                <span className="text-sm font-bold text-black block mt-0.5">{patientName}</span>
                <span className="text-[10px] text-neutral-500 font-medium">Safe Corridor Active</span>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">Route Geofence</span>
                <span className={`text-sm font-bold block mt-0.5 ${state.isDeviated ? 'text-red-600' : 'text-emerald-600'}`}>
                  {state.isDeviated ? `Breached (+${state.deviatedMeters}m)` : 'Inside Safe Buffer'}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {state.currentPosition.lat.toFixed(5)}, {state.currentPosition.lng.toFixed(5)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-black">Active Designated Route:</span>
                <span className="text-[11px] font-semibold text-neutral-700">{activeRoute.name}</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed italic">
                Reason: "{activeRoute.reason}"
              </p>
            </div>
          </div>

          {/* Card 2: Received CareSpace Alert Messages ("the message is recieved by caretaker in carespace named newsection") */}
          <div className="bg-white rounded-3xl p-5 border-2 border-[#09090b] shadow-[5px_5px_0px_0px_rgba(9,9,11,1)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-black" />
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                  Received CareSpace Messages
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-bold border border-neutral-200">
                {alerts.length} Messages Logged
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {alerts.map((item) => {
                const isCrit = item.severity === 'critical';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCrit
                        ? 'bg-red-50/70 border-red-200 text-red-950'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCrit ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-bold font-mono">
                          {isCrit ? 'SAFETY ALERT' : 'SYSTEM LOG'}
                        </span>
                        {item.deviatedMeters && (
                          <span className="px-1.5 py-0.2 rounded bg-red-200 text-red-900 text-[9px] font-bold">
                            +{item.deviatedMeters}m
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed font-medium">
                      {item.message}
                    </p>

                    <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>Location: {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}</span>
                      <span>Route: {item.routeName}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Caretaker Quick Response Action Bar */}
            <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
              <button
                onClick={handleSendVoiceGuide}
                className="flex-1 py-2 px-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Broadcast Voice Reminder</span>
              </button>

              <button
                onClick={() => showToast(`Calling patient device at +1 (555) 010-0000...`)}
                className="py-2 px-3 rounded-xl border border-neutral-300 hover:border-black bg-neutral-50 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Device</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SQUARE-SIZED GOOGLE MAP TRACKER (6 cols on LG) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <CareSpaceMap
            route={activeRoute}
            currentPosition={state.currentPosition}
            isDeviated={state.isDeviated}
            deviatedMeters={state.deviatedMeters}
            isTrackingActive={true}
          />

          <div className="w-full max-w-[540px] mt-3 flex items-center justify-between text-[11px] text-neutral-500 px-2">
            <span>Caretaker Live Radar Feed (Square 1:1 Aspect Ratio)</span>
            <span className="font-mono">Google Maps Platform</span>
          </div>
        </div>

      </div>

    </div>
  );
};
