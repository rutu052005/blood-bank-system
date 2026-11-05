-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- DEMO SEED DATA (4 TO 6 ROWS PER TABLE ACROSS ALL 10 MERGED TABLES)
-- ==============================================================================
-- Run this in your Supabase SQL Editor to populate all 10 tables!
-- ==============================================================================

-- 1. HOSPITALS (5 rows)
INSERT INTO hospitals (id, name, city, address, contact_number, status) VALUES
('H001', 'KLE Hospital', 'Belagavi', 'JNMC Campus, Nehru Nagar, Belagavi', '+91 831 247 3777', 'ACTIVE'),
('H002', 'District Hospital', 'Belagavi', 'APMC Road, Belagavi', '+91 831 240 4000', 'ACTIVE'),
('H003', 'City Care Hospital', 'Hubballi', 'Vidya Nagar, Hubballi', '+91 836 225 8888', 'ACTIVE'),
('H004', 'Sahyadri Medical Center', 'Dharwad', 'PB Road, Dharwad', '+91 836 244 5555', 'ACTIVE'),
('H005', 'Shree Hospital', 'Bengaluru', 'Rajajinagar, Bengaluru', '+91 80 2332 1111', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    city = EXCLUDED.city, 
    contact_number = EXCLUDED.contact_number;

-- 2. USERS (6 rows, Password for all accounts: demo123)
-- bcrypt hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (id, name, email, password_hash, role, hospital_id, status) VALUES
('U001', 'Anil Kumar', 'anil@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H001', 'ACTIVE'),
('U002', 'Priya Shah', 'priya@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'REQUEST_MANAGER', 'H002', 'ACTIVE'),
('U003', 'Rahul Patil', 'rahul@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H003', 'ACTIVE'),
('U004', 'Sneha Joshi', 'sneha@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HOSPITAL_ADMIN', 'H004', 'ACTIVE'),
('U005', 'Meera Rao', 'meera@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H005', 'ACTIVE'),
('U006', 'System Administrator', 'admin@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SYSTEM_ADMIN', 'H001', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    role = EXCLUDED.role, 
    hospital_id = EXCLUDED.hospital_id;

-- 3. HOSPITAL_DISTANCES (6 rows)
INSERT INTO hospital_distances (id, from_hospital_id, to_hospital_id, distance_km) VALUES
('D001', 'H001', 'H002', 5.0),
('D002', 'H002', 'H001', 5.0),
('D003', 'H001', 'H004', 80.0),
('D004', 'H004', 'H003', 20.0),
('D005', 'H003', 'H004', 20.0),
('D006', 'H003', 'H005', 410.0)
ON CONFLICT (id) DO UPDATE SET distance_km = EXCLUDED.distance_km;

-- 4. BLOOD_INVENTORY (6 rows)
INSERT INTO blood_inventory (id, hospital_id, blood_group, component, quantity_total, quantity_held, quantity_in_transit, collection_date, expiry_date, status, expiry_tier, next_transition_at) VALUES
('INV001', 'H001', 'O+', 'RBC', 12, 2, 0, CURRENT_DATE - 5, CURRENT_DATE + 30, 'AVAILABLE', 'VALID', CURRENT_TIMESTAMP + INTERVAL '25 days'),
('INV002', 'H001', 'A+', 'RBC', 6, 0, 0, CURRENT_DATE - 25, CURRENT_DATE + 5, 'AVAILABLE', 'NEAR_EXPIRY', CURRENT_TIMESTAMP + INTERVAL '3 days'),
('INV003', 'H002', 'B+', 'PLASMA', 15, 0, 0, CURRENT_DATE - 10, CURRENT_DATE + 120, 'AVAILABLE', 'VALID', CURRENT_TIMESTAMP + INTERVAL '90 days'),
('INV004', 'H002', 'O-', 'RBC', 4, 2, 0, CURRENT_DATE - 30, CURRENT_DATE + 2, 'AVAILABLE', 'CRITICAL', CURRENT_TIMESTAMP + INTERVAL '24 hours'),
('INV005', 'H003', 'AB+', 'PLATELETS', 8, 0, 2, CURRENT_DATE - 2, CURRENT_DATE + 3, 'AVAILABLE', 'NEAR_EXPIRY', CURRENT_TIMESTAMP + INTERVAL '36 hours'),
('INV006', 'H004', 'O-', 'RBC', 5, 0, 0, CURRENT_DATE - 12, CURRENT_DATE + 22, 'AVAILABLE', 'VALID', CURRENT_TIMESTAMP + INTERVAL '18 days')
ON CONFLICT (id) DO UPDATE SET 
    quantity_total = EXCLUDED.quantity_total,
    quantity_held = EXCLUDED.quantity_held,
    expiry_tier = EXCLUDED.expiry_tier;

-- 5. INVENTORY_HOLDS (5 rows)
INSERT INTO inventory_holds (id, request_id, inventory_id, quantity, expires_at, status) VALUES
('HOLD001', 'REQ001', 'INV001', 2, CURRENT_TIMESTAMP + INTERVAL '25 minutes', 'ACTIVE'),
('HOLD002', 'REQ002', 'INV004', 2, CURRENT_TIMESTAMP + INTERVAL '15 minutes', 'ACTIVE'),
('HOLD003', 'REQ003', 'INV003', 3, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'RELEASED'),
('HOLD004', 'REQ004', 'INV005', 2, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'FULFILLED'),
('HOLD005', 'REQ005', 'INV006', 1, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'PREEMPTED')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 6. INVENTORY_MOVEMENTS (6 rows)
INSERT INTO inventory_movements (id, inventory_id, movement_type, quantity_change, performed_by, notes) VALUES
('MOV001', 'INV001', 'ADD', 12, 'U001', 'Voluntary blood drive donation collection'),
('MOV002', 'INV002', 'ADD', 6, 'U001', 'Initial verified stock intake deposit'),
('MOV003', 'INV001', 'HOLD', -2, 'U001', 'Two-phase reservation hold for REQ001'),
('MOV004', 'INV004', 'HOLD', -2, 'U002', 'Emergency trauma lock allocation'),
('MOV005', 'INV005', 'TRANSFER_OUT', -2, 'U003', 'Dispatched under TR001 to Sahyadri Center'),
('MOV006', 'INV003', 'ADJUST', 3, 'U002', 'Component apheresis yield separation')
ON CONFLICT (id) DO NOTHING;

-- 7. BLOOD_REQUESTS (5 rows)
INSERT INTO blood_requests (id, requesting_hospital_id, priority, status, required_by, aging_points, promoted_by_aging, preempted_count, compensation_boost, items, matches, status_history, created_by) VALUES
('REQ001', 'H002', 'EMERGENCY', 'PENDING', CURRENT_TIMESTAMP + INTERVAL '4 hours', 0, FALSE, 0, 0, 
    '[{"blood_group": "O-", "component": "RBC", "quantity": 2}]'::jsonb, 
    '[{"donor_hospital": "H001", "unit_id": "INV004", "score": 94.5}]'::jsonb, 
    '[{"from": null, "to": "PENDING", "at": "2026-10-27T10:00:00Z"}]'::jsonb, 'U002'),
('REQ002', 'H004', 'URGENT', 'MATCHED', CURRENT_TIMESTAMP + INTERVAL '12 hours', 15, FALSE, 0, 0, 
    '[{"blood_group": "O+", "component": "RBC", "quantity": 4}]'::jsonb, 
    '[{"donor_hospital": "H001", "unit_id": "INV001", "score": 88.2}]'::jsonb, 
    '[{"from": "PENDING", "to": "MATCHED", "at": "2026-10-27T10:15:00Z"}]'::jsonb, 'U004'),
('REQ003', 'H003', 'ROUTINE', 'IN_PROGRESS', CURRENT_TIMESTAMP + INTERVAL '36 hours', 5, FALSE, 0, 0, 
    '[{"blood_group": "AB+", "component": "PLATELETS", "quantity": 2}]'::jsonb, 
    '[]'::jsonb, 
    '[{"from": "MATCHED", "to": "IN_PROGRESS", "at": "2026-10-27T10:30:00Z"}]'::jsonb, 'U003'),
('REQ004', 'H005', 'URGENT', 'APPROVED', CURRENT_TIMESTAMP + INTERVAL '18 hours', 0, FALSE, 0, 0, 
    '[{"blood_group": "B+", "component": "PLASMA", "quantity": 3}]'::jsonb, 
    '[]'::jsonb, 
    '[{"from": "PENDING", "to": "APPROVED", "at": "2026-10-27T10:45:00Z"}]'::jsonb, 'U005'),
('REQ005', 'H001', 'ROUTINE', 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hours', 20, TRUE, 1, 15, 
    '[{"blood_group": "A+", "component": "RBC", "quantity": 2}]'::jsonb, 
    '[]'::jsonb, 
    '[{"from": "IN_PROGRESS", "to": "FULFILLED", "at": "2026-10-27T11:00:00Z"}]'::jsonb, 'U001')
ON CONFLICT (id) DO UPDATE SET 
    status = EXCLUDED.status, 
    aging_points = EXCLUDED.aging_points;

-- 8. TRANSFERS (5 rows)
INSERT INTO transfers (id, request_id, source_hospital_id, destination_hospital_id, inventory_id, quantity, priority, status, dispatched_at, received_at) VALUES
('TR001', 'REQ003', 'H003', 'H004', 'INV005', 2, 'ROUTINE', 'IN_TRANSIT', CURRENT_TIMESTAMP - INTERVAL '30 minutes', NULL),
('TR002', 'REQ001', 'H001', 'H002', 'INV004', 2, 'EMERGENCY', 'APPROVED', NULL, NULL),
('TR003', 'REQ004', 'H002', 'H005', 'INV003', 3, 'URGENT', 'INITIATED', NULL, NULL),
('TR004', 'REQ005', 'H004', 'H001', 'INV002', 2, 'ROUTINE', 'RECEIVED', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('TR005', 'REQ002', 'H001', 'H004', 'INV006', 1, 'URGENT', 'CANCELLED', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 9. ALERTS (5 rows)
INSERT INTO alerts (id, severity, type, entity_id, hospital_id, title, message, is_acknowledged, escalation_level, channel, delivery_status) VALUES
('ALT001', 'CRITICAL', 'EXPIRY_CRITICAL', 'INV004', 'H002', 'Critical Expiry: O- RBC (48h Remaining)', 'Unit INV004 enters critical window at District Hospital.', FALSE, 1, 'IN_APP', 'SENT'),
('ALT002', 'WARNING', 'EXPIRY_WARNING', 'INV002', 'H001', 'Near Expiry: A+ RBC (5 days remaining)', 'Unit INV002 recommended for priority reallocation.', FALSE, 0, 'IN_APP', 'SENT'),
('ALT003', 'CRITICAL', 'EMERGENCY_REQUEST', 'REQ001', 'H002', 'Emergency Trauma Request: 2 Units O- RBC', 'District Hospital trauma ward triggered code emergency.', FALSE, 0, 'IN_APP', 'SENT'),
('ALT004', 'INFO', 'TRANSFER_DISPATCHED', 'TR001', 'H003', 'Transport Dispatched: Hubballi to Dharwad', 'Vehicle transit initiated for 2 units AB+ Platelets.', TRUE, 0, 'IN_APP', 'SENT'),
('ALT005', 'WARNING', 'SHORTAGE_RISK', 'H001', 'H001', 'Cluster Shortage Warning: Platelets Reserve Low', 'Belagavi regional supply buffer fallen below 4 units.', FALSE, 0, 'IN_APP', 'SENT')
ON CONFLICT (id) DO UPDATE SET is_acknowledged = EXCLUDED.is_acknowledged;

-- 10. AUDIT_LOGS (6 rows)
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details) VALUES
('LOG001', 'U006', 'SYSTEM_INITIALIZED', 'SYSTEM', 'SYS', '{"message": "Database populated with demonstration stock"}'::jsonb),
('LOG002', 'U001', 'ADD_INVENTORY', 'INVENTORY', 'INV001', '{"blood_group": "O+", "component": "RBC", "qty": 12}'::jsonb),
('LOG003', 'U002', 'CREATE_REQUEST', 'REQUEST', 'REQ001', '{"priority": "EMERGENCY", "qty": 2}'::jsonb),
('LOG004', 'U004', 'APPROVE_REQUEST', 'REQUEST', 'REQ002', '{"action": "MATCH_CONFIRMED"}'::jsonb),
('LOG005', 'U003', 'DISPATCH_TRANSFER', 'TRANSFER', 'TR001', '{"courier": "Express Ambulance 04"}'::jsonb),
('LOG006', 'U006', 'MLFQ_SCHEDULER_CYCLE', 'SCHEDULER', 'SCHED', '{"safeState": true, "promoted": "REQ005"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Also configure full read/write RLS permissions for the web app
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'hospitals', 'users', 'hospital_distances', 'blood_inventory',
            'inventory_holds', 'inventory_movements', 'blood_requests',
            'transfers', 'alerts', 'audit_logs'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon %s" ON %I;', t, t);
        EXECUTE format('CREATE POLICY "Allow all for anon %s" ON %I FOR ALL USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

SELECT 'Success: 5 to 6 realistic rows added to all 10 tables!' AS status;
