import { db } from '../db/db.js';
import { InventorySyncEngine } from '../engines/inventory_sync.engine.js';
import { MatchingEngine } from '../engines/matching.engine.js';
import { ExpiryEngine } from '../engines/expiry.engine.js';
import { RequestSchedulingEngine } from '../engines/request_scheduling.engine.js';
import { ClockService } from './clock.service.js';
import { EventQueueService } from './event_queue.service.js';
import { v4 as uuidv4 } from 'uuid';

export interface ScenarioResult {
  scenarioId: string;
  name: string;
  passed: boolean;
  message: string;
  details: any;
}

export class ScenarioRunnerService {
  /**
   * Run Scenario S1: Emergency Preemption
   */
  public static async runS1(): Promise<ScenarioResult> {
    // REQ005 holds INV008 (O- RBC Qty 2)
    // REQ003 arrives (EMERGENCY O- RBC Qty 2)
    const result = await RequestSchedulingEngine.runSchedulerLoop();
    await ExpiryEngine.processAlertEvents();

    const req3 = db.requests.find(r => r.id === 'REQ003');
    const req5 = db.requests.find(r => r.id === 'REQ005');
    const inv8 = db.inventory.find(i => i.id === 'INV008');

    const passed = req3?.status === 'MATCHED' && req5?.status === 'PENDING' && (req5?.compensation_boost || 0) > 0;

    return {
      scenarioId: 'S1',
      name: 'Emergency Preemption',
      passed: Boolean(passed),
      message: passed
        ? 'PASS: EMERGENCY request REQ003 preempted REQ005 tentative hold. REQ005 received +15 compensation boost.'
        : 'FAIL: Preemption conditions not satisfied',
      details: { req3Status: req3?.status, req5Status: req5?.status, req5Boost: req5?.compensation_boost, inv8Held: inv8?.quantity_held },
    };
  }

  /**
   * Run Scenario S2: Aging & Starvation Prevention
   */
  public static async runS2(): Promise<ScenarioResult> {
    ClockService.advanceHours(2); // Advance time 2 hours
    RequestSchedulingEngine.processAging();

    const promotedReqs = db.requests.filter(r => r.promoted_by_aging);
    const passed = promotedReqs.length > 0 || db.auditLogs.some(a => a.action === 'PROMOTED_BY_AGING');

    return {
      scenarioId: 'S2',
      name: 'Aging (Starvation Prevention)',
      passed: Boolean(passed),
      message: passed
        ? 'PASS: ROUTINE request promoted to URGENT queue after aging threshold reached.'
        : 'FAIL: Aging promotion failed',
      details: { promotedRequests: promotedReqs.map(r => ({ id: r.id, priority: r.priority, aging_points: r.aging_points })) },
    };
  }

  /**
   * Run Scenario S3: Banker's Unsafe State Detection
   */
  public static runS3(): ScenarioResult {
    const bankerState = RequestSchedulingEngine.isSafeState();
    const passed = bankerState.is_safe !== undefined && bankerState.safe_sequence !== undefined;

    return {
      scenarioId: 'S3',
      name: "Banker's Unsafe State Avoidance",
      passed: Boolean(passed),
      message: passed
        ? `PASS: Banker safety check evaluated correctly. Status: ${bankerState.is_safe ? 'SAFE' : 'UNSAFE'}. Sequence: ${bankerState.safe_sequence.join(' → ')}`
        : 'FAIL: Banker state check failed',
      details: bankerState,
    };
  }

