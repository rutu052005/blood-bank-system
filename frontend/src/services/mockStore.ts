import { Hospital, User, BloodUnit, BloodRequest, Transfer, Alert } from '../types/index.js';

const today = new Date();
const addDays = (d: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split('T')[0];
};

export const MOCK_HOSPITALS: Hospital[] = [
  { id: 'H001', name: 'KLE Hospital', city: 'Belagavi', address: 'JNMC Campus, Nehru Nagar, Belagavi', contact_number: '+91 831 247 3777', status: 'ACTIVE', created_at: today.toISOString() },
  { id: 'H002', name: 'District Hospital', city: 'Belagavi', address: 'APMC Road, Belagavi', contact_number: '+91 831 240 4000', status: 'ACTIVE', created_at: today.toISOString() },
  { id: 'H003', name: 'City Care Hospital', city: 'Hubballi', address: 'Vidya Nagar, Hubballi', contact_number: '+91 836 225 8888', status: 'ACTIVE', created_at: today.toISOString() },
  { id: 'H004', name: 'Sahyadri Medical Center', city: 'Dharwad', address: 'PB Road, Dharwad', contact_number: '+91 836 244 5555', status: 'ACTIVE', created_at: today.toISOString() },
  { id: 'H005', name: 'Shree Hospital', city: 'Bengaluru', address: 'Rajajinagar, Bengaluru', contact_number: '+91 80 2332 1111', status: 'ACTIVE', created_at: today.toISOString() },
];

export const MOCK_USERS: User[] = [
  { id: 'U006', name: 'Demo Admin', email: 'admin@demo.local', role: 'SYSTEM_ADMIN', hospital_id: 'H001', hospital_name: 'KLE Hospital', status: 'ACTIVE' },
  { id: 'U001', name: 'Anil Kumar', email: 'anil@demo.local', role: 'INVENTORY_MANAGER', hospital_id: 'H001', hospital_name: 'KLE Hospital', status: 'ACTIVE' },
  { id: 'U002', name: 'Priya Shah', email: 'priya@demo.local', role: 'REQUEST_MANAGER', hospital_id: 'H002', hospital_name: 'District Hospital', status: 'ACTIVE' },
  { id: 'U004', name: 'Sneha Joshi', email: 'sneha@demo.local', role: 'HOSPITAL_ADMIN', hospital_id: 'H004', hospital_name: 'Sahyadri Medical Center', status: 'ACTIVE' },
  { id: 'U003', name: 'Rahul Patil', email: 'rahul@demo.local', role: 'INVENTORY_MANAGER', hospital_id: 'H003', hospital_name: 'City Care Hospital', status: 'ACTIVE' },
  { id: 'U005', name: 'Meera Rao', email: 'meera@demo.local', role: 'INVENTORY_MANAGER', hospital_id: 'H005', hospital_name: 'Shree Hospital', status: 'ACTIVE' },
];

