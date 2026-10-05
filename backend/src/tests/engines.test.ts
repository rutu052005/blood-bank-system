import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db.js';
import { InventorySyncEngine } from '../engines/inventory_sync.engine.js';
import { MatchingEngine } from '../engines/matching.engine.js';
import { ExpiryEngine } from '../engines/expiry.engine.js';
import { RequestSchedulingEngine } from '../engines/request_scheduling.engine.js';
import { ClockService } from '../services/clock.service.js';
import fs from 'fs';
import path from 'path';

describe('Architecture & Ownership Rules', () => {
  it('Single-Writer Rule: No other module writes directly to inventory without calling InventorySyncEngine', () => {
    const srcDir = path.resolve(__dirname, '../');
    const files = fs.readdirSync(srcDir, { recursive: true }) as string[];

    const forbiddenMutations = ['db.inventory.push', 'db.inventory.splice', 'db.holds.push'];

    files.forEach(file => {
      if (typeof file === 'string' && file.endsWith('.ts') && !file.includes('inventory_sync.engine.ts') && !file.includes('db.ts') && !file.includes('tests')) {
        const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
        forbiddenMutations.forEach(pattern => {
          if (content.includes(pattern)) {
            throw new Error(`Single-Writer Violation! File ${file} directly mutates inventory using '${pattern}'. Must call InventorySyncEngine.`);
          }
        });
      }
    });
    expect(true).toBe(true);
  });
});

describe('Engine 1: Inventory Sync Engine', () => {
  it('enforces total - held - in_transit = available invariant', async () => {
    const unit = await InventorySyncEngine.addInventory({
      hospital_id: 'H001',
      blood_group: 'O+',
      component: 'RBC',
      quantity_total: 10,
      collection_date: '2026-09-01',
      expiry_date: '2026-10-15',
    });
    expect(unit.quantity_total).toBe(10);
    expect(unit.quantity_held).toBe(0);

    const hold = await InventorySyncEngine.placeHold('REQ-TEST', unit.id, 4);
    expect(hold.quantity).toBe(4);
    expect(unit.quantity_held).toBe(4);

    await InventorySyncEngine.releaseHold(hold.id, 'CANCELLED');
    expect(unit.quantity_held).toBe(0);
  });

  it('passes ledger consistency check out of the box', () => {
    const report = InventorySyncEngine.verifyConsistency();
    expect(report.is_consistent).toBe(true);
  });
});

describe('Engine 2: Matching Engine (DSA)', () => {
  it('calculates Dijkstra shortest path correctly', () => {
    const { distanceKm, path: pathResult } = MatchingEngine.calculateShortestPath('H001', 'H003');
    expect(distanceKm).toBe(95);
    expect(pathResult).toEqual(['H001', 'H003']);
  });

  it('ranks matches with transparent scores and viability check', () => {
    const matches = MatchingEngine.findMatches({
      requesting_hospital_id: 'H002',
      blood_group: 'O+',
      component: 'RBC',
      required_quantity: 4,
      rankingProfile: 'BALANCED',
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].checks.blood_group_match).toBe(true);
    expect(matches[0].checks.component_match).toBe(true);
    expect(matches[0].total_score).toBeGreaterThan(0);
  });
});

describe('Engine 3: Expiry Engine (DSA)', () => {
  it('calculates tier transitions per component policy', () => {
    const now = ClockService.now();
    const rbcUnit: any = {
      id: 'TEST-RBC',
      component: 'RBC',
      expiry_date: new Date(now.getTime() + 2 * 24 * 3600000).toISOString(),
    };
    const tierResult = ExpiryEngine.calculateTier(rbcUnit);
    expect(tierResult.tier).toBe('CRITICAL');
  });

  it('returns FEFO sorted units', () => {
    const fefoList = ExpiryEngine.getFEFOUnits('O+', 'RBC');
    expect(fefoList.length).toBeGreaterThan(0);
    for (let i = 0; i < fefoList.length - 1; i++) {
      expect(new Date(fefoList[i].expiry_date).getTime()).toBeLessThanOrEqual(new Date(fefoList[i + 1].expiry_date).getTime());
    }
  });
});

describe('Engine 4: Request Scheduling Engine (OS)', () => {
  it("executes Banker's Safe State algorithm correctly", () => {
    const bankerState = RequestSchedulingEngine.isSafeState();
    expect(bankerState.is_safe).toBe(true);
    expect(bankerState.safe_sequence).toBeDefined();
  });

  it('promotes waiting routine request to urgent queue via aging', () => {
    const routineReq = db.requests.find(r => r.id === 'REQ002');
    if (routineReq) {
      routineReq.status = 'PENDING';
      routineReq.created_at = new Date(ClockService.now().getTime() - 60 * 60000).toISOString(); // 60 mins waiting
      RequestSchedulingEngine.processAging();
      expect(routineReq.priority).toBe('URGENT');
      expect(routineReq.promoted_by_aging).toBe(true);
    }
  });
});
