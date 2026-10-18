/**
 * BrainTrace Centralized API Client
 * Connects frontend UI to real persistent FastAPI backend.
 */

import { AssessmentSession, PatientResponse } from '../types/cognitiveAssessment';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';
const TOKEN_STORAGE_KEY = 'braintrace_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage issues
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage issues
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.detail || `Server request failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return data as ApiResponse<T>;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------
export const authApi = {
  async register(payload: { email: string; password: string; role?: string; full_name?: string; phone?: string }) {
    return request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email: string; password?: string; role?: string }) {
    const res = await request<{
      access_token: string;
      token_type: string;
      user?: any;
    }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.data?.access_token) {
      setStoredToken(res.data.access_token);
    }
    return res;
  },

  async me() {
    return request('/api/v1/auth/me', { method: 'GET' });
  },

  async logout() {
    clearStoredToken();
    return request('/api/v1/auth/logout', { method: 'POST' });
  },

  async resetPassword(email: string, resetCode: string, newPassword: string) {
    return request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, reset_code: resetCode, new_password: newPassword }),
    });
  },
};

// ---------------------------------------------------------------------------
// MRI API
// ---------------------------------------------------------------------------
export const mriApi = {
  async listScans() {
    return request<any[]>('/api/v1/mri', { method: 'GET' });
  },

  async getScan(id: string) {
    return request<any>(`/api/v1/mri/${id}`, { method: 'GET' });
  },

  async analyze(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/api/v1/mri/analyze`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.detail || 'MRI analysis failed');
    }
    return data;
  },
};

