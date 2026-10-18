/**
 * CareSpace Real-Time Safety & Location Tracking Service
 * Manages routes, geofencing, deviations, audio sirens, and caretaker alert messaging.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DesignatedRoute {
  id: string;
  name: string;
  startName: string;
  destinationName: string;
  reason: string; // "xyz reason" for keeping to the path
  origin: LatLng;
  destination: LatLng;
  path: LatLng[];
  estimatedMinutes: number;
  totalDistanceKm: number;
}

export interface CareSpaceAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  patientId: string;
  patientName: string;
  routeName: string;
  routeReason: string;
  deviatedMeters?: number;
  location: LatLng;
  locationDescription: string;
  message: string;
  guidanceGiven: string;
  sirenActive: boolean;
  status: 'active' | 'resolved';
}

export interface CareSpaceState {
  selectedRouteId: string;
  isTrackingActive: boolean;
  currentPosition: LatLng;
  pathIndex: number; // Current waypoint index along designated route
  isDeviated: boolean;
  deviatedMeters: number;
  sirenActive: boolean;
  lastPingTime: string;
}

// Preset designated routes centered around a safe residential neighborhood (San Francisco / Pacific Heights)
export const DESIGNATED_ROUTES: DesignatedRoute[] = [
  {
    id: 'morning-walk',
    name: 'Morning Wellness Walk',
    startName: 'Home (742 Evergreen Terrace)',
    destinationName: 'Sunrise Community Park & Botanical Garden',
    reason: 'Daily gentle physical mobility & fresh morning air routine prescribed by Dr. Sharma',
    origin: { lat: 37.7891, lng: -122.4285 },
    destination: { lat: 37.7945, lng: -122.4208 },
    path: [
      { lat: 37.7891, lng: -122.4285 }, // Home
      { lat: 37.7904, lng: -122.4271 }, // Pine St turn
      { lat: 37.7918, lng: -122.4252 }, // Franklin intersection
      { lat: 37.7929, lng: -122.4234 }, // Lafayette corner
      { lat: 37.7938, lng: -122.4219 }, // Park Entrance
      { lat: 37.7945, lng: -122.4208 }  // Botanical Fountain
    ],
    estimatedMinutes: 14,
    totalDistanceKm: 1.1
  },
  {
    id: 'clinic-visit',
    name: 'Clinic Visit: Memory Center',
    startName: 'Home (742 Evergreen Terrace)',
    destinationName: 'DemenX NeuroCare Clinic (Room 304)',
    reason: 'Follow-up cognitive assessment consultation with Dr. Rajesh Sharma',
    origin: { lat: 37.7891, lng: -122.4285 },
    destination: { lat: 37.7852, lng: -122.4225 },
    path: [
      { lat: 37.7891, lng: -122.4285 },
      { lat: 37.7882, lng: -122.4265 },
      { lat: 37.7871, lng: -122.4248 },
      { lat: 37.7860, lng: -122.4236 },
      { lat: 37.7852, lng: -122.4225 }
    ],
    estimatedMinutes: 12,
    totalDistanceKm: 0.9
  },
  {
    id: 'pharmacy-errand',
    name: 'Prescription Errand',
    startName: 'Home (742 Evergreen Terrace)',
    destinationName: 'Community Health Chemist & Pharmacy',
    reason: 'Picking up scheduled daily neuro-cognitive vitamin supplements',
    origin: { lat: 37.7891, lng: -122.4285 },
    destination: { lat: 37.7915, lng: -122.4340 },
    path: [
      { lat: 37.7891, lng: -122.4285 },
      { lat: 37.7899, lng: -122.4305 },
      { lat: 37.7907, lng: -122.4322 },
      { lat: 37.7915, lng: -122.4340 }
    ],
    estimatedMinutes: 8,
    totalDistanceKm: 0.7
  }
];

// Off-route deviation position for simulation (diverts away from the designated corridor)
export const DEVIATION_OFFSET = {
  lat: 0.0028, // ~310m North
  lng: -0.0035 // ~300m West
};

const STORAGE_KEY_STATE = 'demenx_carespace_state';
const STORAGE_KEY_ALERTS = 'demenx_carespace_alerts';

// Initial default state
const DEFAULT_STATE: CareSpaceState = {
  selectedRouteId: 'morning-walk',
  isTrackingActive: true,
  currentPosition: DESIGNATED_ROUTES[0].path[1], // Currently at waypoint 1 along the path
  pathIndex: 1,
  isDeviated: false,
  deviatedMeters: 0,
  sirenActive: false,
  lastPingTime: new Date().toISOString()
};

const DEFAULT_ALERTS: CareSpaceAlert[] = [
  {
    id: 'alert-init-1',
    timestamp: 'Today, 08:45 AM',
    severity: 'info',
    patientId: 'DX-4091',
    patientName: 'Demo Patient (DX-4091)',
    routeName: 'Morning Wellness Walk',
    routeReason: 'Daily gentle physical mobility & fresh morning air routine prescribed by Dr. Sharma',
    location: DESIGNATED_ROUTES[0].path[0],
    locationDescription: '742 Evergreen Terrace (Home)',
    message: 'Patient started safe guided walk along designated route.',
    guidanceGiven: 'Walking routine initialized with active geofence.',
    sirenActive: false,
    status: 'resolved'
  }
];

export function getCareSpaceState(): CareSpaceState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(DEFAULT_STATE));
      return DEFAULT_STATE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveCareSpaceState(state: CareSpaceState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
    // Dispatch custom event for real-time sync across components in the same window
    window.dispatchEvent(new CustomEvent('demenx_carespace_state_change', { detail: state }));
  } catch (e) {
    console.error('Failed to save care space state:', e);
  }
}

export function getCareSpaceAlerts(): CareSpaceAlert[] {
  if (typeof window === 'undefined') return DEFAULT_ALERTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(DEFAULT_ALERTS));
      return DEFAULT_ALERTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ALERTS;
  }
}

export function saveCareSpaceAlerts(alerts: CareSpaceAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    window.dispatchEvent(new CustomEvent('demenx_carespace_alerts_change', { detail: alerts }));
  } catch (e) {
    console.error('Failed to save care space alerts:', e);
  }
}

export function addCareSpaceAlert(newAlert: Omit<CareSpaceAlert, 'id' | 'timestamp'>): CareSpaceAlert {
  const alerts = getCareSpaceAlerts();
  const alert: CareSpaceAlert = {
    ...newAlert,
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  const updated = [alert, ...alerts];
  saveCareSpaceAlerts(updated);
  return alert;
}

export function resolveAllCareSpaceAlerts(): void {
  const alerts = getCareSpaceAlerts();
  const updated = alerts.map((a) => ({ ...a, status: 'resolved' as const, sirenActive: false }));
  saveCareSpaceAlerts(updated);
}

// Calculate approximate distance in meters between two lat/lng points (Haversine formula)
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Web Audio API Alert Siren Synthesizer
 * Alternates between medical warning frequencies (880Hz / 659Hz) to produce an alert chime/siren.
 */
