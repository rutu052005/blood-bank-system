-- Seed Data for Multi-Hospital Blood Resource Sharing System (DEMO DATA ONLY)

INSERT INTO hospitals (id, name, city, address, contact_number, status) VALUES
('H001', 'KLE Hospital', 'Belagavi', 'JNMC Campus, Nehru Nagar, Belagavi', '+91 831 247 3777', 'ACTIVE'),
('H002', 'District Hospital', 'Belagavi', 'APMC Road, Belagavi', '+91 831 240 4000', 'ACTIVE'),
('H003', 'City Care Hospital', 'Hubballi', 'Vidya Nagar, Hubballi', '+91 836 225 8888', 'ACTIVE'),
('H004', 'Sahyadri Medical Center', 'Dharwad', 'PB Road, Dharwad', '+91 836 244 5555', 'ACTIVE'),
('H005', 'Shree Hospital', 'Bengaluru', 'Rajajinagar, Bengaluru', '+91 80 2332 1111', 'ACTIVE');

-- Passwords hashed with bcrypt (password: demo123)
-- $2a$10$4.q1gGv22fW6L0q1G9.dTe30lG.o9e4T5iJk4e5r.h2k.e1g4
INSERT INTO users (id, name, email, password_hash, role, hospital_id, status) VALUES
('U001', 'Anil Kumar', 'anil@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H001', 'ACTIVE'),
('U002', 'Priya Shah', 'priya@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'REQUEST_MANAGER', 'H002', 'ACTIVE'),
('U003', 'Rahul Patil', 'rahul@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H003', 'ACTIVE'),
('U004', 'Sneha Joshi', 'sneha@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HOSPITAL_ADMIN', 'H004', 'ACTIVE'),
('U005', 'Meera Rao', 'meera@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'INVENTORY_MANAGER', 'H005', 'ACTIVE'),
('U006', 'Demo Admin', 'admin@demo.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SYSTEM_ADMIN', 'H001', 'ACTIVE');

-- Default Expiry Policies
INSERT INTO expiry_policies (component, near_expiry_days, critical_hours) VALUES
('RBC', 7, 72),
('PLATELETS', 2, 24),
('PLASMA', 30, 168),
('WHOLE_BLOOD', 5, 48);

-- Hospital Distances (km)
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
('D014', 'H005', 'H004', 420.0);
