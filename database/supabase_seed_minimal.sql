-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- MINIMAL CLEAN SEED SCRIPT FOR MERGED SCHEMA
-- ==============================================================================

-- 1. HOSPITALS (Logistics Graph Nodes)
INSERT INTO hospitals (id, name, city, address, contact_number, status) VALUES
('H001', 'KLE Hospital', 'Belagavi', 'JNMC Campus, Nehru Nagar, Belagavi', '+91 831 247 3777', 'ACTIVE'),
('H002', 'District Hospital', 'Belagavi', 'APMC Road, Belagavi', '+91 831 240 4000', 'ACTIVE'),
('H003', 'City Care Hospital', 'Hubballi', 'Vidya Nagar, Hubballi', '+91 836 225 8888', 'ACTIVE'),
('H004', 'Sahyadri Medical Center', 'Dharwad', 'PB Road, Dharwad', '+91 836 244 5555', 'ACTIVE'),
('H005', 'Shree Hospital', 'Bengaluru', 'Rajajinagar, Bengaluru', '+91 80 2332 1111', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 2. PRIMARY SYSTEM ADMINISTRATOR ACCOUNT (Password: demo123)
INSERT INTO users (id, name, email, password_hash, role, hospital_id, status) VALUES
('U006', 'System Administrator', 'admin@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SYSTEM_ADMIN', 'H001', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. HOSPITAL DISTANCE MATRIX (Road Graph Edge Weights in KM)
INSERT INTO hospital_distances (id, from_hospital_id, to_hospital_id, distance_km) VALUES
('D001', 'H001', 'H002', 5.0),
('D002', 'H002', 'H001', 5.0),
('D003', 'H001', 'H004', 80.0),
('D004', 'H004', 'H001', 80.0),
('D005', 'H002', 'H004', 80.0),
('D006', 'H004', 'H002', 80.0),
('D007', 'H004', 'H003', 20.0),
('D008', 'H003', 'H004', 20.0),
('D009', 'H001', 'H003', 95.0),
('D010', 'H003', 'H001', 95.0),
('D011', 'H003', 'H005', 410.0),
('D012', 'H005', 'H003', 410.0),
('D013', 'H004', 'H005', 420.0),
('D014', 'H005', 'H004', 420.0)
ON CONFLICT (id) DO NOTHING;

-- 4. SYSTEM CONFIGURATIONS (Merged policies, weights, and substitution rules)
INSERT INTO system_configurations (config_key, category, config_value, description) VALUES
('expiry_policies', 'EXPIRY_POLICY', '[
  {"component": "RBC", "near_expiry_days": 7, "critical_hours": 72},
  {"component": "PLATELETS", "near_expiry_days": 2, "critical_hours": 24},
  {"component": "PLASMA", "near_expiry_days": 30, "critical_hours": 168},
  {"component": "WHOLE_BLOOD", "near_expiry_days": 5, "critical_hours": 48}
]'::jsonb, 'Shelf life policies per blood product component'),
('algorithm_weights', 'ENGINE', '{
  "FASTEST": {"w_expiry": 0.25, "w_distance": 0.60, "w_fit": 0.15},
  "BALANCED": {"w_expiry": 0.35, "w_distance": 0.50, "w_fit": 0.15}
}'::jsonb, 'Multi-criteria matching engine profile scoring weights'),
('scheduler_settings', 'SCHEDULER', '{
  "loopIntervalSeconds": 10,
  "holdTTLMinutes": 30,
  "maxPreemptions": 2,
  "agingIntervalMinutes": 5,
  "agingStepPoints": 5
}'::jsonb, 'MLFQ scheduler timing, aging math, and hold expiration parameters')
ON CONFLICT (config_key) DO NOTHING;

-- 5. INITIAL AUDIT LOG
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details) VALUES
('LOG001', 'U006', 'SYSTEM_INITIALIZED_CLEAN', 'SYSTEM', 'SYS', '{"message": "Clean merged database initialized"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
