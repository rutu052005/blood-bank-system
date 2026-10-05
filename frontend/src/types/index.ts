export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ComponentType = 'RBC' | 'PLATELETS' | 'PLASMA' | 'WHOLE_BLOOD';
export type PriorityLevel = 'EMERGENCY' | 'URGENT' | 'ROUTINE';
export type RequestStatus = 'PENDING' | 'MATCHED' | 'APPROVED' | 'IN_PROGRESS' | 'FULFILLED' | 'CANCELLED' | 'REJECTED' | 'RETURNED_FOR_REVIEW';
export type InventoryStatus = 'AVAILABLE' | 'EXPIRED' | 'DISCARDED';
export type HoldStatus = 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'PREEMPTED';
export type TransferStatus = 'INITIATED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type ExpiryTier = 'VALID' | 'NEAR_EXPIRY' | 'CRITICAL' | 'EXPIRED';
export type UserRole = 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'INVENTORY_MANAGER' | 'REQUEST_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospital_id: string;
  hospital_name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  timestamp: string;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  contact_number: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface BloodUnit {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  blood_group: BloodGroup;
  component: ComponentType;
  quantity_total: number;
  quantity_held: number;
  quantity_in_transit: number;
  available_quantity: number;
  collection_date: string;
  expiry_date: string;
  status: InventoryStatus;
  tier?: ExpiryTier;
  created_at: string;
  updated_at: string;
}

export interface RequestItem {
  id: string;
  request_id: string;
  blood_group: BloodGroup;
  component: ComponentType;
  quantity: number;
}

export interface BloodRequest {
  id: string;
  requesting_hospital_id: string;
  requesting_hospital_name?: string;
  priority: PriorityLevel;
  status: RequestStatus;
  required_by: string;
  aging_points: number;
  promoted_by_aging: boolean;
  preempted_count: number;
  compensation_boost: number;
  effective_score?: number;
  items: RequestItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  request_id: string;
  source_hospital_id: string;
  source_hospital_name?: string;
  destination_hospital_id: string;
  destination_hospital_name?: string;
  inventory_id: string;
  blood_group?: string;
  component?: string;
  quantity: number;
  priority: PriorityLevel;
  status: TransferStatus;
  dispatched_at?: string;
  received_at?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: string;
  entity_id?: string;
  hospital_id?: string;
  title: string;
  message: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  escalation_level: number;
  created_at: string;
}

export interface MatchExplanation {
  hospital_id: string;
  hospital_name: string;
  inventory_id: string;
  blood_group: BloodGroup;
  component: ComponentType;
  quantity_available: number;
  allocated_quantity: number;
  expiry_date: string;
  days_to_expiry: number;
  distance_km: number;
  shortest_path: string[];
  total_score: number;
  expiry_score: number;
  distance_score: number;
  fit_score: number;
  checks: {
    blood_group_match: boolean;
    component_match: boolean;
    quantity_available: boolean;
    inventory_available: boolean;
    viable_before_expiry: boolean;
  };
}

export interface BankerState {
  available: Record<string, number>;
  max: Record<string, Record<string, number>>;
  allocation: Record<string, Record<string, number>>;
  need: Record<string, Record<string, number>>;
  is_safe: boolean;
  safe_sequence: string[];
  explanation: string;
}

export interface EngineStatusInfo {
  clock: { now: string; offsetHours: number };
  engines: Array<{
    id: string;
    name: string;
    subject: string;
    algorithm: string;
    status: 'HEALTHY' | 'PAUSED' | 'ERROR';
    lastTick: string;
    queueDepth: number;
    consistency?: any;
    bankerSafe?: boolean;
    fefoCount?: number;
  }>;
  eventQueue: {
    total: number;
    new: number;
    processing: number;
    done: number;
    failed: number;
    activeDepth: number;
    maxBufferDepth: number;
  };
}
