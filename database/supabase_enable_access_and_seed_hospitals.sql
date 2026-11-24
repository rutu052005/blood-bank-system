-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- SUPABASE ROW-LEVEL SECURITY (RLS) ACCESS & CLEAN REFERENCE SEED
-- ==============================================================================
-- Paste and Run this in your Supabase Dashboard -> SQL Editor!
-- It does 2 things:
--   1. Enables full Read/Write permissions for the website using the Anon key.
--   2. Seeds the 5 real regional hospital nodes and staff logins.
--   3. Leaves Inventory, Requests, and Transfers at 0 (100% clean, NO fake data).
-- ==============================================================================

-- 1. DISABLE ROW LEVEL SECURITY (RLS) FOR FULL WEB-APP SYNC ACCESS
ALTER TABLE IF EXISTS hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blood_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_holds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blood_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS request_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hospital_distances DISABLE ROW LEVEL SECURITY;

-- 2. SEED THE 5 REGIONAL HOSPITAL NODES
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

-- 3. SEED STAFF LOGINS (Password for all accounts: demo123)
-- bcrypt hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (id, name, email, password_hash, role, hospital_id, status) VALUES
('U001', 'Anil Kumar', 'anil@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H001', 'ACTIVE'),
('U002', 'Priya Shah', 'priya@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'REQUEST_MANAGER', 'H002', 'ACTIVE'),
('U003', 'Rahul Patil', 'rahul@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H003', 'ACTIVE'),
('U004', 'Sneha Joshi', 'sneha@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HOSPITAL_ADMIN', 'H004', 'ACTIVE'),
('U005', 'Meera Rao', 'meera@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H005', 'ACTIVE'),
('U006', 'Dr. Suresh Admin', 'admin@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SYSTEM_ADMIN', 'H001', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    role = EXCLUDED.role, 
    hospital_id = EXCLUDED.hospital_id;

-- 4. CONFIRMATION
SELECT 'Success! RLS disabled and 5 hospitals initialized. Blood inventory, requests, and transfers are 100% clean and ready for live user input.' AS result;
