import {
  AssessmentSession,
  AssessmentScore,
  CognitiveDomain,
  PatientResponse
} from '../types/cognitiveAssessment';
import { calculateOverallAssessmentScore } from '../utils/cognitiveScoring';

const ACTIVE_SESSION_STORAGE_KEY = 'braintrace_cognitive_active_session';
const HISTORY_STORAGE_KEY = 'braintrace_cognitive_assessment_history';

// In-memory fallback if localStorage fails or is disabled
let memoryActiveSession: AssessmentSession | null = null;
let memoryHistory: AssessmentSession[] = [];

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

import { cognitiveApi } from './apiClient';

/**
 * Saves current active in-progress assessment session
 */
export function saveActiveSession(session: AssessmentSession): void {
  memoryActiveSession = session;
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.warn('Failed to save active session to localStorage:', err);
    }
  }

  // Fire-and-forget sync to backend
  cognitiveApi.saveStep(session.id, session.currentStepIndex, undefined, session.durationSeconds).catch((e) => {
    // Non-blocking sync error
  });
}

/**
 * Gets currently active in-progress session if any
 */
export function getActiveSession(): AssessmentSession | null {
  if (memoryActiveSession) return memoryActiveSession;
  if (!isLocalStorageAvailable()) return null;
  try {
    const data = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as AssessmentSession;
    memoryActiveSession = parsed;
    return parsed;
  } catch (err) {
    console.warn('Failed to parse active session from localStorage:', err);
    return null;
  }
}

/**
 * Clears active session (upon completion or discard)
 */
export function clearActiveSession(): void {
  const currentId = memoryActiveSession?.id;
  memoryActiveSession = null;
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to clear active session:', err);
    }
  }

  if (currentId) {
    cognitiveApi.discardSession(currentId).catch(() => {});
  }
}

/**
 * Saves completed assessment to history
 */
export function saveCompletedAssessment(session: AssessmentSession): void {
  clearActiveSession();

  const history = getAssessmentHistory();
  // Prepend new session to top of history
  const updatedHistory = [session, ...history.filter((s) => s.id !== session.id)];

  memoryHistory = updatedHistory;
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (err) {
      console.warn('Failed to save completed assessment to history:', err);
    }
  }

  // Sync completed session to backend
  cognitiveApi.completeSession(session.id, session.durationSeconds, session.responses).catch((err) => {
    console.warn('Failed to sync completed assessment to backend:', err);
  });
}


/**
 * Gets list of all completed assessment sessions
 */
export function getAssessmentHistory(patientName = 'Demo Patient (DX-4091)'): AssessmentSession[] {
  seedInitialHistoryIfEmpty(patientName);

  if (memoryHistory.length > 0) return memoryHistory;
  if (!isLocalStorageAvailable()) return memoryHistory;

  try {
    const data = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as AssessmentSession[];
    const cleaned = parsed.map((s) => ({
      ...s,
      patientName: (!s.patientName || s.patientName.includes('Ankit') || s.patientName.includes('Bhadra') || s.patientName.includes('Alex Morgan'))
        ? 'Demo Patient (DX-4091)'
        : s.patientName
    }));
    memoryHistory = cleaned;
    return cleaned;
  } catch (err) {
    console.warn('Failed to parse assessment history:', err);
    return [];
  }
}

/**
 * Retrieves a single session by its unique ID
 */
export function getAssessmentById(id: string): AssessmentSession | null {
  const history = getAssessmentHistory();
  return history.find((s) => s.id === id) || null;
}

/**
 * Creates a brand new assessment session for a patient
 */
export function createNewAssessmentSession(
  patientId = 'DX-4091',
  patientName = 'Demo Patient (DX-4091)'
): AssessmentSession {
  const newSession: AssessmentSession = {
    id: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    patientId,
    patientName,
    version: 'v1.2.0-daily',
    startedAt: new Date().toISOString(),
    status: 'in_progress',
    currentStepIndex: 0,
    responses: {},
    durationSeconds: 0
  };
  saveActiveSession(newSession);
  return newSession;
}

/**
 * Seeds initial mock history matching the dashboard dates if history is completely empty
 */
export function seedInitialHistoryIfEmpty(patientName = 'Demo Patient (DX-4091)'): void {
  const safeName = (!patientName || patientName.includes('Ankit') || patientName.includes('Bhadra') || patientName.includes('Alex Morgan')) ? 'Demo Patient (DX-4091)' : patientName;

  if (!isLocalStorageAvailable()) {
    if (memoryHistory.length === 0) {
      memoryHistory = generateMockInitialHistory(safeName);
    }
    return;
  }

  try {
    const existing = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!existing || JSON.parse(existing).length === 0) {
      const mockHistory = generateMockInitialHistory(safeName);
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(mockHistory));
      memoryHistory = mockHistory;
    } else {
      // Clean any existing cached mock history containing previous real names
      const parsed = JSON.parse(existing) as AssessmentSession[];
      const needsCleaning = parsed.some(s => !s.patientName || s.patientName?.includes('Ankit') || s.patientName?.includes('Bhadra') || s.patientName?.includes('Alex Morgan'));
      if (needsCleaning) {
        const cleaned = parsed.map(s => ({
          ...s,
          patientName: (!s.patientName || s.patientName.includes('Ankit') || s.patientName.includes('Bhadra') || s.patientName.includes('Alex Morgan')) ? 'Demo Patient (DX-4091)' : s.patientName
        }));
        window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cleaned));
        memoryHistory = cleaned;
      }
    }
  } catch (err) {
    console.warn('Failed to seed initial history:', err);
  }
}

function generateMockInitialHistory(patientName: string): AssessmentSession[] {
  const createMockSession = (
    id: string,
    dateStr: string,
    timeStr: string,
    scoreVal: number,
    durationSec: number
  ): AssessmentSession => {
    // Generate mock responses matching scoreVal
    const domains: CognitiveDomain[] = ['memory', 'attention', 'workingMemory', 'pattern', 'visualSpatial'];
    const mockResponses: Record<string, PatientResponse> = {};

    domains.forEach((dom, i) => {
      const isCorrect = i < 4 ? true : scoreVal > 70;
      mockResponses[`mock-${dom}-1`] = {
        questionId: `mock-${dom}-1`,
        domain: dom,
        activityKind: 'pattern_reasoning',
        userAnswer: 'selected',
        isCorrect,
        scoreEarned: isCorrect ? 1 : 0.6,
        rawDetails: { summaryText: `Standard engagement on ${dom}` },
        answeredAt: `${dateStr}T${timeStr}:00.000Z`
      };
    });

    const responseList = Object.values(mockResponses);
    const score = calculateOverallAssessmentScore(responseList, durationSec, 10);
    // Overwrite overallScore to match exact historical display
    score.overallScore = scoreVal;

    return {
      id,
      patientId: 'patient-001',
      patientName,
      version: 'v1.2.0-daily',
      startedAt: `${dateStr}T${timeStr}:00.000Z`,
      completedAt: `${dateStr}T${timeStr}:30.000Z`,
      status: 'completed',
      currentStepIndex: 11,
      responses: mockResponses,
      score,
      durationSeconds: durationSec
    };
  };

  return [
    createMockSession('session-20260722-1', '2026-07-22', '10:35', 78, 385),
    createMockSession('session-20260721-1', '2026-07-21', '09:50', 72, 410),
    createMockSession('session-20260720-1', '2026-07-20', '10:20', 75, 360),
    createMockSession('session-20260719-1', '2026-07-19', '08:45', 69, 430)
  ];
}
