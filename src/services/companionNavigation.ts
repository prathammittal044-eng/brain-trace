/**
 * Centralized Navigation Registry and Event Bus for the BrainTrace Companion
 * Safely maps readable feature destinations to existing application views and actions.
 */

export type NavigationDestination =
  | 'home'
  | 'dashboard'
  | 'cognitiveTest'
  | 'startAssessment'
  | 'assessmentResults'
  | 'assessmentHistory'
  | 'cognitiveReport'
  | 'myScans'
  | 'uploadScan'
  | 'appointments'
  | 'bookAppointment'
  | 'messages'
  | 'settings';

export interface NavigationTargetInfo {
  id: NavigationDestination;
  label: string;
  description: string;
  actionText: string;
  category: 'clinical' | 'imaging' | 'communication' | 'account' | 'general';
}

export interface CompanionAction {
  type: 'navigate';
  destination: NavigationDestination;
  label: string;
}

export interface CompanionContext {
  currentRoute: string; // e.g. 'home', 'try-braintrace'
  activeTab?: string; // e.g. 'Dashboard', 'My Scans', 'Cognitive Test', 'Appointments', 'Messages', 'Settings'
  cognitiveSubView?: string; // e.g. 'dashboard', 'workspace', 'results', 'report', 'history'
  userRole?: 'Patient' | 'Caretaker' | 'Doctor';
}

/**
 * Strict whitelist of approved, implemented navigation targets in BrainTrace.
 * The companion will NEVER navigate to an unregistered or arbitrary URL.
 */
export const NAVIGATION_REGISTRY: Record<NavigationDestination, NavigationTargetInfo> = {
  home: {
    id: 'home',
    label: 'Landing Page',
    description: 'BrainTrace public home page with research and platform insights',
    actionText: 'Return to Home Landing Page',
    category: 'general'
  },
  dashboard: {
    id: 'dashboard',
    label: 'Patient Overview',
    description: 'Primary patient health snapshot and activity status',
    actionText: 'Open Patient Dashboard',
    category: 'general'
  },
  cognitiveTest: {
    id: 'cognitiveTest',
    label: 'Cognitive Assessment',
    description: 'Daily 5-domain cognitive activities and memory challenges',
    actionText: 'Go to Cognitive Test',
    category: 'clinical'
  },
  startAssessment: {
    id: 'startAssessment',
    label: 'Start Brain Check',
    description: 'Begin a new daily 10-trial cognitive assessment session',
    actionText: 'Start Cognitive Assessment →',
    category: 'clinical'
  },
  assessmentResults: {
    id: 'assessmentResults',
    label: 'Assessment Results',
    description: 'View the score and performance summary of the completed assessment',
    actionText: 'View Assessment Results',
    category: 'clinical'
  },
  assessmentHistory: {
    id: 'assessmentHistory',
    label: 'Assessment History',
    description: 'Review previous cognitive checks and longitudinal score trends',
    actionText: 'Open Assessment History →',
    category: 'clinical'
  },
  cognitiveReport: {
    id: 'cognitiveReport',
    label: 'Detailed Report & PDF',
    description: 'Comprehensive evaluation record with domain breakdown and PDF export',
    actionText: 'Open Detailed Report',
    category: 'clinical'
  },
  myScans: {
    id: 'myScans',
    label: 'My MRI Scans',
    description: 'Volumetric brain scan viewer with axial, sagittal, and coronal views',
    actionText: 'Open My Scans →',
    category: 'imaging'
  },
  uploadScan: {
    id: 'uploadScan',
    label: 'Upload MRI Scan',
    description: 'Upload a new Brain MRI DICOM or scan file for volumetric AI analysis',
    actionText: 'Open Scan Upload Dialog →',
    category: 'imaging'
  },
  appointments: {
    id: 'appointments',
    label: 'Appointments',
    description: 'Consultation schedule and directory of neurology specialists',
    actionText: 'Open Appointments →',
    category: 'communication'
  },
  bookAppointment: {
    id: 'bookAppointment',
    label: 'Book Consultation',
    description: 'Schedule a new in-person or telehealth visit with a neurologist',
    actionText: 'Book an Appointment →',
    category: 'communication'
  },
  messages: {
    id: 'messages',
    label: 'Messages & Telehealth',
    description: 'Encrypted communication with your doctors and care team',
    actionText: 'Open Messages & Chat →',
    category: 'communication'
  },
  settings: {
    id: 'settings',
    label: 'Account Settings',
    description: 'Manage preferences, notifications, and profile details',
    actionText: 'Open Settings →',
    category: 'account'
  }
};

/**
 * Validates if an action is an approved navigation target.
 */
export function isValidNavigationAction(action: any): action is CompanionAction {
  if (!action || typeof action !== 'object') return false;
  if (action.type !== 'navigate') return false;
  return typeof action.destination === 'string' && action.destination in NAVIGATION_REGISTRY;
}

// Global Event Bus for companion navigation requests
type NavigationListener = (destination: NavigationDestination) => void;
const listeners: Set<NavigationListener> = new Set();

export function subscribeToCompanionNavigation(listener: NavigationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function executeCompanionNavigation(destination: NavigationDestination): boolean {
  if (!(destination in NAVIGATION_REGISTRY)) {
    console.warn(`[CompanionNavigation] Rejecting invalid destination: ${destination}`);
    return false;
  }
  listeners.forEach((listener) => {
    try {
      listener(destination);
    } catch (err) {
      console.error('[CompanionNavigation] Error executing navigation listener:', err);
    }
  });
  return true;
}