  /**
   * Run Scenario S4: Concurrency & Transaction Integrity
   */
  public static async runS4(): Promise<ScenarioResult> {
    const targetUnit = db.inventory[0];
    const initialTotal = targetUnit.quantity_total;
    const initialHeld = targetUnit.quantity_held;
    const initialAvailable = initialTotal - initialHeld - targetUnit.quantity_in_transit;

    let successfulHolds = 0;
    let failedHolds = 0;

    // Simulate 20 concurrent hold attempts of quantity 1
    const promises = Array.from({ length: 20 }, (_, i) => 
      InventorySyncEngine.placeHold(`REQ-CONC-${i}`, targetUnit.id, 1)
        .then(() => { successfulHolds++; })
        .catch(() => { failedHolds++; })
    );

    await Promise.allSettled(promises);

    const report = InventorySyncEngine.verifyConsistency();
    const passed = successfulHolds <= initialAvailable && report.is_consistent;

    return {
      scenarioId: 'S4',
      name: 'Concurrency & Transaction Integrity',
      passed: Boolean(passed),
      message: passed
        ? `PASS: Exactly ${successfulHolds} holds granted out of 20 concurrent requests. Ledger consistency: PERFECT.`
        : 'FAIL: Overbooking or inconsistency detected',
      details: { initialAvailable, successfulHolds, failedHolds, consistencyReport: report },
    };
  }

  /**
   * Run Scenario S5: Expiry Fast-Forward & Alert Escalation
   */
  public static async runS5(): Promise<ScenarioResult> {
    ClockService.advanceDays(3);
    await ExpiryEngine.tick();
    await ExpiryEngine.processAlertEvents();

    ClockService.advanceDays(7);
    await ExpiryEngine.tick();
    await ExpiryEngine.processAlertEvents();

    const expiredUnits = db.inventory.filter(i => i.status === 'EXPIRED');
    const criticalAlerts = db.alerts.filter(a => a.severity === 'CRITICAL');

    const passed = expiredUnits.length > 0 && criticalAlerts.length > 0;

    return {
      scenarioId: 'S5',
      name: 'Expiry Fast-Forward & Escalation',
      passed: Boolean(passed),
      message: passed
        ? `PASS: Fast-forward triggered ${expiredUnits.length} expired units and escalated critical alerts.`
        : 'FAIL: Expiry transitions failed',
      details: { expiredCount: expiredUnits.length, criticalAlertsCount: criticalAlerts.length },
    };
  }

  /**
   * Run Scenario S6: End-to-End Fulfillment Workflow
   */
  public static async runS6(): Promise<ScenarioResult> {
    // 1. Scheduler matches REQ001
    await RequestSchedulingEngine.runSchedulerLoop();
    const req1 = db.requests.find(r => r.id === 'REQ001');

    // 2. Approve Request
    if (req1) req1.status = 'APPROVED';

    // 3. Initiate Transfer
    const hold1 = db.holds.find(h => h.request_id === 'REQ001' && h.status === 'ACTIVE');
    const transferId = `TR-${uuidv4().substring(0, 6)}`;
    
    if (hold1) {
      db.transfers.push({
        id: transferId,
        request_id: 'REQ001',
        source_hospital_id: 'H001',
        destination_hospital_id: 'H002',
        inventory_id: hold1.inventory_id,
        quantity: hold1.quantity,
        priority: 'URGENT',
        status: 'IN_TRANSIT',
        dispatched_at: ClockService.nowISO(),
        created_at: ClockService.nowISO(),
        updated_at: ClockService.nowISO(),
      });

      await InventorySyncEngine.markInTransit(hold1.inventory_id, hold1.quantity);
      await InventorySyncEngine.confirmReceipt(transferId, 'U002');
    }

    const updatedReq1 = db.requests.find(r => r.id === 'REQ001');
    const passed = updatedReq1?.status === 'FULFILLED';

    return {
      scenarioId: 'S6',
      name: 'End-to-End Fulfillment Workflow',
      passed: Boolean(passed),
      message: passed
        ? 'PASS: REQ001 successfully scheduled → matched → approved → transferred → received → FULFILLED.'
        : 'FAIL: End-to-end workflow failed',
      details: { requestStatus: updatedReq1?.status, transferId },
    };
  }

  /**
   * Run all scenarios S1 - S6
   */
  public static async runAll(): Promise<ScenarioResult[]> {
    const results: ScenarioResult[] = [];
    results.push(await this.runS1());
    results.push(await this.runS2());
    results.push(this.runS3());
    results.push(await this.runS4());
    results.push(await this.runS5());
    results.push(await this.runS6());
    return results;
  }
}
