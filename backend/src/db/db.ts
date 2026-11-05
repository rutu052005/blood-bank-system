import { 
  Hospital, User, BloodUnit, InventoryHold, InventoryMovement, 
  InventoryExpiryState, ExpiryPolicy, BloodRequest, RequestItem, 
  Transfer, DistanceMatrixItem, Alert, EngineEvent, AuditLog, 
  MatchCandidateExplanation, BankerState 
} from '../types/index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ClockService } from '../services/clock.service.js';

class InMemoryDB {
  public hospitals: Hospital[] = [];
  public users: User[] = [];
  public inventory: BloodUnit[] = [];
  public holds: InventoryHold[] = [];
  public movements: InventoryMovement[] = [];
  public expiryStates: InventoryExpiryState[] = [];
  public expiryPolicies: ExpiryPolicy[] = [];
  public requests: BloodRequest[] = [];
  public transfers: Transfer[] = [];
  public distances: DistanceMatrixItem[] = [];
  public alerts: Alert[] = [];
  public events: EngineEvent[] = [];
  public auditLogs: AuditLog[] = [];
  public engineConfig: Record<string, any> = {};
  public schedulerRuns: any[] = [];
  public matchResults: any[] = [];
  public redistributionSuggestions: any[] = [];
  public notificationDeliveries: any[] = [];
  public attributeSubstitutionRules: any[] = [];

  // Concurrency & Locks Simulation
  private lockedRowIds: Set<string> = new Set();
  public enginePausedStatus: Record<string, boolean> = {
    'inventory-sync': false,
    'matching': false,
    'expiry': false,
    'scheduler': false,
  };

  constructor() {
    this.seed();
  }

  public seed(): void {
    const today = ClockService.now();
    const addDays = (d: number) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().split('T')[0];
    };

    // Hospitals
    this.hospitals = [
      { id: 'H001', name: 'KLE Hospital', city: 'Belagavi', address: 'JNMC Campus, Nehru Nagar, Belagavi', contact_number: '+91 831 247 3777', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'H002', name: 'District Hospital', city: 'Belagavi', address: 'APMC Road, Belagavi', contact_number: '+91 831 240 4000', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'H003', name: 'City Care Hospital', city: 'Hubballi', address: 'Vidya Nagar, Hubballi', contact_number: '+91 836 225 8888', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'H004', name: 'Sahyadri Medical Center', city: 'Dharwad', address: 'PB Road, Dharwad', contact_number: '+91 836 244 5555', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'H005', name: 'Shree Hospital', city: 'Bengaluru', address: 'Rajajinagar, Bengaluru', contact_number: '+91 80 2332 1111', status: 'ACTIVE', created_at: today.toISOString() },
    ];

    // Password 'demo123'
    const passwordHash = bcrypt.hashSync('demo123', 10);

    // Users
    this.users = [
      { id: 'U001', name: 'Anil Kumar', email: 'anil@demo.local', password_hash: passwordHash, role: 'INVENTORY_MANAGER', hospital_id: 'H001', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'U002', name: 'Priya Shah', email: 'priya@demo.local', password_hash: passwordHash, role: 'REQUEST_MANAGER', hospital_id: 'H002', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'U003', name: 'Rahul Patil', email: 'rahul@demo.local', password_hash: passwordHash, role: 'INVENTORY_MANAGER', hospital_id: 'H003', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'U004', name: 'Sneha Joshi', email: 'sneha@demo.local', password_hash: passwordHash, role: 'HOSPITAL_ADMIN', hospital_id: 'H004', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'U005', name: 'Meera Rao', email: 'meera@demo.local', password_hash: passwordHash, role: 'INVENTORY_MANAGER', hospital_id: 'H005', status: 'ACTIVE', created_at: today.toISOString() },
      { id: 'U006', name: 'Demo Admin', email: 'admin@demo.local', password_hash: passwordHash, role: 'SYSTEM_ADMIN', hospital_id: 'H001', status: 'ACTIVE', created_at: today.toISOString() },
    ];