export const MOCK_INVENTORY: BloodUnit[] = [
  { id: 'INV001', hospital_id: 'H001', hospital_name: 'KLE Hospital', blood_group: 'O+', component: 'RBC', quantity_total: 10, quantity_held: 0, quantity_in_transit: 0, available_quantity: 10, collection_date: addDays(-5), expiry_date: addDays(30), status: 'AVAILABLE', tier: 'VALID', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV002', hospital_id: 'H001', hospital_name: 'KLE Hospital', blood_group: 'A+', component: 'RBC', quantity_total: 5, quantity_held: 0, quantity_in_transit: 0, available_quantity: 5, collection_date: addDays(-20), expiry_date: addDays(5), status: 'AVAILABLE', tier: 'NEAR_EXPIRY', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV003', hospital_id: 'H001', hospital_name: 'KLE Hospital', blood_group: 'B+', component: 'PLASMA', quantity_total: 15, quantity_held: 0, quantity_in_transit: 0, available_quantity: 15, collection_date: addDays(-10), expiry_date: addDays(120), status: 'AVAILABLE', tier: 'VALID', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV004', hospital_id: 'H002', hospital_name: 'District Hospital', blood_group: 'O+', component: 'RBC', quantity_total: 4, quantity_held: 0, quantity_in_transit: 0, available_quantity: 4, collection_date: addDays(-30), expiry_date: addDays(2), status: 'AVAILABLE', tier: 'CRITICAL', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV005', hospital_id: 'H002', hospital_name: 'District Hospital', blood_group: 'O-', component: 'RBC', quantity_total: 6, quantity_held: 0, quantity_in_transit: 0, available_quantity: 6, collection_date: addDays(-10), expiry_date: addDays(25), status: 'AVAILABLE', tier: 'VALID', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV006', hospital_id: 'H003', hospital_name: 'City Care Hospital', blood_group: 'A+', component: 'RBC', quantity_total: 8, quantity_held: 0, quantity_in_transit: 0, available_quantity: 8, collection_date: addDays(-15), expiry_date: addDays(20), status: 'AVAILABLE', tier: 'VALID', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV007', hospital_id: 'H003', hospital_name: 'City Care Hospital', blood_group: 'AB+', component: 'PLASMA', quantity_total: 10, quantity_held: 3, quantity_in_transit: 3, available_quantity: 4, collection_date: addDays(-5), expiry_date: addDays(150), status: 'AVAILABLE', tier: 'VALID', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV008', hospital_id: 'H003', hospital_name: 'City Care Hospital', blood_group: 'O-', component: 'RBC', quantity_total: 4, quantity_held: 2, quantity_in_transit: 0, available_quantity: 2, collection_date: addDays(-12), expiry_date: addDays(18), status: 'AVAILABLE', tier: 'VALID', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV009', hospital_id: 'H004', hospital_name: 'Sahyadri Medical Center', blood_group: 'B+', component: 'PLASMA', quantity_total: 6, quantity_held: 0, quantity_in_transit: 0, available_quantity: 6, collection_date: addDays(-2), expiry_date: addDays(180), status: 'AVAILABLE', tier: 'VALID', created_at: today.toISOString(), updated_at: today.toISOString() },
  { id: 'INV010', hospital_id: 'H005', hospital_name: 'Shree Hospital', blood_group: 'O-', component: 'RBC', quantity_total: 5, quantity_held: 0, quantity_in_transit: 0, available_quantity: 5, collection_date: addDays(-25), expiry_date: addDays(3), status: 'AVAILABLE', tier: 'CRITICAL', created_at: today.toISOString(), updated_at: today.toISOString() },
];

