import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://efhytlcbxjykpfabvdgg.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const sb = createClient(supabaseUrl, supabaseKey);

async function seedFakeData() {
  console.log('Seeding fake data into Supabase...');

  // 1. HOSPITALS (5 rows)
  const hospitals = [
    { id: 'H001', name: 'KLE Hospital', city: 'Belagavi', address: 'JNMC Campus, Nehru Nagar, Belagavi', contact_number: '+91 831 247 3777', status: 'ACTIVE' },
    { id: 'H002', name: 'District Hospital', city: 'Belagavi', address: 'APMC Road, Belagavi', contact_number: '+91 831 240 4000', status: 'ACTIVE' },
    { id: 'H003', name: 'City Care Hospital', city: 'Hubballi', address: 'Vidya Nagar, Hubballi', contact_number: '+91 836 225 8888', status: 'ACTIVE' },
    { id: 'H004', name: 'Sahyadri Medical Center', city: 'Dharwad', address: 'PB Road, Dharwad', contact_number: '+91 836 244 5555', status: 'ACTIVE' },
    { id: 'H005', name: 'Shree Hospital', city: 'Bengaluru', address: 'Rajajinagar, Bengaluru', contact_number: '+91 80 2332 1111', status: 'ACTIVE' }
  ];
  const hRes = await sb.from('hospitals').upsert(hospitals);
  console.log('1. Hospitals:', hRes.error ? hRes.error.message : '5 rows inserted');

  // 2. USERS (6 rows, demo password 'demo123')
  const passwordHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  const users = [
    { id: 'U001', name: 'Anil Kumar', email: 'anil@demo.local', password_hash: passwordHash, role: 'INVENTORY_MANAGER', hospital_id: 'H001', status: 'ACTIVE' },
    { id: 'U002', name: 'Priya Shah', email: 'priya@demo.local', password_hash: passwordHash, role: 'REQUEST_MANAGER', hospital_id: 'H002', status: 'ACTIVE' },
    { id: 'U003', name: 'Rahul Patil', email: 'rahul@demo.local', password_hash: passwordHash, role: 'INVENTORY_MANAGER', hospital_id: 'H003', status: 'ACTIVE' },
    { id: 'U004', name: 'Sneha Joshi', email: 'sneha@demo.local', password_hash: passwordHash, role: 'HOSPITAL_ADMIN', hospital_id: 'H004', status: 'ACTIVE' },
    { id: 'U005', name: 'Meera Rao', email: 'meera@demo.local', password_hash: passwordHash, role: 'INVENTORY_MANAGER', hospital_id: 'H005', status: 'ACTIVE' },
    { id: 'U006', name: 'System Administrator', email: 'admin@demo.local', password_hash: passwordHash, role: 'SYSTEM_ADMIN', hospital_id: 'H001', status: 'ACTIVE' }
  ];
  const uRes = await sb.from('users').upsert(users);
  console.log('2. Users:', uRes.error ? uRes.error.message : '6 rows inserted');

  // 3. HOSPITAL_DISTANCES (6 rows)
  const distances = [
    { id: 'D001', from_hospital_id: 'H001', to_hospital_id: 'H002', distance_km: 5.0 },
    { id: 'D002', from_hospital_id: 'H002', to_hospital_id: 'H001', distance_km: 5.0 },
    { id: 'D003', from_hospital_id: 'H001', to_hospital_id: 'H004', distance_km: 80.0 },
    { id: 'D004', from_hospital_id: 'H004', to_hospital_id: 'H003', distance_km: 20.0 },
    { id: 'D005', from_hospital_id: 'H003', to_hospital_id: 'H004', distance_km: 20.0 },
    { id: 'D006', from_hospital_id: 'H003', to_hospital_id: 'H005', distance_km: 410.0 }
  ];
  const dRes = await sb.from('hospital_distances').upsert(distances);
  console.log('3. Distances:', dRes.error ? dRes.error.message : '6 rows inserted');

  // 4. BLOOD_INVENTORY (6 rows)
  const today = new Date();
  const addDays = (d) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  };

  const inventory = [
    { id: 'INV001', hospital_id: 'H001', blood_group: 'O+', component: 'RBC', quantity_total: 12, quantity_held: 2, quantity_in_transit: 0, collection_date: addDays(-5), expiry_date: addDays(30), status: 'AVAILABLE', expiry_tier: 'VALID' },
    { id: 'INV002', hospital_id: 'H001', blood_group: 'A+', component: 'RBC', quantity_total: 6, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-25), expiry_date: addDays(5), status: 'AVAILABLE', expiry_tier: 'NEAR_EXPIRY' },
    { id: 'INV003', hospital_id: 'H002', blood_group: 'B+', component: 'PLASMA', quantity_total: 15, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-10), expiry_date: addDays(120), status: 'AVAILABLE', expiry_tier: 'VALID' },
    { id: 'INV004', hospital_id: 'H002', blood_group: 'O-', component: 'RBC', quantity_total: 4, quantity_held: 2, quantity_in_transit: 0, collection_date: addDays(-30), expiry_date: addDays(2), status: 'AVAILABLE', expiry_tier: 'CRITICAL' },
    { id: 'INV005', hospital_id: 'H003', blood_group: 'AB+', component: 'PLATELETS', quantity_total: 8, quantity_held: 0, quantity_in_transit: 2, collection_date: addDays(-2), expiry_date: addDays(3), status: 'AVAILABLE', expiry_tier: 'NEAR_EXPIRY' },
    { id: 'INV006', hospital_id: 'H004', blood_group: 'O-', component: 'RBC', quantity_total: 5, quantity_held: 0, quantity_in_transit: 0, collection_date: addDays(-12), expiry_date: addDays(22), status: 'AVAILABLE', expiry_tier: 'VALID' }
  ];
  const invRes = await sb.from('blood_inventory').upsert(inventory);
  console.log('4. Blood Inventory:', invRes.error ? invRes.error.message : '6 rows inserted');

  // 5. INVENTORY_HOLDS (5 rows)
  const holds = [
    { id: 'HOLD001', request_id: 'REQ001', inventory_id: 'INV001', quantity: 2, expires_at: new Date(Date.now() + 25 * 60000).toISOString(), status: 'ACTIVE' },
    { id: 'HOLD002', request_id: 'REQ002', inventory_id: 'INV004', quantity: 2, expires_at: new Date(Date.now() + 15 * 60000).toISOString(), status: 'ACTIVE' },
    { id: 'HOLD003', request_id: 'REQ003', inventory_id: 'INV003', quantity: 3, expires_at: new Date(Date.now() - 3600000).toISOString(), status: 'RELEASED' },
    { id: 'HOLD004', request_id: 'REQ004', inventory_id: 'INV005', quantity: 2, expires_at: new Date(Date.now() - 7200000).toISOString(), status: 'FULFILLED' },
    { id: 'HOLD005', request_id: 'REQ005', inventory_id: 'INV006', quantity: 1, expires_at: new Date(Date.now() - 1800000).toISOString(), status: 'PREEMPTED' }
  ];
  const holdRes = await sb.from('inventory_holds').upsert(holds);
  console.log('5. Inventory Holds:', holdRes.error ? holdRes.error.message : '5 rows inserted');

  // 6. INVENTORY_MOVEMENTS (6 rows)
  const movements = [
    { id: 'MOV001', inventory_id: 'INV001', movement_type: 'ADD', quantity_change: 12, performed_by: 'U001', notes: 'Voluntary donor camp collection' },
    { id: 'MOV002', inventory_id: 'INV002', movement_type: 'ADD', quantity_change: 6, performed_by: 'U001', notes: 'Initial verified stock deposit' },
    { id: 'MOV003', inventory_id: 'INV001', movement_type: 'HOLD', quantity_change: -2, performed_by: 'U001', notes: 'Two-phase lock for REQ001' },
    { id: 'MOV004', inventory_id: 'INV004', movement_type: 'HOLD', quantity_change: -2, performed_by: 'U002', notes: 'Emergency lock for trauma order' },
    { id: 'MOV005', inventory_id: 'INV005', movement_type: 'TRANSFER_OUT', quantity_change: -2, performed_by: 'U003', notes: 'Dispatched under TR001 to H004' },
    { id: 'MOV006', inventory_id: 'INV003', movement_type: 'ADJUST', quantity_change: 3, performed_by: 'U002', notes: 'Lab separation yield intake' }
  ];
  const movRes = await sb.from('inventory_movements').upsert(movements);
  console.log('6. Inventory Movements:', movRes.error ? movRes.error.message : '6 rows inserted');

  // 7. BLOOD_REQUESTS (5 rows)
  const requests = [
    {
      id: 'REQ001',
      requesting_hospital_id: 'H002',
      priority: 'EMERGENCY',
      status: 'PENDING',
      required_by: new Date(Date.now() + 4 * 3600000).toISOString(),
      aging_points: 0,
      promoted_by_aging: false,
      preempted_count: 0,
      compensation_boost: 0,
      items: [{ blood_group: 'O-', component: 'RBC', quantity: 2 }],
      matches: [{ donor_hospital: 'H001', unit_id: 'INV004', score: 94.5 }],
      status_history: [{ from: null, to: 'PENDING', at: new Date().toISOString() }],
      created_by: 'U002'
    },
    {
      id: 'REQ002',
      requesting_hospital_id: 'H004',
      priority: 'URGENT',
      status: 'MATCHED',
      required_by: new Date(Date.now() + 12 * 3600000).toISOString(),
      aging_points: 15,
      promoted_by_aging: false,
      preempted_count: 0,
      compensation_boost: 0,
      items: [{ blood_group: 'O+', component: 'RBC', quantity: 4 }],
      matches: [{ donor_hospital: 'H001', unit_id: 'INV001', score: 88.2 }],
      status_history: [{ from: 'PENDING', to: 'MATCHED', at: new Date().toISOString() }],
      created_by: 'U004'
    },
    {
      id: 'REQ003',
      requesting_hospital_id: 'H003',
      priority: 'ROUTINE',
      status: 'IN_PROGRESS',
      required_by: new Date(Date.now() + 36 * 3600000).toISOString(),
      aging_points: 5,
      promoted_by_aging: false,
      preempted_count: 0,
      compensation_boost: 0,
      items: [{ blood_group: 'AB+', component: 'PLATELETS', quantity: 2 }],
      matches: [],
      status_history: [{ from: 'MATCHED', to: 'IN_PROGRESS', at: new Date().toISOString() }],
      created_by: 'U003'
    },
    {
      id: 'REQ004',
      requesting_hospital_id: 'H005',
      priority: 'URGENT',
      status: 'APPROVED',
      required_by: new Date(Date.now() + 18 * 3600000).toISOString(),
      aging_points: 0,
      promoted_by_aging: false,
      preempted_count: 0,
      compensation_boost: 0,
      items: [{ blood_group: 'B+', component: 'PLASMA', quantity: 3 }],
      matches: [],
      status_history: [{ from: 'PENDING', to: 'APPROVED', at: new Date().toISOString() }],
      created_by: 'U005'
    },
    {
      id: 'REQ005',
      requesting_hospital_id: 'H001',
      priority: 'ROUTINE',
      status: 'FULFILLED',
      required_by: new Date(Date.now() + 48 * 3600000).toISOString(),
      aging_points: 20,
      promoted_by_aging: true,
      preempted_count: 1,
      compensation_boost: 15,
      items: [{ blood_group: 'A+', component: 'RBC', quantity: 2 }],
      matches: [],
      status_history: [{ from: 'IN_PROGRESS', to: 'FULFILLED', at: new Date().toISOString() }],
      created_by: 'U001'
    }
  ];
  const reqRes = await sb.from('blood_requests').upsert(requests);
  console.log('7. Blood Requests:', reqRes.error ? reqRes.error.message : '5 rows inserted');

  // 8. TRANSFERS (5 rows)
  const transfers = [
    { id: 'TR001', request_id: 'REQ003', source_hospital_id: 'H003', destination_hospital_id: 'H004', inventory_id: 'INV005', quantity: 2, priority: 'ROUTINE', status: 'IN_TRANSIT', dispatched_at: new Date().toISOString() },
    { id: 'TR002', request_id: 'REQ001', source_hospital_id: 'H001', destination_hospital_id: 'H002', inventory_id: 'INV004', quantity: 2, priority: 'EMERGENCY', status: 'APPROVED' },
    { id: 'TR003', request_id: 'REQ004', source_hospital_id: 'H002', destination_hospital_id: 'H005', inventory_id: 'INV003', quantity: 3, priority: 'URGENT', status: 'INITIATED' },
    { id: 'TR004', request_id: 'REQ005', source_hospital_id: 'H004', destination_hospital_id: 'H001', inventory_id: 'INV002', quantity: 2, priority: 'ROUTINE', status: 'RECEIVED', received_at: new Date().toISOString() },
    { id: 'TR005', request_id: 'REQ002', source_hospital_id: 'H001', destination_hospital_id: 'H004', inventory_id: 'INV006', quantity: 1, priority: 'URGENT', status: 'CANCELLED' }
  ];
  const trRes = await sb.from('transfers').upsert(transfers);
  console.log('8. Transfers:', trRes.error ? trRes.error.message : '5 rows inserted');

  // 9. ALERTS (5 rows)
  const alerts = [
    { id: 'ALT001', severity: 'CRITICAL', type: 'EXPIRY_CRITICAL', entity_id: 'INV004', hospital_id: 'H002', title: 'Critical Expiry: O- RBC (48h Remaining)', message: 'Unit INV004 enters critical window at District Hospital.', is_acknowledged: false, escalation_level: 1, channel: 'IN_APP', delivery_status: 'SENT' },
    { id: 'ALT002', severity: 'WARNING', type: 'EXPIRY_WARNING', entity_id: 'INV002', hospital_id: 'H001', title: 'Near Expiry: A+ RBC (5 days remaining)', message: 'Unit INV002 recommended for priority reallocation.', is_acknowledged: false, escalation_level: 0, channel: 'IN_APP', delivery_status: 'SENT' },
    { id: 'ALT003', severity: 'CRITICAL', type: 'EMERGENCY_REQUEST', entity_id: 'REQ001', hospital_id: 'H002', title: 'Emergency Trauma Request: 2 Units O- RBC', message: 'District Hospital trauma ward triggered code emergency.', is_acknowledged: false, escalation_level: 0, channel: 'IN_APP', delivery_status: 'SENT' },
    { id: 'ALT004', severity: 'INFO', type: 'TRANSFER_DISPATCHED', entity_id: 'TR001', hospital_id: 'H003', title: 'Transport Dispatched: Hubballi to Dharwad', message: 'Vehicle transit initiated for 2 units AB+ Platelets.', is_acknowledged: true, acknowledged_by: 'U003', escalation_level: 0, channel: 'IN_APP', delivery_status: 'SENT' },
    { id: 'ALT005', severity: 'WARNING', type: 'SHORTAGE_RISK', entity_id: 'H001', hospital_id: 'H001', title: 'Cluster Shortage Warning: Platelets Reserve Low', message: 'Belagavi regional supply buffer fallen below 4 units.', is_acknowledged: false, escalation_level: 0, channel: 'IN_APP', delivery_status: 'SENT' }
  ];
  const alRes = await sb.from('alerts').upsert(alerts);
  console.log('9. Alerts:', alRes.error ? alRes.error.message : '5 rows inserted');

  // 10. AUDIT_LOGS (6 rows)
  const auditLogs = [
    { id: 'LOG001', user_id: 'U006', action: 'SYSTEM_INITIALIZED', entity_type: 'SYSTEM', entity_id: 'SYS', details: { message: 'Database seeded with demonstration inventory' } },
    { id: 'LOG002', user_id: 'U001', action: 'ADD_INVENTORY', entity_type: 'INVENTORY', entity_id: 'INV001', details: { blood_group: 'O+', component: 'RBC', qty: 12 } },
    { id: 'LOG003', user_id: 'U002', action: 'CREATE_REQUEST', entity_type: 'REQUEST', entity_id: 'REQ001', details: { priority: 'EMERGENCY', qty: 2 } },
    { id: 'LOG004', user_id: 'U004', action: 'APPROVE_REQUEST', entity_type: 'REQUEST', entity_id: 'REQ002', details: { action: 'MATCH_CONFIRMED' } },
    { id: 'LOG005', user_id: 'U003', action: 'DISPATCH_TRANSFER', entity_type: 'TRANSFER', entity_id: 'TR001', details: { courier: 'Express Courier 04' } },
    { id: 'LOG006', user_id: 'U006', action: 'MLFQ_SCHEDULER_CYCLE', entity_type: 'SCHEDULER', entity_id: 'SCHED', details: { safeState: true, promoted: 'REQ005' } }
  ];
  const logRes = await sb.from('audit_logs').upsert(auditLogs);
  console.log('10. Audit Logs:', logRes.error ? logRes.error.message : '6 rows inserted');

  console.log('\nAll 10 tables seeded successfully!');
}

seedFakeData().catch(console.error);
