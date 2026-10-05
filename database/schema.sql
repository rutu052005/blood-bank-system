-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- Complete Database Schema (MySQL & Supabase/PostgreSQL Compatible)

CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT,
    contact_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL, -- SYSTEM_ADMIN, HOSPITAL_ADMIN, INVENTORY_MANAGER, REQUEST_MANAGER
    hospital_id VARCHAR(10) REFERENCES hospitals(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_inventory (
    id VARCHAR(20) PRIMARY KEY,
    hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    blood_group VARCHAR(5) NOT NULL, -- A+, A-, B+, B-, AB+, AB-, O+, O-
    component VARCHAR(20) NOT NULL, -- RBC, PLATELETS, PLASMA, WHOLE_BLOOD
    quantity_total INT NOT NULL DEFAULT 0,
    quantity_held INT NOT NULL DEFAULT 0,
    quantity_in_transit INT NOT NULL DEFAULT 0,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, EXPIRED, DISCARDED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_holds (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL,
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id),
    quantity INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, RELEASED, FULFILLED, PREEMPTED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(36) PRIMARY KEY,
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id),
    movement_type VARCHAR(30) NOT NULL, -- ADD, ADJUST, HOLD, RELEASE, TRANSFER_OUT, TRANSFER_IN, EXPIRED
    quantity_change INT NOT NULL,
    reference_id VARCHAR(36),
    performed_by VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_expiry_state (
    inventory_id VARCHAR(20) PRIMARY KEY REFERENCES blood_inventory(id),
    tier VARCHAR(20) NOT NULL DEFAULT 'VALID', -- VALID, NEAR_EXPIRY, CRITICAL, EXPIRED
    next_transition_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expiry_policies (
    component VARCHAR(20) PRIMARY KEY,
    near_expiry_days INT NOT NULL,
    critical_hours INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_requests (
    id VARCHAR(20) PRIMARY KEY,
    requesting_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    priority VARCHAR(15) NOT NULL, -- EMERGENCY, URGENT, ROUTINE
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, MATCHED, APPROVED, IN_PROGRESS, FULFILLED, CANCELLED, REJECTED, RETURNED_FOR_REVIEW
    required_by TIMESTAMP NOT NULL,
    aging_points INT DEFAULT 0,
    promoted_by_aging BOOLEAN DEFAULT FALSE,
    preempted_count INT DEFAULT 0,
    compensation_boost INT DEFAULT 0,
    created_by VARCHAR(10) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_items (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES blood_requests(id),
    blood_group VARCHAR(5) NOT NULL,
    component VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_requests_history (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES blood_requests(id),
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_by VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfers (
    id VARCHAR(20) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES blood_requests(id),
    source_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    destination_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id),
    quantity INT NOT NULL,
    priority VARCHAR(15) NOT NULL,
    status VARCHAR(20) DEFAULT 'INITIATED', -- INITIATED, APPROVED, IN_TRANSIT, RECEIVED, CANCELLED
    dispatched_at TIMESTAMP,
    received_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospital_distances (
    id VARCHAR(36) PRIMARY KEY,
    from_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    to_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    distance_km DECIMAL(6, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    severity VARCHAR(15) NOT NULL, -- INFO, WARNING, CRITICAL
    type VARCHAR(40) NOT NULL,
    entity_id VARCHAR(36),
    hospital_id VARCHAR(10) REFERENCES hospitals(id),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(10),
    acknowledged_at TIMESTAMP,
    escalation_level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS engine_events (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    priority_rank INT NOT NULL DEFAULT 10,
    payload JSON NOT NULL,
    status VARCHAR(20) DEFAULT 'NEW', -- NEW, PROCESSING, DONE, FAILED
    attempts INT DEFAULT 0,
    available_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS engine_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduler_runs (
    id VARCHAR(36) PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    request_id_processed VARCHAR(20),
    decision VARCHAR(50),
    details JSON
);

CREATE TABLE IF NOT EXISTS match_results (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL REFERENCES blood_requests(id),
    ranking_profile VARCHAR(20) NOT NULL,
    matches JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS redistribution_suggestions (
    id VARCHAR(36) PRIMARY KEY,
    source_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    target_hospital_id VARCHAR(10) NOT NULL REFERENCES hospitals(id),
    inventory_id VARCHAR(20) NOT NULL REFERENCES blood_inventory(id),
    blood_group VARCHAR(5) NOT NULL,
    component VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'SUGGESTED', -- SUGGESTED, ACCEPTED, DECLINED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id VARCHAR(36) PRIMARY KEY,
    alert_id VARCHAR(36) NOT NULL REFERENCES alerts(id),
    channel VARCHAR(20) NOT NULL, -- IN_APP, EMAIL_SIMULATED, SMS_SIMULATED
    recipient VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'SENT',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attribute_substitution_rules (
    id VARCHAR(36) PRIMARY KEY,
    requested_group VARCHAR(5) NOT NULL,
    substitute_group VARCHAR(5) NOT NULL,
    component VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(10),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
