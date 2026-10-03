// ── Shared type definitions ───────────────────────────────────────────────────

export type Severity =
  | 'Low' | 'Medium' | 'High' | 'Critical';

export type DisasterType =
  | 'Flood' | 'FlashFlood' | 'HeavyRainfall' | 'UrbanWaterlogging'
  | 'Earthquake' | 'Cyclone' | 'Landslide'
  | 'Fire' | 'Tsunami' | 'Drought' | 'Heatwave' | 'Coldwave'
  | 'ChemicalSpill' | 'Other';

export type ZoneType = 'polygon' | 'radius';

export type EventStatus =
  | 'active' | 'published' | 'pending_approval' | 'draft'
  | 'approved' | 'retracted' | 'expired' | 'cancelled';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface SafetyStep {
  order: number;
  instruction: string;
  iconSlug?: string;
}

export interface SafetyGuide {
  _id: string;
  disasterType: DisasterType;
  language: string;
  title: string;
  summary?: string;
  steps: SafetyStep[];
  version: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalWorkflow {
  submittedBy?: { _id: string; name: string; email: string };
  submittedAt?: string;
  approvedBy?: { _id: string; name: string; email: string };
  approvedAt?: string;
  reviewNotes?: string;
}

export interface DisasterEvent {
  _id: string;
  title: string;
  type: DisasterType;
  severity: Severity;
  description?: string;
  state?: string;
  district?: string;
  translations?: {
    hi?: { title: string; description: string };
  };
  zoneType: ZoneType;
  polygon?: GeoPolygon;
  centre?: GeoPoint;
  radiusKm?: number;
  bufferRadiusKm: number;
  safetyGuideId?: string | SafetyGuide;
  status: EventStatus;
  approvalWorkflow?: ApprovalWorkflow;
  capIdentifier?: string;
  expiresAt?: string;
  retractedAt?: string;
  correctionMessage?: string;
  alertsSentCount: number;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  isLive?: boolean;
}

export interface AlertLog {
  _id: string;
  eventId: { _id: string; title: string; type: string; severity: Severity; status: EventStatus };
  userId: { _id: string; name: string; phone: string; preferredLanguage: string };
  deduplicationKey: string;
  sentAt: string;
  deliveryStatus: 'pending' | 'sent' | 'failed';
  acknowledgedAt?: string;
  isRetraction: boolean;
  severityAtSend: Severity;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'sdma_operator' | 'researcher' | 'viewer';
  assignedState?: string;
  assignedDistricts?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface AlertStats {
  delivery: { pending: number; sent: number; failed: number };
  bySeverity: { _id: Severity; count: number; acknowledged: number }[];
  last24hAlerts: number;
}

// ── AI Anomaly & Early Warning Types ──────────────────────────────────────────

export interface AnomalyFeature {
  indicator: string;
  currentValue: number;
  baselineMean: number;
  baselineStd: number;
  deviationScore: number;
  unit: string;
}

export interface AiAlert {
  _id: string;
  state: string;
  district: string;
  hazardType: DisasterType;
  score: number;
  threshold: number;
  recommendedSeverity: Severity;
  anomalyFeatures: AnomalyFeature[];
  explanation: string;
  suggestedActions?: string[];
  suggestedCentre?: [number, number];
  suggestedRadiusKm?: number;
  status: 'pending_review' | 'approved_into_event' | 'dismissed' | 'escalated';
  reviewedBy?: { _id: string; name: string; email: string };
  reviewedAt?: string;
  reviewNotes?: string;
  linkedEventId?: { _id: string; title: string; status: string };
  createdAt: string;
  updatedAt: string;
}

export interface HazardReading {
  _id: string;
  timestamp: string;
  state: string;
  district: string;
  stationId?: string;
  stationName?: string;
  indicator: string;
  value: number;
  unit: string;
  source: string;
  warningLevel?: number;
  dangerLevel?: number;
  isAnomaly: boolean;
  anomalyScore?: number;
}

export interface DistrictSummary {
  district: string;
  state: string;
  rainfall?: { value: number; unit: string; timestamp: string; isAnomaly: boolean } | null;
  riverLevel?: { value: number; unit: string; warningLevel?: number; dangerLevel?: number; timestamp: string; isAnomaly: boolean } | null;
  temperature?: { value: number; unit: string; timestamp: string; isAnomaly: boolean } | null;
}

// ── Situational Awareness & Citizen Check-In Types ───────────────────────────

export interface CitizenCheckIn {
  _id: string;
  userId: string;
  phone?: string;
  citizenName: string;
  status: 'safe' | 'need_help' | 'family_safe';
  location: { type: 'Point'; coordinates: [number, number] };
  district: string;
  state: string;
  eventId?: string;
  message?: string;
  peopleCount: number;
  isAcknowledgedByResponders: boolean;
  createdAt: string;
}

export interface SituationalAwarenessSummary {
  safe: number;
  need_help: number;
  family_safe: number;
  totalReports: number;
}

export interface DistrictRiskScore {
  district: string;
  state: string;
  overallRiskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Critical';
  majorHazards: string[];
  lastUpdated: string;
  dataStatus: 'LIVE' | 'EXTERNAL / OFFICIAL' | 'SIMULATED' | 'MANUAL';
}

// ── Phase 2: Community Response & Operations Types ────────────────────────────

export type IncidentStatus = 'NEW' | 'UNDER_REVIEW' | 'VERIFIED' | 'ASSIGNED' | 'RESOLVED' | 'REJECTED';

export interface IncidentReport {
  _id: string;
  citizenName: string;
  citizenPhone?: string;
  incidentType: string;
  title: string;
  description: string;
  location: { type: 'Point'; coordinates: [number, number] };
  district: string;
  state: string;
  severity: Severity;
  peopleAffected: number;
  imageUrl?: string;
  status: IncidentStatus;
  disasterEventId?: { _id: string; title: string; severity: Severity; status: string } | null;
  verifiedBy?: { _id: string; name: string; email: string } | null;
  verifiedAt?: string;
  reviewNotes?: string;
  associatedTaskId?: { _id: string; title: string; status: string; priority: string; assignedTo: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type ShelterStatus = 'AVAILABLE' | 'NEAR_CAPACITY' | 'FULL' | 'CLOSED';

export interface Shelter {
  _id: string;
  name: string;
  address: string;
  district: string;
  state: string;
  location: { type: 'Point'; coordinates: [number, number] };
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  facilities: string[];
  contactNumber: string;
  status: ShelterStatus;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceStatus = 'AVAILABLE' | 'LOW_STOCK' | 'ALLOCATED' | 'OUT_OF_SERVICE';

export interface EmergencyResource {
  _id: string;
  resourceType: string;
  name: string;
  quantity: number;
  availableQuantity: number;
  unit: string;
  district: string;
  state: string;
  assignedTo?: string | null;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceSummary {
  total: number;
  available: number;
  allocated: number;
  lowStock: number;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ResponseTask {
  _id: string;
  title: string;
  description: string;
  eventId?: { _id: string; title: string; severity: Severity; status: string } | null;
  incidentId?: { _id: string; title: string; incidentType: string; severity: Severity; peopleAffected: number } | null;
  district: string;
  state: string;
  priority: TaskPriority;
  assignedTo: string;
  status: TaskStatus;
  allocatedResources?: Array<{
    resourceId: string;
    resourceName: string;
    quantity: number;
  }>;
  dueAt?: string;
  completedAt?: string;
  createdBy?: { _id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  pending: number;
  inProgress: number;
  critical: number;
  completed: number;
}

// ── Phase 3: Impact Intelligence, Simulation Lab, & Recovery Types ─────────────

export interface ImpactPrediction {
  district: string;
  state: string;
  overallImpactScore: number;
  impactLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  infrastructureRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  estimatedAffectedPeople: number;
  estimatedCriticalIncidents: number;
  estimatedShelterDemand: number;
  shelterCapacity: number;
  availableShelterCapacity: number;
  shelterDeficit: number;
  estimatedResourceDemand: {
    ambulances: number;
    rescueVehicles: number;
    medicalKits: number;
    foodPacks: number;
  };
  confidence: number;
  dataStatus: 'AI-ASSISTED ESTIMATE';
  factors: string[];
  timestamp: string;
}

export interface SimulationInputs {
  simulatedIntensity: number;
  affectedRadiusKm: number;
  estimatedPopulationMultiplier: number;
  infrastructureVulnerability?: string;
}

export interface SimulationOutputs {
  simulatedRiskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Critical';
  estimatedAffectedPeople: number;
  estimatedDisplacedPeople: number;
  estimatedShelterDemand: number;
  estimatedResourceDemand: {
    ambulances: number;
    rescueVehicles: number;
    medicalKits: number;
    foodPacks: number;
  };
  recommendedResponsePriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
}

export interface SimulationRun {
  _id: string;
  district: string;
  state: string;
  hazardType: string;
  severity: Severity;
  inputs: SimulationInputs;
  outputs: SimulationOutputs;
  dataStatus: 'SIMULATED';
  createdBy?: { _id: string; name: string; email: string } | null;
  createdAt: string;
}

export type RecoveryStatus = 'INITIAL_RESPONSE' | 'STABILIZATION' | 'RECOVERY_IN_PROGRESS' | 'RECOVERED';

export interface RecoveryRecord {
  _id: string;
  eventId?: { _id: string; title: string; severity: Severity; status: string } | null;
  district: string;
  state: string;
  status: RecoveryStatus;
  affectedPeople: number;
  peopleAssisted: number;
  sheltersActive: number;
  sheltersClosed: number;
  tasksCompleted: number;
  resourcesDeployed: number;
  infrastructureRestoredPercent: number;
  notes?: string;
  updatedBy?: { _id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineItem {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: string;
  source: string;
  metadata?: any;
}