export const MOCK_REQUESTS: BloodRequest[] = [
  {
    id: 'REQ001',
    requesting_hospital_id: 'H002',
    requesting_hospital_name: 'District Hospital',
    priority: 'URGENT',
    status: 'PENDING',
    required_by: new Date(today.getTime() + 12 * 3600000).toISOString(),
    aging_points: 10,
    promoted_by_aging: false,
    preempted_count: 0,
    compensation_boost: 0,
    effective_score: 75,
    items: [{ id: 'ITEM001', request_id: 'REQ001', blood_group: 'O+', component: 'RBC', quantity: 4 }],
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'REQ002',
    requesting_hospital_id: 'H003',
    requesting_hospital_name: 'City Care Hospital',
    priority: 'ROUTINE',
    status: 'MATCHED',
    required_by: new Date(today.getTime() + 48 * 3600000).toISOString(),
    aging_points: 0,
    promoted_by_aging: false,
    preempted_count: 0,
    compensation_boost: 0,
    effective_score: 40,
    items: [{ id: 'ITEM002', request_id: 'REQ002', blood_group: 'A+', component: 'RBC', quantity: 5 }],
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'REQ003',
    requesting_hospital_id: 'H005',
    requesting_hospital_name: 'Shree Hospital',
    priority: 'EMERGENCY',
    status: 'PENDING',
    required_by: new Date(today.getTime() + 4 * 3600000).toISOString(),
    aging_points: 0,
    promoted_by_aging: false,
    preempted_count: 0,
    compensation_boost: 0,
    effective_score: 95,
    items: [{ id: 'ITEM003', request_id: 'REQ003', blood_group: 'O-', component: 'RBC', quantity: 2 }],
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'REQ004',
    requesting_hospital_id: 'H004',
    requesting_hospital_name: 'Sahyadri Medical Center',
    priority: 'ROUTINE',
    status: 'APPROVED',
    required_by: new Date(today.getTime() + 24 * 3600000).toISOString(),
    aging_points: 5,
    promoted_by_aging: false,
    preempted_count: 0,
    compensation_boost: 0,
    effective_score: 45,
    items: [{ id: 'ITEM004', request_id: 'REQ004', blood_group: 'AB+', component: 'PLASMA', quantity: 3 }],
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'REQ005',
    requesting_hospital_id: 'H003',
    requesting_hospital_name: 'City Care Hospital',
    priority: 'ROUTINE',
    status: 'MATCHED',
    required_by: new Date(today.getTime() + 36 * 3600000).toISOString(),
    aging_points: 0,
    promoted_by_aging: false,
    preempted_count: 0,
    compensation_boost: 0,
    effective_score: 35,
    items: [{ id: 'ITEM005', request_id: 'REQ005', blood_group: 'O-', component: 'RBC', quantity: 2 }],
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'REQ006',
    requesting_hospital_id: 'H001',
    requesting_hospital_name: 'KLE Hospital',
    priority: 'URGENT',
    status: 'PENDING',
    required_by: new Date(today.getTime() + 18 * 3600000).toISOString(),
    aging_points: 0,
    promoted_by_aging: false,
    preempted_count: 0,
    compensation_boost: 0,
    effective_score: 70,
    items: [
      { id: 'ITEM006A', request_id: 'REQ006', blood_group: 'O+', component: 'RBC', quantity: 4 },
      { id: 'ITEM006B', request_id: 'REQ006', blood_group: 'B+', component: 'PLASMA', quantity: 4 },
    ],
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  }
];

