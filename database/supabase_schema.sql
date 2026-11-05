-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- 10-TABLE PRODUCTION SCHEMA & SEED SPECIFICATION (SELF-CLEANING)
-- ==============================================================================

-- 1. DROP OLD TABLES (CASCADE removes conflicting old versions)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notification_deliveries CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS redistribution_suggestions CASCADE;
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS scheduler_runs CASCADE;
DROP TABLE IF EXISTS engine_config CASCADE;
DROP TABLE IF EXISTS system_configurations CASCADE;
DROP TABLE IF EXISTS engine_events CASCADE;
DROP TABLE IF EXISTS attribute_substitution_rules CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS blood_requests_history CASCADE;
DROP TABLE IF EXISTS request_items CASCADE;
DROP TABLE IF EXISTS blood_requests CASCADE;
DROP TABLE IF EXISTS inventory_expiry_state CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS inventory_holds CASCADE;
DROP TABLE IF EXISTS blood_inventory CASCADE;
DROP TABLE IF EXISTS expiry_policies CASCADE;
DROP TABLE IF EXISTS hospital_distances CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table 1: HOSPITALS
CREATE TABLE hospitals (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    city VARCHAR(60) NOT NULL,
    address TEXT,
    contact_number VARCHAR(25) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: USERS
CREATE TABLE users (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'INVENTORY_MANAGER', 'REQUEST_MANAGER')),
    hospital_id VARCHAR(10) REFERENCES hospitals(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: HOSPITAL_DISTANCES
CREATE TABLE hospital_distances (
    id VARCHAR(36) PRIMARY KEY,
    from_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    to_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    distance_km DECIMAL(6, 2) NOT NULL CHECK (distance_km >= 0),
    CONSTRAINT unique_hospital_pair UNIQUE (from_hospital_id, to_hospital_id)
);

-- Table 4: BLOOD_INVENTORY (Merged with expiry state)
CREATE TABLE blood_inventory (
    id VARCHAR(20) PRIMARY KEY,
    hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    component VARCHAR(20) NOT NULL CHECK (component IN ('RBC', 'PLATELETS', 'PLASMA', 'WHOLE_BLOOD')),
    quantity_total INT NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
    quantity_held INT NOT NULL DEFAULT 0 CHECK (quantity_held >= 0),
    quantity_in_transit INT NOT NULL DEFAULT 0 CHECK (quantity_in_transit >= 0),
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'EXPIRED', 'DISCARDED', 'RESERVED')),
    expiry_tier VARCHAR(20) DEFAULT 'VALID' CHECK (expiry_tier IN ('VALID', 'NEAR_EXPIRY', 'CRITICAL', 'EXPIRED')),
    next_transition_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantities_valid CHECK (quantity_held + quantity_in_transit <= quantity_total)
);

-- Table 5: INVENTORY_HOLDS
CREATE TABLE inventory_holds (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL,
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RELEASED', 'FULFILLED', 'PREEMPTED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: INVENTORY_MOVEMENTS
CREATE TABLE inventory_movements (
    id VARCHAR(36) PRIMARY KEY,
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('ADD', 'ADJUST', 'HOLD', 'RELEASE', 'TRANSFER_OUT', 'TRANSFER_IN', 'EXPIRED', 'DISCARDED')),
    quantity_change INT NOT NULL,
    reference_id VARCHAR(36),
    performed_by VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 7: BLOOD_REQUESTS (Merged with items, matches & status history)
CREATE TABLE blood_requests (
    id VARCHAR(20) PRIMARY KEY,
    requesting_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    priority VARCHAR(15) NOT NULL CHECK (priority IN ('EMERGENCY', 'URGENT', 'ROUTINE')),
    status VARCHAR(25) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'MATCHED', 'APPROVED', 'IN_PROGRESS', 
        'FULFILLED', 'CANCELLED', 'REJECTED', 'RETURNED_FOR_REVIEW'
    )),
    required_by TIMESTAMPTZ NOT NULL,
    aging_points INT DEFAULT 0 CHECK (aging_points >= 0),
    promoted_by_aging BOOLEAN DEFAULT FALSE,
    preempted_count INT DEFAULT 0 CHECK (preempted_count >= 0),
    compensation_boost INT DEFAULT 0 CHECK (compensation_boost >= 0),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    matches JSONB DEFAULT '[]'::jsonb,
    status_history JSONB DEFAULT '[]'::jsonb,
    created_by VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 8: TRANSFERS
CREATE TABLE transfers (
    id VARCHAR(20) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES blood_requests(id) ON DELETE RESTRICT,
    source_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    destination_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    priority VARCHAR(15) NOT NULL CHECK (priority IN ('EMERGENCY', 'URGENT', 'ROUTINE')),
    status VARCHAR(20) DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED')),
    dispatched_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 9: ALERTS
CREATE TABLE alerts (
    id VARCHAR(36) PRIMARY KEY,
    severity VARCHAR(15) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36),
    hospital_id VARCHAR(10) REFERENCES hospitals(id) ON DELETE SET NULL,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    escalation_level INT DEFAULT 0 CHECK (escalation_level >= 0),
    channel VARCHAR(30) DEFAULT 'IN_APP',
    delivery_status VARCHAR(20) DEFAULT 'SENT' CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 10: AUDIT_LOGS
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. ENABLE ROW LEVEL SECURITY WITH FULL READ/WRITE ACCESS
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_distances ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon hospitals" ON hospitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon distances" ON hospital_distances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon inventory" ON blood_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon holds" ON inventory_holds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon movements" ON inventory_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon requests" ON blood_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon transfers" ON transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 3. INDEXES
CREATE INDEX idx_inventory_lookup ON blood_inventory(blood_group, component, status, expiry_tier);
CREATE INDEX idx_holds_request ON inventory_holds(request_id);
CREATE INDEX idx_requests_status ON blood_requests(status, priority);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_alerts_unack ON alerts(is_acknowledged, severity);
