-- ==============================================================================
-- Multi-Hospital Blood Resource Sharing System & Expiry Management
-- WIPE ALL SAMPLE / DEMO DATA (KEEP REAL HOSPITALS & USERS)
-- ==============================================================================
-- Run this in your Supabase SQL Editor (supabase.com/dashboard/project/efhytlcbxjykpfabvdgg)
-- ==============================================================================

-- 1. DISABLE ROW LEVEL SECURITY (RLS) FOR WEB ACCESS
ALTER TABLE IF EXISTS hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hospital_distances DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blood_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_holds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blood_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. WIPE SAMPLE INVENTORY, REQUESTS, TRANSFERS & ALERTS
DELETE FROM inventory_movements;
DELETE FROM inventory_holds;
DELETE FROM transfers;
DELETE FROM blood_requests;
DELETE FROM blood_inventory;
DELETE FROM alerts;
DELETE FROM audit_logs;

-- 3. CONFIRMATION OF CLEAN SLATE
SELECT 
    (SELECT COUNT(*) FROM hospitals) AS hospitals_count,
    (SELECT COUNT(*) FROM users) AS users_count,
    (SELECT COUNT(*) FROM blood_inventory) AS inventory_count,
    (SELECT COUNT(*) FROM blood_requests) AS requests_count,
    (SELECT COUNT(*) FROM transfers) AS transfers_count;