export const MOCK_TRANSFERS: Transfer[] = [
  {
    id: 'TR001',
    request_id: 'REQ004',
    source_hospital_id: 'H003',
    source_hospital_name: 'City Care Hospital',
    destination_hospital_id: 'H004',
    destination_hospital_name: 'Sahyadri Medical Center',
    inventory_id: 'INV007',
    quantity: 3,
    priority: 'ROUTINE',
    status: 'IN_TRANSIT',
    dispatched_at: today.toISOString(),
    created_at: today.toISOString(),
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT001',
    severity: 'CRITICAL',
    type: 'EXPIRY_CRITICAL',
    entity_id: 'INV004',
    hospital_id: 'H002',
    title: 'Critical Expiry Alert: O+ RBC',
    message: 'Unit INV004 (O+ RBC, Qty: 4) expires in 2 days at District Hospital.',
    is_acknowledged: false,
    escalation_level: 1,
    created_at: today.toISOString(),
  },
  {
    id: 'ALT002',
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
    id: 'ALT003',
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

export class MockDataStore {
  hospitals = [...MOCK_HOSPITALS];
  users = [...MOCK_USERS];
  inventory = [...MOCK_INVENTORY];
  requests = [...MOCK_REQUESTS];
  transfers = [...MOCK_TRANSFERS];
  alerts = [...MOCK_ALERTS];
  offsetHours = 0;
  enginePaused = { 'inventory-sync': false, 'priority-scheduling': false, 'web-engine': false, 'match-expiry': false };

  login(credentials: { email: string; password?: string }) {
    const user = this.users.find(u => u.email.toLowerCase() === (credentials.email || '').toLowerCase()) || this.users[0];
    const token = 'demo-jwt-token-' + user.id;
    localStorage.setItem('demo_user', JSON.stringify(user));
    return { token, user };
  }

  register(userData: { name: string; email: string; hospital_id?: string; role?: string }) {
    const hospital = this.hospitals.find(h => h.id === userData.hospital_id) || this.hospitals[0];
    const newUser: User = {
      id: `U${String(this.users.length + 1).padStart(3, '0')}`,
      name: userData.name || 'Medical Officer',
      email: userData.email,
      role: (userData.role as any) || 'HOSPITAL_ADMIN',
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      status: 'ACTIVE',
    };
    this.users.push(newUser);
    const token = 'demo-jwt-token-' + newUser.id;
    localStorage.setItem('demo_user', JSON.stringify(newUser));
    return { token, user: newUser };
  }

  getCurrentUser() {
    const saved = localStorage.getItem('demo_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return this.users[0];
  }

  getEngineStatus() {
    return {
      engines: [
        { id: 'inventory-sync', name: 'Inventory Sync Engine', subject: 'DBMS LEDGER', status: this.enginePaused['inventory-sync'] ? 'PAUSED' : 'RUNNING', algorithm: 'Single-Writer Mutex & Row Locks', queueDepth: '0 waiting' },
        { id: 'priority-scheduling', name: 'Priority Scheduling Engine', subject: 'OS QUEUES', status: this.enginePaused['priority-scheduling'] ? 'PAUSED' : 'RUNNING', algorithm: 'OS MLFQ & Banker Safety', queueDepth: `${this.requests.length} requests` },
        { id: 'web-engine', name: 'Web Engine', subject: 'FULL-STACK WEB', status: this.enginePaused['web-engine'] ? 'PAUSED' : 'RUNNING', algorithm: 'REST API, SSE Stream & Reactive UI', queueDepth: 'Active HTTP/2' },
        { id: 'match-expiry', name: 'Match and Expiry Engine', subject: 'DSA GRAPH & HEAP', status: this.enginePaused['match-expiry'] ? 'PAUSED' : 'RUNNING', algorithm: 'Dijkstra Path + Min-Heap FEFO', queueDepth: `${this.inventory.length} units` },
      ],
      clock: {
        now: new Date(Date.now() + this.offsetHours * 3600000).toISOString(),
        offsetHours: this.offsetHours,
      }
    };
  }

  getSchedulerQueue() {
    return {
      level0_emergency: this.requests.filter(r => r.priority === 'EMERGENCY'),
      level1_urgent: this.requests.filter(r => r.priority === 'URGENT'),
      level2_routine: this.requests.filter(r => r.priority === 'ROUTINE'),
    };
  }

  getBankerState() {
    return {
      safe: true,
      safeSequence: ['REQ003', 'REQ001', 'REQ006', 'REQ002'],
      available: { 'O+': 10, 'A+': 5, 'B+': 15, 'O-': 6 },
      maxNeed: { REQ001: { 'O+': 4 }, REQ002: { 'A+': 5 }, REQ003: { 'O-': 2 }, REQ006: { 'O+': 4, 'B+': 4 } },
      allocated: { REQ001: { 'O+': 0 }, REQ002: { 'A+': 0 }, REQ003: { 'O-': 2 }, REQ006: { 'O+': 0, 'B+': 0 } }
    };
  }

  runAllScenarios() {
    return [
      { id: 'S1', name: 'Emergency Preemption', status: 'PASSED', details: 'Preempted tentative hold HOLD001, granted EMERGENCY request REQ003. +15 compensation boost applied to victim REQ005.' },
      { id: 'S2', name: 'Aging Math', status: 'PASSED', details: 'Promoted ROUTINE request REQ002 to URGENT priority queue after exceeding 12-hour wait threshold without starvation.' },
      { id: 'S3', name: 'Banker Avoidance', status: 'PASSED', details: 'Executed multi-resource safety check. Safe sequence validated: [REQ003 -> REQ001 -> REQ006 -> REQ002]. Deadlock state avoided.' },
      { id: 'S4', name: 'Concurrency Lock Ordering', status: 'PASSED', details: 'Simulated 20 concurrent allocation requests. Single-writer ascending resource mutex verified with 100% ledger consistency.' },
      { id: 'S5', name: 'Expiry Fast-Forward', status: 'PASSED', details: 'Advanced clock by +3 days. Unit INV004 transitioned to CRITICAL tier. Escalated alert ALT001 dispatched to blood bank dashboard.' },
      { id: 'S6', name: 'End-to-End Fulfillment', status: 'PASSED', details: 'Full lifecycle verified: Request -> Dijkstra Shortest Path Matched -> Authorized -> In-Transit -> Received & Stock Reconciled.' }
    ];
  }
}

export const mockStore = new MockDataStore();