class AlertSirenSynthesizer {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private timer: any = null;
  private isRunning = false;

  public start(): void {
    if (this.isRunning) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();

      this.osc.type = 'triangle';
      this.gain.gain.setValueAtTime(0.2, this.ctx.currentTime); // Safe, controlled audible volume

      this.osc.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.osc.start();
      this.isRunning = true;

      let isHighPitch = true;
      this.osc.frequency.setValueAtTime(880, this.ctx.currentTime);

      this.timer = setInterval(() => {
        if (!this.ctx || !this.osc) return;
        isHighPitch = !isHighPitch;
        const targetFreq = isHighPitch ? 880 : 660;
        this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
      }, 400);
    } catch (e) {
      console.warn('AudioContext alert playback error:', e);
    }
  }

  public stop(): void {
    if (!this.isRunning) return;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try {
      this.osc?.stop();
      this.osc?.disconnect();
      this.gain?.disconnect();
      this.ctx?.close();
    } catch {
      // Ignore cleanup error
    }
    this.isRunning = false;
    this.osc = null;
    this.gain = null;
    this.ctx = null;
  }
}

export const alertSiren = new AlertSirenSynthesizer();

/**
 * Speech synthesis audio guidance helper
 */
export function playVoiceGuidance(text: string): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Slightly calm and patient pace
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }
}