// ---------------------------------------------------------------------------
// Cognitive Assessment API
// ---------------------------------------------------------------------------
export const cognitiveApi = {
  async startSession(patientId = 'DX-4091', patientName = 'Demo Patient (DX-4091)') {
    return request<AssessmentSession>('/api/v1/cognitive/sessions', {
      method: 'POST',
      body: JSON.stringify({ patientId, patientName }),
    });
  },

  async getActiveSession() {
    return request<AssessmentSession | null>('/api/v1/cognitive/sessions/active', {
      method: 'GET',
    });
  },

  async saveStep(sessionId: string, currentStepIndex: number, response?: PatientResponse, durationSeconds?: number) {
    return request<AssessmentSession>(`/api/v1/cognitive/sessions/${sessionId}/step`, {
      method: 'PUT',
      body: JSON.stringify({ currentStepIndex, response, durationSeconds }),
    });
  },

  async completeSession(sessionId: string, durationSeconds: number, responses: Record<string, PatientResponse>) {
    return request<AssessmentSession>(`/api/v1/cognitive/sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ durationSeconds, responses }),
    });
  },

  async discardSession(sessionId: string) {
    return request(`/api/v1/cognitive/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  async getHistory(patientId?: string) {
    const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : '';
    return request<AssessmentSession[]>(`/api/v1/cognitive/history${query}`, {
      method: 'GET',
    });
  },

  async getHistoricalSession(sessionId: string) {
    return request<AssessmentSession>(`/api/v1/cognitive/history/${sessionId}`, {
      method: 'GET',
    });
  },
};

// ---------------------------------------------------------------------------
// Appointments API
// ---------------------------------------------------------------------------
export const appointmentApi = {
  async list() {
    return request<any[]>('/api/v1/appointments', { method: 'GET' });
  },

  async create(data: {
    doctor_id?: string;
    doctor_name?: string;
    date_str: string;
    time_str: string;
    consultation_type?: string;
    reason_for_visit?: string;
  }) {
    return request<any>('/api/v1/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listDoctors() {
    return request<any[]>('/api/v1/appointments/doctors', { method: 'GET' });
  },
};

// ---------------------------------------------------------------------------
// Messaging API
// ---------------------------------------------------------------------------
export const messageApi = {
  async getContacts() {
    return request<any[]>('/api/v1/messages/contacts', { method: 'GET' });
  },

  async send(data: { conversation_id?: string; contact_id?: string; text: string; attachment?: any }) {
    return request<any>('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ---------------------------------------------------------------------------
// Profile & Caretaker API
// ---------------------------------------------------------------------------
export const profileApi = {
  async get() {
    return request<any>('/api/v1/profile', { method: 'GET' });
  },

  async update(data: any) {
    return request<any>('/api/v1/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getCaretakerNotes() {
    return request<any[]>('/api/v1/caretaker/notes', { method: 'GET' });
  },

  async addCaretakerNote(text: string, author?: string) {
    return request<any>('/api/v1/caretaker/notes', {
      method: 'POST',
      body: JSON.stringify({ text, author }),
    });
  },

  async getMedications() {
    return request<any[]>('/api/v1/caretaker/medications', { method: 'GET' });
  },

  async toggleMedication(id: string) {
    return request<any>(`/api/v1/caretaker/medications/${id}/toggle`, {
      method: 'PUT',
    });
  },
};

// ---------------------------------------------------------------------------
// Connected Care / Care Space API
// ---------------------------------------------------------------------------
export const careSpaceApi = {
  async getContext() {
    return request<any>('/api/v1/care-space/context', { method: 'GET' });
  },

  async createSpace(data: { name: string; assistance_level?: string; preferences?: any; safety_plan?: any }) {
    return request<any>('/api/v1/care-space', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPatientView() {
    return request<any>('/api/v1/care-space/patient-view', { method: 'GET' });
  },

  async getCaregiverView() {
    return request<any>('/api/v1/care-space/caregiver-view', { method: 'GET' });
  },

  async getFamilyView() {
    return request<any>('/api/v1/care-space/family-view', { method: 'GET' });
  },

  async getRoutine() {
    return request<any[]>('/api/v1/care-space/routine', { method: 'GET' });
  },

  async addRoutineItem(data: {
    title: string;
    description?: string;
    category: 'medication' | 'activity' | 'meal' | 'reminder';
    scheduled_time: string;
    assigned_to_role?: string;
    recurrence?: string;
    difficulty_level?: 'easy' | 'moderate';
    icon_hint?: string;
  }) {
    return request<any>('/api/v1/care-space/routine', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleRoutineItem(id: string) {
    return request<any>(`/api/v1/care-space/routine/${id}/toggle`, {
      method: 'PUT',
    });
  },

  async getCareLogs() {
    return request<any[]>('/api/v1/care-space/care-logs', { method: 'GET' });
  },

  async addCareLog(data: {
    log_type: 'vitals' | 'mood' | 'meal' | 'hydration' | 'observation';
    title: string;
    details?: any;
    notes?: string;
  }) {
    return request<any>('/api/v1/care-space/care-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMemoryBook() {
    return request<any[]>('/api/v1/care-space/memory-book', { method: 'GET' });
  },

  async addMemoryItem(data: {
    item_type: 'familiar_person' | 'life_memory' | 'favorite_place' | 'comfort_item';
    name_or_title: string;
    relationship_or_context?: string;
    description?: string;
    phone?: string;
    avatar_or_photo_url?: string;
    is_private_to_patient?: boolean;
    is_favorite?: boolean;
  }) {
    return request<any>('/api/v1/care-space/memory-book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSafetyPlan() {
    return request<any>('/api/v1/care-space/safety-plan', { method: 'GET' });
  },

  async updateSafetyPlan(data: any) {
    return request<any>('/api/v1/care-space/safety-plan', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getMembers() {
    return request<any[]>('/api/v1/care-space/members', { method: 'GET' });
  },

  async inviteMember(data: {
    email: string;
    role: 'family_member' | 'trusted_contact';
    relationship_label: string;
    permissions?: any;
  }) {
    return request<any>('/api/v1/care-space/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async acceptInvitation(invite_code: string) {
    return request<any>('/api/v1/care-space/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ invite_code }),
    });
  },

  async updatePermissions(member_id: string, permissions: any) {
    return request<any>(`/api/v1/care-space/members/${member_id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },

  async getEducationResources() {
    return request<any[]>('/api/v1/care-space/education', { method: 'GET' });
  },

  async getAuditLogs() {
    return request<any[]>('/api/v1/care-space/audit-logs', { method: 'GET' });
  },
};
