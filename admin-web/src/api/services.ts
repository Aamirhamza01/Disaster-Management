import api from './client';
import type {
  DisasterEvent, AlertLog, SafetyGuide, AdminUser, AlertStats,
  AiAlert, HazardReading, DistrictSummary, CitizenCheckIn, SituationalAwarenessSummary,
  DistrictRiskScore, IncidentReport, Shelter, EmergencyResource, ResourceSummary,
  ResponseTask, TaskSummary,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  api.post<{ success: boolean; token: string; admin: AdminUser }>('/auth/login', { email, password });

export const getMe = () =>
  api.get<{ success: boolean; admin: AdminUser }>('/auth/me');

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post('/auth/change-password', { currentPassword, newPassword });

// ── Events ────────────────────────────────────────────────────────────────────
export const getEvents = (params?: { status?: string; district?: string; page?: number; limit?: number }) =>
  api.get<{ success: boolean; total: number; page: number; pages: number; events: DisasterEvent[] }>(
    '/events', { params }
  );

export const getEvent = (id: string) =>
  api.get<{ success: boolean; event: DisasterEvent }>(`/events/${id}`);

export const createEvent = (data: Partial<DisasterEvent>) =>
  api.post<{ success: boolean; event: DisasterEvent }>('/events', data);

export const updateEvent = (id: string, data: Partial<DisasterEvent>) =>
  api.put<{ success: boolean; event: DisasterEvent }>(`/events/${id}`, data);

export const retractEvent = (id: string, correctionMessage: string, action: 'retract' | 'cancel' = 'retract') =>
  api.patch<{ success: boolean; event: DisasterEvent }>(`/events/${id}/retract`, { correctionMessage, action });

export const deleteEvent = (id: string) =>
  api.delete(`/events/${id}`);

export const triggerAlert = (id: string) =>
  api.post<{ success: boolean; usersTargeted: number; alertsSent: number; duplicatesSkipped: number }>(
    `/events/${id}/trigger`
  );

// ── SDMA Approval Workflow ────────────────────────────────────────────────────
export const submitEventForApproval = (id: string) =>
  api.post<{ success: boolean; message: string; event: DisasterEvent }>(`/events/${id}/submit-approval`);

export const approveEvent = (id: string, reviewNotes?: string) =>
  api.post<{ success: boolean; message: string; event: DisasterEvent }>(`/events/${id}/approve`, { reviewNotes });

export const rejectEvent = (id: string, reviewNotes: string) =>
  api.post<{ success: boolean; message: string; event: DisasterEvent }>(`/events/${id}/reject`, { reviewNotes });

// ── AI Anomaly Alerts ─────────────────────────────────────────────────────────
export const getAiAlerts = (params?: { status?: string; district?: string; limit?: number }) =>
  api.get<{ success: boolean; count: number; alerts: AiAlert[] }>('/ai-alerts', { params });

export const promoteAiAlert = (id: string, data: {
  targetStatus?: string;
  customTitle?: string;
  customDescription?: string;
  hindiTitle?: string;
  hindiDescription?: string;
  radiusKm?: number;
}) =>
  api.post<{ success: boolean; message: string; event: DisasterEvent; aiAlert: AiAlert }>(
    `/ai-alerts/${id}/promote`, data
  );

export const dismissAiAlert = (id: string, notes?: string) =>
  api.patch<{ success: boolean; message: string; aiAlert: AiAlert }>(
    `/ai-alerts/${id}/dismiss`, { notes }
  );

// ── Environmental Hazard Telemetry ───────────────────────────────────────────
export const getDistrictSummaries = (district?: string) =>
  api.get<{ success: boolean; data: DistrictSummary[] }>('/hazard-readings/district-summary', {
    params: { district },
  });

export const getDistrictRiskScores = (district?: string) =>
  api.get<{ success: boolean; count: number; data: DistrictRiskScore[] }>('/hazard-readings/risk-scores', {
    params: { district },
  });

export const getHazardReadings = (params: { district?: string; indicator?: string; days?: number; limit?: number }) =>
  api.get<{ success: boolean; count: number; readings: HazardReading[] }>('/hazard-readings', { params });

// ── Situational Awareness & Citizen Check-Ins ─────────────────────────────────
export const registerCitizenUser = (data: { name: string; phone: string; preferredLanguage?: string }) =>
  api.post<{ success: boolean; userId: string; user: any }>('/users/register', data);

export const submitCheckIn = (data: {
  userId: string;
  status: 'safe' | 'need_help' | 'family_safe';
  coordinates: [number, number];
  district?: string;
  state?: string;
  eventId?: string;
  message?: string;
  peopleCount?: number;
}) =>
  api.post<{ success: boolean; message: string; checkInId: string; status: string }>('/citizens/check-in', data);

export const getSituationalAwareness = (params?: { district?: string; eventId?: string }) =>
  api.get<{
    success: boolean;
    summary: SituationalAwarenessSummary;
    distressedCount: number;
    distressedList: CitizenCheckIn[];
  }>('/citizens/situational-awareness', { params });

export const acknowledgeCheckIn = (id: string) =>
  api.patch<{ success: boolean; message: string; checkIn: CitizenCheckIn }>(`/citizens/${id}/acknowledge`);

// ── Safety Guides ─────────────────────────────────────────────────────────────
export const getGuides = (params?: { disasterType?: string; language?: string }) =>
  api.get<{ success: boolean; total: number; guides: SafetyGuide[] }>('/guides', { params });

export const createGuide = (data: Partial<SafetyGuide>) =>
  api.post<{ success: boolean; guide: SafetyGuide }>('/guides', data);

export const updateGuide = (id: string, data: Partial<SafetyGuide>) =>
  api.put<{ success: boolean; guide: SafetyGuide }>(`/guides/${id}`, data);

export const deleteGuide = (id: string) =>
  api.delete(`/guides/${id}`);

// ── Alert Logs ────────────────────────────────────────────────────────────────
export const getLogs = (params?: { page?: number; limit?: number; status?: string }) =>
  api.get<{ success: boolean; total: number; page: number; pages: number; logs: AlertLog[] }>(
    '/logs', { params }
  );

export const getLogStats = () =>
  api.get<{ success: boolean; stats: AlertStats }>('/logs/stats');

export const getEventLogs = (eventId: string) =>
  api.get<{ success: boolean; stats: object; logs: AlertLog[] }>(`/logs/event/${eventId}`);

// ── Citizen Incident Reports ──────────────────────────────────────────────────
export const getIncidents = (params?: { status?: string; district?: string; severity?: string; limit?: number }) =>
  api.get<{ success: boolean; count: number; reports: IncidentReport[] }>('/incidents', { params });

export const getIncident = (id: string) =>
  api.get<{ success: boolean; report: IncidentReport }>(`/incidents/${id}`);

export const submitIncident = (data: Partial<IncidentReport>) =>
  api.post<{ success: boolean; message: string; report: IncidentReport }>('/incidents', data);

export const updateIncidentStatus = (id: string, data: { status: string; reviewNotes?: string }) =>
  api.patch<{ success: boolean; message: string; report: IncidentReport }>(`/incidents/${id}/status`, data);

export const createTaskFromIncident = (id: string, data?: { taskTitle?: string; priority?: string; assignedTo?: string; dueHours?: number }) =>
  api.post<{ success: boolean; message: string; task: ResponseTask; report: IncidentReport }>(`/incidents/${id}/create-task`, data);

// ── Shelter Management ────────────────────────────────────────────────────────
export const getShelters = (params?: { district?: string; status?: string; availableOnly?: boolean }) =>
  api.get<{ success: boolean; count: number; shelters: Shelter[] }>('/shelters', { params });

export const getShelter = (id: string) =>
  api.get<{ success: boolean; shelter: Shelter }>(`/shelters/${id}`);

export const createShelter = (data: Partial<Shelter>) =>
  api.post<{ success: boolean; message: string; shelter: Shelter }>('/shelters', data);

export const updateShelter = (id: string, data: Partial<Shelter>) =>
  api.put<{ success: boolean; message: string; shelter: Shelter }>(`/shelters/${id}`, data);

export const updateShelterOccupancy = (id: string, currentOccupancy: number) =>
  api.patch<{ success: boolean; message: string; shelter: Shelter; occupancyPercentage: number }>(`/shelters/${id}/occupancy`, { currentOccupancy });

// ── Emergency Resource Management ─────────────────────────────────────────────
export const getResourceSummary = (district?: string) =>
  api.get<{ success: boolean; stats: ResourceSummary }>('/resources/summary', { params: { district } });

export const getResources = (params?: { district?: string; resourceType?: string; status?: string }) =>
  api.get<{ success: boolean; count: number; resources: EmergencyResource[] }>('/resources', { params });

export const createResource = (data: Partial<EmergencyResource>) =>
  api.post<{ success: boolean; message: string; resource: EmergencyResource }>('/resources', data);

export const allocateResource = (id: string, data: { quantity: number; assignedTo: string }) =>
  api.post<{ success: boolean; message: string; resource: EmergencyResource }>(`/resources/${id}/allocate`, data);

export const releaseResource = (id: string, data: { quantity: number }) =>
  api.post<{ success: boolean; message: string; resource: EmergencyResource }>(`/resources/${id}/release`, data);

// ── Response Task Operations ──────────────────────────────────────────────────
export const getTaskSummary = (district?: string) =>
  api.get<{ success: boolean; stats: TaskSummary }>('/tasks/summary', { params: { district } });

export const getTasks = (params?: { district?: string; priority?: string; status?: string }) =>
  api.get<{ success: boolean; count: number; tasks: ResponseTask[] }>('/tasks', { params });

export const getTask = (id: string) =>
  api.get<{ success: boolean; task: ResponseTask }>(`/tasks/${id}`);

export const createTask = (data: Partial<ResponseTask>) =>
  api.post<{ success: boolean; message: string; task: ResponseTask }>('/tasks', data);

export const assignTask = (id: string, assignedTo: string) =>
  api.patch<{ success: boolean; message: string; task: ResponseTask }>(`/tasks/${id}/assign`, { assignedTo });

export const updateTaskStatus = (id: string, status: string) =>
  api.patch<{ success: boolean; message: string; task: ResponseTask }>(`/tasks/${id}/status`, { status });

export const allocateResourceToTask = (taskId: string, data: { resourceId: string; quantity: number }) =>
  api.post<{ success: boolean; message: string; task: ResponseTask; resource: EmergencyResource }>(`/tasks/${taskId}/allocate-resource`, data);

// ── Recovery & Audit Timeline ─────────────────────────────────────────────────
export const getRecoveryRecords = (params?: { district?: string; eventId?: string; status?: string }) =>
  api.get<{ success: boolean; count: number; records: any[] }>('/recovery', { params });

export const getAuditTimeline = (eventId: string) =>
  api.get<{ success: boolean; data: any }>(`/audit-timeline/${eventId}`);