    // Expiry Policies
    this.expiryPolicies = [
      { component: 'RBC', near_expiry_days: 7, critical_hours: 72, updated_at: today.toISOString() },
      { component: 'PLATELETS', near_expiry_days: 2, critical_hours: 24, updated_at: today.toISOString() },
      { component: 'PLASMA', near_expiry_days: 30, critical_hours: 168, updated_at: today.toISOString() },
      { component: 'WHOLE_BLOOD', near_expiry_days: 5, critical_hours: 48, updated_at: today.toISOString() },
    ];

    // Hospital Distances
    this.distances = [
      { id: 'D001', from_hospital_id: 'H001', to_hospital_id: 'H002', distance_km: 5.0 },
      { id: 'D002', from_hospital_id: 'H002', to_hospital_id: 'H001', distance_km: 5.0 },
      { id: 'D003', from_hospital_id: 'H001', to_hospital_id: 'H004', distance_km: 80.0 },
      { id: 'D004', from_hospital_id: 'H004', to_hospital_id: 'H001', distance_km: 80.0 },
      { id: 'D005', from_hospital_id: 'H002', to_hospital_id: 'H004', distance_km: 80.0 },
      { id: 'D006', from_hospital_id: 'H004', to_hospital_id: 'H002', distance_km: 80.0 },
      { id: 'D007', from_hospital_id: 'H004', to_hospital_id: 'H003', distance_km: 20.0 },
      { id: 'D008', from_hospital_id: 'H003', to_hospital_id: 'H004', distance_km: 20.0 },
      { id: 'D009', from_hospital_id: 'H001', to_hospital_id: 'H003', distance_km: 95.0 },
      { id: 'D010', from_hospital_id: 'H003', to_hospital_id: 'H001', distance_km: 95.0 },
      { id: 'D011', from_hospital_id: 'H003', to_hospital_id: 'H005', distance_km: 410.0 },
      { id: 'D012', from_hospital_id: 'H005', to_hospital_id: 'H003', distance_km: 410.0 },
      { id: 'D013', from_hospital_id: 'H004', to_hospital_id: 'H005', distance_km: 420.0 },
      { id: 'D014', from_hospital_id: 'H005', to_hospital_id: 'H004', distance_km: 420.0 },
    ];

