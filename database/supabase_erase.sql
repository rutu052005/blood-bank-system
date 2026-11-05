-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- SUPABASE / POSTGRESQL DATA & SCHEMA WIPE SCRIPT
-- ==============================================================================
-- WARNING: This script drops all tables, types, triggers, and data created
-- by the Blood Bank application in your Supabase database.
-- Run this in the Supabase SQL Editor to start with a completely clean slate.
-- ==============================================================================

-- 1. DROP ALL APPLICATION TABLES (CASCADE removes all foreign keys and triggers)
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

-- 2. DROP CUSTOM ENUMS OR DOMAINS IF ANY EXIST
DROP TYPE IF EXISTS blood_group_enum CASCADE;
DROP TYPE IF EXISTS blood_component_enum CASCADE;
DROP TYPE IF EXISTS request_priority_enum CASCADE;
DROP TYPE IF EXISTS request_status_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;
DROP TYPE IF EXISTS inventory_status_enum CASCADE;
DROP TYPE IF EXISTS transfer_status_enum CASCADE;
DROP TYPE IF EXISTS alert_severity_enum CASCADE;

-- 3. CONFIRMATION MESSAGE
SELECT 'All Blood Bank tables and data have been successfully erased from Supabase.' AS status;
