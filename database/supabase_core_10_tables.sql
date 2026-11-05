-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- CORE 10-TABLE SCHEMA (FOCUSED OPERATIONAL CORE)
-- ==============================================================================
-- Designed for: Supabase PostgreSQL
-- Contains exactly the first 10 foundational tables:
--   1. hospitals
--   2. users
--   3. blood_inventory
--   4. inventory_holds
--   5. inventory_movements
--   6. inventory_expiry_state
--   7. expiry_policies
--   8. blood_requests
--   9. request_items
--  10. blood_requests_history (or transfers)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HOSPITALS (Healthcare network nodes)
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
-- 2. USERS (Staff credentials & role-based permissions)
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
-- 3. BLOOD_INVENTORY (Physical stock units with single-writer invariant)
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_quantities_valid CHECK (quantity_held + quantity_in_transit <= quantity_total)
);

-- ==============================================================================
-- 4. INVENTORY_HOLDS (Tentative two-phase reservations with expiration TTL)
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
-- 5. INVENTORY_MOVEMENTS (Immutable double-entry stock audit ledger)
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
-- 6. INVENTORY_EXPIRY_STATE (Dynamic shelf-life aging tiers for FEFO priority)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inventory_expiry_state (
    inventory_id VARCHAR(20) PRIMARY KEY REFERENCES blood_inventory(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'VALID' CHECK (tier IN ('VALID', 'NEAR_EXPIRY', 'CRITICAL', 'EXPIRED')),
    next_transition_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. EXPIRY_POLICIES (Component shelf-life policy parameters)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS expiry_policies (
    component VARCHAR(20) PRIMARY KEY CHECK (component IN ('RBC', 'PLATELETS', 'PLASMA', 'WHOLE_BLOOD')),
    near_expiry_days INT NOT NULL CHECK (near_expiry_days > 0),
    critical_hours INT NOT NULL CHECK (critical_hours > 0),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. BLOOD_REQUESTS (Clinical demand orders with MLFQ priority & aging points)
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
    created_by VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. REQUEST_ITEMS (Line items specifying requested blood group & quantity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS request_items (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    component VARCHAR(20) NOT NULL CHECK (component IN ('RBC', 'PLATELETS', 'PLASMA', 'WHOLE_BLOOD')),
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. BLOOD_REQUESTS_HISTORY (State machine audit log for order lifecycle)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blood_requests_history (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    from_status VARCHAR(25),
    to_status VARCHAR(25) NOT NULL,
    changed_by VARCHAR(10) REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_inventory_hospital ON blood_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON blood_inventory(blood_group, component, status);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON blood_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_holds_inventory ON inventory_holds(inventory_id);
CREATE INDEX IF NOT EXISTS idx_holds_request ON inventory_holds(request_id);
CREATE INDEX IF NOT EXISTS idx_movements_inventory ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status, priority);
CREATE INDEX IF NOT EXISTS idx_requests_hospital ON blood_requests(requesting_hospital_id);