    // Inventory Units (INV001 - INV010)
    this.inventory = [
      { id: 'INV001', hospital_id: 'H001', blood_group: 'O+', component: 'RBC', quantity_total: 10, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-5), expiry_date: addDays(30), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV002', hospital_id: 'H001', blood_group: 'A+', component: 'RBC', quantity_total: 5, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-20), expiry_date: addDays(5), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV003', hospital_id: 'H001', blood_group: 'B+', component: 'PLASMA', quantity_total: 15, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-10), expiry_date: addDays(120), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV004', hospital_id: 'H002', blood_group: 'O+', component: 'RBC', quantity_total: 4, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-30), expiry_date: addDays(2), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV005', hospital_id: 'H002', blood_group: 'O-', component: 'RBC', quantity_total: 6, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-10), expiry_date: addDays(25), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV006', hospital_id: 'H003', blood_group: 'A+', component: 'RBC', quantity_total: 8, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-15), expiry_date: addDays(20), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV007', hospital_id: 'H003', blood_group: 'AB+', component: 'PLASMA', quantity_total: 10, quantity_held: 3, quantity_in_transit: 3, collection_date: addDays(-5), expiry_date: addDays(150), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV008', hospital_id: 'H003', blood_group: 'O-', component: 'RBC', quantity_total: 4, quantity_held: 2, quantity_in_transit: 0, collection_date: addDays(-12), expiry_date: addDays(18), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV009', hospital_id: 'H004', blood_group: 'B+', component: 'PLASMA', quantity_total: 6, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-2), expiry_date: addDays(180), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
      { id: 'INV010', hospital_id: 'H005', blood_group: 'O-', component: 'RBC', quantity_total: 5, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-25), expiry_date: addDays(3), status: 'AVAILABLE', created_at: today.toISOString(), updated_at: today.toISOString() },
    ];

    // Pre-existing holds (REQ005 sits on INV008 for preemption demo)
    this.holds = [
      { id: 'HOLD001', request_id: 'REQ005', inventory_id: 'INV008', quantity: 2, expires_at: new Date(today.getTime() + 30 * 60000).toISOString(), status: 'ACTIVE', created_at: today.toISOString() }
    ];

    // Movements ledger seed
    this.movements = this.inventory.map(inv => ({
      id: uuidv4(),
      inventory_id: inv.id,
      movement_type: 'ADD',
      quantity_change: inv.quantity_total,
      performed_by: 'U006',
      notes: 'Initial seed stock',
      created_at: today.toISOString(),
    }));

    // Seed Requests
    this.requests = [
      {
        id: 'REQ001',
        requesting_hospital_id: 'H002',
        priority: 'URGENT',
        status: 'PENDING',
        required_by: new Date(today.getTime() + 12 * 3600000).toISOString(),
        aging_points: 10,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        items: [{ id: uuidv4(), request_id: 'REQ001', blood_group: 'O+', component: 'RBC', quantity: 4, created_at: today.toISOString() }],
        created_by: 'U002',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      },
      {
        id: 'REQ002',
        requesting_hospital_id: 'H003',
        priority: 'ROUTINE',
        status: 'MATCHED',
        required_by: new Date(today.getTime() + 48 * 3600000).toISOString(),
        aging_points: 0,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        items: [{ id: uuidv4(), request_id: 'REQ002', blood_group: 'A+', component: 'RBC', quantity: 5, created_at: today.toISOString() }],
        created_by: 'U003',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      },
      {
        id: 'REQ003',
        requesting_hospital_id: 'H005',
        priority: 'EMERGENCY',
        status: 'PENDING',
        required_by: new Date(today.getTime() + 4 * 3600000).toISOString(),
        aging_points: 0,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        items: [{ id: uuidv4(), request_id: 'REQ003', blood_group: 'O-', component: 'RBC', quantity: 2, created_at: today.toISOString() }],
        created_by: 'U005',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      },
      {
        id: 'REQ004',
        requesting_hospital_id: 'H004',
        priority: 'ROUTINE',
        status: 'APPROVED',
        required_by: new Date(today.getTime() + 24 * 3600000).toISOString(),
        aging_points: 5,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        items: [{ id: uuidv4(), request_id: 'REQ004', blood_group: 'AB+', component: 'PLASMA', quantity: 3, created_at: today.toISOString() }],
        created_by: 'U004',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      },
      {
        id: 'REQ005',
        requesting_hospital_id: 'H003',
        priority: 'ROUTINE',
        status: 'MATCHED',
        required_by: new Date(today.getTime() + 36 * 3600000).toISOString(),
        aging_points: 0,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        items: [{ id: uuidv4(), request_id: 'REQ005', blood_group: 'O-', component: 'RBC', quantity: 2, created_at: today.toISOString() }],
        created_by: 'U003',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      },
      {
        id: 'REQ006',
        requesting_hospital_id: 'H001',
        priority: 'URGENT',
        status: 'PENDING',
        required_by: new Date(today.getTime() + 18 * 3600000).toISOString(),
        aging_points: 0,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        items: [
          { id: uuidv4(), request_id: 'REQ006', blood_group: 'O+', component: 'RBC', quantity: 4, created_at: today.toISOString() },
          { id: uuidv4(), request_id: 'REQ006', blood_group: 'B+', component: 'PLASMA', quantity: 4, created_at: today.toISOString() }
        ],
        created_by: 'U001',
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      },
    ];

    // Seed Transfers
    this.transfers = [
      {
        id: 'TR001',
        request_id: 'REQ004',
        source_hospital_id: 'H003',
        destination_hospital_id: 'H004',
        inventory_id: 'INV007',
        quantity: 3,
        priority: 'ROUTINE',
        status: 'IN_TRANSIT',
        dispatched_at: today.toISOString(),
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
      }
    ];

    // Seed Alerts
    this.alerts = [
      {
        id: uuidv4(),
        severity: 'CRITICAL',
        type: 'EXPIRY_CRITICAL',
        entity_id: 'INV004',
        hospital_id: 'H002',
        title: 'Critical Expiry Alert: O+ RBC',
        message: 'Unit INV004 (O+ RBC, Qty: 4) expires in 2 days at District Hospital.',
        is_acknowledged: false,
        escalation_level: 0,
        created_at: today.toISOString(),
      },
      {
        id: uuidv4(),
        severity: 'WARNING',
        type: 'EXPIRY_WARNING',
        entity_id: 'INV002',
        hospital_id: 'H001',
        title: 'Near Expiry Warning: A+ RBC',
        message: 'Unit INV002 (A+ RBC, Qty: 5) enters near-expiry window (5 days remaining).',
        is_acknowledged: false,
        escalation_level: 0,
        created_at: today.toISOString(),
      },
      {
        id: uuidv4(),
        severity: 'CRITICAL',
        type: 'NEW_REQUEST',
        entity_id: 'REQ003',
        hospital_id: 'H005',
        title: 'EMERGENCY Request Issued',
        message: 'Shree Hospital requires 2 units of O- RBC urgently.',
        is_acknowledged: false,
        escalation_level: 0,
        created_at: today.toISOString(),
      }
    ];

    // Seed Audit Logs
    this.auditLogs = [
      { id: uuidv4(), user_id: 'U006', action: 'SYSTEM_INITIALIZED', entity_type: 'SYSTEM', entity_id: 'SYS', details: { message: 'Database initialized with demo data' }, timestamp: today.toISOString() },
      { id: uuidv4(), user_id: 'U002', action: 'CREATED_REQUEST', entity_type: 'REQUEST', entity_id: 'REQ001', details: { priority: 'URGENT', group: 'O+', component: 'RBC', qty: 4 }, timestamp: today.toISOString() },
      { id: uuidv4(), user_id: 'U005', action: 'CREATED_REQUEST', entity_type: 'REQUEST', entity_id: 'REQ003', details: { priority: 'EMERGENCY', group: 'O-', component: 'RBC', qty: 2 }, timestamp: today.toISOString() },
    ];

    // Seed Engine Configuration
    this.engineConfig = {
      weights: { FASTEST: { w_expiry: 0.25, w_distance: 0.60, w_fit: 0.15 }, BALANCED: { w_expiry: 0.35, w_distance: 0.50, w_fit: 0.15 } },
      scheduler: { loopIntervalSeconds: 10, holdTTLMinutes: 30, maxPreemptions: 2, agingIntervalMinutes: 5, agingStepPoints: 5 },
      escalation: { warningMinutes: 15, criticalMinutes: 30 },
    };
  }

  // Erase all operational data (inventory, requests, transfers, alerts, movements, holds)
  public eraseData(keepAdmin: boolean = true): void {
    this.inventory = [];
    this.holds = [];
    this.movements = [];
    this.expiryStates = [];
    this.requests = [];
    this.transfers = [];
    this.alerts = [];
    this.events = [];
    this.schedulerRuns = [];
    this.matchResults = [];
    this.redistributionSuggestions = [];
    this.notificationDeliveries = [];
    this.lockedRowIds.clear();

    if (!keepAdmin) {
      this.users = [];
      this.hospitals = [];
    } else {
      this.users = this.users.filter(u => u.role === 'SYSTEM_ADMIN');
    }

    this.auditLogs.push({
      id: uuidv4(),
      user_id: 'U006',
      action: 'DATABASE_ERASED',
      entity_type: 'SYSTEM',
      entity_id: 'SYS',
      details: { keepAdmin, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  // Row Lock Simulator (SELECT ... FOR UPDATE)
  public async acquireRowLocks(ids: string[]): Promise<void> {
    // Sort in ascending order to prevent deadlocks as mandated by Section 5
    const sortedIds = [...ids].sort();
    for (const id of sortedIds) {
      let attempts = 0;
      while (this.lockedRowIds.has(id)) {
        attempts++;
        if (attempts > 5) {
          throw new Error(`MySQL Lock Timeout (1205): Could not acquire lock for inventory row ${id}`);
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      this.lockedRowIds.add(id);
    }
  }

  public releaseRowLocks(ids: string[]): void {
    for (const id of ids) {
      this.lockedRowIds.delete(id);
    }
  }
}

export const db = new InMemoryDB();
