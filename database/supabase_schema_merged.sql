-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- OPTIMIZED MERGED DATABASE SCHEMA (PRODUCTION SPECIFICATION)
-- ==============================================================================
-- Merged & Consolidated Tables:
--   1. hospitals                   (Network nodes & metadata)
--   2. users                       (Staff credentials, RBAC & hospital assignment)
--   3. hospital_distances          (Road graph distance matrix for Dijkstra routing)
--   4. blood_inventory             (MERGED with inventory_expiry_state: stock + tier + next_transition)
--   5. inventory_holds             (Two-phase locks with TTL for concurrency safety)
--   6. inventory_movements         (Double-entry transaction ledger)
--   7. blood_requests              (MERGED with request_items, history & match_results: orders + items + status history)
--   8. transfers                   (Inter-hospital transport dispatches & transit status)
--   9. alerts                      (MERGED with notification_deliveries: alert details + delivery status)
--  10. audit_logs                  (MERGED telemetry & compliance activity trail)
--  11. system_configurations       (MERGED engine_config + expiry_policies + substitution_rules)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HOSPITALS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    city VARCHAR(60) NOT NULL,
    address TEXT,
    contact_number VARCHAR(25) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. USERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
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

-- ==============================================================================
-- 3. HOSPITAL_DISTANCES (Logistics road graph matrix)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS hospital_distances (
    id VARCHAR(36) PRIMARY KEY,
    from_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    to_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    distance_km DECIMAL(6, 2) NOT NULL CHECK (distance_km >= 0),
    CONSTRAINT unique_hospital_pair UNIQUE (from_hospital_id, to_hospital_id)
);

-- ==============================================================================
-- 4. BLOOD_INVENTORY (Merged with inventory_expiry_state)
-- INVARIANT: available = quantity_total - quantity_held - quantity_in_transit
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blood_inventory (
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
    -- MERGED EXPIRY STATE COLUMNS (Eliminates 1:1 join)
    expiry_tier VARCHAR(20) DEFAULT 'VALID' CHECK (expiry_tier IN ('VALID', 'NEAR_EXPIRY', 'CRITICAL', 'EXPIRED')),
    next_transition_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantities_valid CHECK (quantity_held + quantity_in_transit <= quantity_total)
);

-- ==============================================================================
-- 5. INVENTORY_HOLDS (Tentative reservations with TTL for concurrency)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inventory_holds (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL,
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RELEASED', 'FULFILLED', 'PREEMPTED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. INVENTORY_MOVEMENTS (Double-entry immutable stock ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(36) PRIMARY KEY,
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('ADD', 'ADJUST', 'HOLD', 'RELEASE', 'TRANSFER_OUT', 'TRANSFER_IN', 'EXPIRED', 'DISCARDED')),
    quantity_change INT NOT NULL,
    reference_id VARCHAR(36),
    performed_by VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. BLOOD_REQUESTS (Merged with request_items, history & match_results)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blood_requests (
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
    -- MERGED LINE ITEMS: [{"blood_group":"O+","component":"RBC","quantity":2}]
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- MERGED CANDIDATE MATCHES & EXPLANATION SCORES
    matches JSONB DEFAULT '[]'::jsonb,
    -- MERGED STATE TRANSITION AUDIT TRAIL: [{"from":"PENDING","to":"MATCHED","at":"...","by":"U001"}]
    status_history JSONB DEFAULT '[]'::jsonb,
    created_by VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. TRANSFERS (Inter-hospital dispatch & transport)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS transfers (
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

-- ==============================================================================
-- 9. ALERTS (Merged with notification_deliveries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS alerts (
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
    -- MERGED NOTIFICATION CHANNELS & DISPATCH STATUS
    channel VARCHAR(30) DEFAULT 'IN_APP',
    delivery_status VARCHAR(20) DEFAULT 'SENT' CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. AUDIT_LOGS (Comprehensive audit, telemetry & engine events)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(30) NOT NULL, -- SYSTEM, REQUEST, INVENTORY, TRANSFER, ENGINE, SCHEDULER
    entity_id VARCHAR(36) NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 11. SYSTEM_CONFIGURATIONS (Merged engine_config + expiry_policies + substitution_rules)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS system_configurations (
    config_key VARCHAR(60) PRIMARY KEY,
    category VARCHAR(30) NOT NULL DEFAULT 'ENGINE', -- EXPIRY_POLICY, ALGORITHM_WEIGHTS, SCHEDULER, SUBSTITUTION
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_hospital ON blood_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON blood_inventory(blood_group, component, status, expiry_tier);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON blood_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_holds_request ON inventory_holds(request_id);
CREATE INDEX IF NOT EXISTS idx_movements_inventory ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status, priority);
CREATE INDEX IF NOT EXISTS idx_requests_hospital ON blood_requests(requesting_hospital_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_alerts_unack ON alerts(is_acknowledged, severity);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
