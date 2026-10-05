import { db } from '../db/db.js';
import { BloodRequest, BankerState, RequestStatus } from '../types/index.js';
import { ClockService } from '../services/clock.service.js';
import { MatchingEngine } from './matching.engine.js';
import { InventorySyncEngine } from './inventory_sync.engine.js';
import { EventQueueService } from '../services/event_queue.service.js';
import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

export class RequestSchedulingEngine {
  private static isRunning: boolean = false;

  /**
   * Calculate effective score of a request
   */
  public static calculateEffectiveScore(request: BloodRequest): number {
    const now = ClockService.now();
    const waitMinutes = Math.max(0, (now.getTime() - new Date(request.created_at).getTime()) / 60000);
    
    // Base weight
    let baseWeight = config.scheduler.routineBaseWeight;
    if (request.priority === 'EMERGENCY') baseWeight = config.scheduler.emergencyBaseWeight;
    else if (request.priority === 'URGENT') baseWeight = config.scheduler.urgentBaseWeight;

    // Aging math
    const agingSteps = Math.floor(waitMinutes / config.scheduler.agingIntervalMinutes);
    const agingPoints = Math.min(config.scheduler.agingCapPoints, agingSteps * config.scheduler.agingStepPoints);

    // Deadline boost (+10 if required within 24 hours)
    const hoursToDeadline = (new Date(request.required_by).getTime() - now.getTime()) / 3600000;
    const deadlineBoost = (hoursToDeadline > 0 && hoursToDeadline <= 24) ? 10 : 0;

    return baseWeight + agingPoints + request.compensation_boost + deadlineBoost;
  }

  /**
   * Banker's Safe State Algorithm (Pure function)
   */
  public static isSafeState(): BankerState {
    const now = ClockService.now();
    const available: Record<string, number> = {};
    const allocation: Record<string, Record<string, number>> = {};
    const need: Record<string, Record<string, number>> = {};
    const max: Record<string, Record<string, number>> = {};

    // 1. Calculate Available Vector per (BloodGroup_Component)
    for (const unit of db.inventory) {
      if (unit.status !== 'AVAILABLE') continue;
      const key = `${unit.blood_group}_${unit.component}`;
      const availQty = unit.quantity_total - unit.quantity_held - unit.quantity_in_transit;
      available[key] = (available[key] || 0) + Math.max(0, availQty);
    }

    // 2. Build Allocation & Need matrices for active requests
    const activeRequests = db.requests.filter(r => ['PENDING', 'MATCHED', 'APPROVED'].includes(r.status));

    for (const req of activeRequests) {
      allocation[req.id] = {};
      need[req.id] = {};
      max[req.id] = {};

      for (const item of req.items) {
        const key = `${item.blood_group}_${item.component}`;
        max[req.id][key] = item.quantity;
        
        // Active holds count as allocation
        const reqHolds = db.holds.filter(h => h.request_id === req.id && h.status === 'ACTIVE');
        let allocatedQty = 0;
        for (const h of reqHolds) {
          const inv = db.inventory.find(i => i.id === h.inventory_id);
          if (inv && `${inv.blood_group}_${inv.component}` === key) {
            allocatedQty += h.quantity;
          }
        }

        allocation[req.id][key] = allocatedQty;
        need[req.id][key] = Math.max(0, item.quantity - allocatedQty);
      }
    }

    // 3. Banker's Algorithm Safety Check
    const work = { ...available };
    const finish: Record<string, boolean> = {};
    activeRequests.forEach(r => finish[r.id] = false);

    const safeSequence: string[] = [];
    let changed = true;

    while (changed) {
      changed = false;
      for (const req of activeRequests) {
        if (!finish[req.id]) {
          // Check if Need <= Work
          let canExecute = true;
          for (const key in need[req.id]) {
            const needed = need[req.id][key];
            if (needed > (work[key] || 0)) {
              canExecute = false;
              break;
            }
          }

          if (canExecute) {
            // Free allocated resources to Work
            for (const key in allocation[req.id]) {
              work[key] = (work[key] || 0) + allocation[req.id][key];
            }
            finish[req.id] = true;
            safeSequence.push(req.id);
            changed = true;
          }
        }
      }
    }

    const isSafe = activeRequests.every(r => finish[r.id]);
    const explanation = isSafe
      ? `System is in a SAFE state. Execution sequence: ${safeSequence.join(' → ') || 'None'}`
      : `UNSAFE STATE DETECTED! Potential deadlock. Sequence stalled at ${safeSequence.join(' → ') || 'Start'}`;

    return {
      available,
      max,
      allocation,
      need,
      is_safe: isSafe,
      safe_sequence: safeSequence,
      explanation,
    };
  }

  /**
   * Run Aging tick for waiting requests
   */
  public static processAging(): void {
    const now = ClockService.now();
    for (const req of db.requests) {
      if (req.status !== 'PENDING') continue;

      const waitMinutes = Math.max(0, (now.getTime() - new Date(req.created_at).getTime()) / 60000);
      const agingSteps = Math.floor(waitMinutes / config.scheduler.agingIntervalMinutes);
      req.aging_points = Math.min(config.scheduler.agingCapPoints, agingSteps * config.scheduler.agingStepPoints);

      const effectiveScore = this.calculateEffectiveScore(req);

      // Starvation prevention promotion
      if (req.priority === 'ROUTINE' && effectiveScore >= config.scheduler.urgentPromotionThreshold) {
        req.priority = 'URGENT';
        req.promoted_by_aging = true;

        db.auditLogs.push({
          id: uuidv4(),
          action: 'PROMOTED_BY_AGING',
          entity_type: 'REQUEST',
          entity_id: req.id,
          details: { oldPriority: 'ROUTINE', newPriority: 'URGENT', effectiveScore },
          timestamp: now.toISOString(),
        });
      }
    }
  }

  /**
   * Release holds that have exceeded TTL
   */
  public static async checkExpiredHolds(): Promise<number> {
    const nowISO = ClockService.nowISO();
    const expiredHolds = db.holds.filter(h => h.status === 'ACTIVE' && h.expires_at <= nowISO);

    for (const hold of expiredHolds) {
      await InventorySyncEngine.releaseHold(hold.id, 'EXPIRED');

      const req = db.requests.find(r => r.id === hold.request_id);
      if (req && req.status === 'MATCHED') {
        req.status = 'PENDING';
        req.updated_at = nowISO;
      }

      EventQueueService.enqueue('HOLD_EXPIRED', 10, {
        holdId: hold.id,
        requestId: hold.request_id,
        inventoryId: hold.inventory_id,
      });
    }

    return expiredHolds.length;
  }

  /**
   * Main Scheduler Loop Algorithm Execution
   */
  public static async runSchedulerLoop(): Promise<{ processedRequestId?: string; decision: string; details: any }> {
    if (this.isRunning) {
      return { decision: 'SKIPPED', details: { reason: 'Scheduler mutex locked' } };
    }
    if (db.enginePausedStatus['scheduler']) {
      return { decision: 'PAUSED', details: { reason: 'Scheduler paused by admin' } };
    }

    this.isRunning = true;
    const runId = uuidv4();
    const startedAt = ClockService.nowISO();

    try {
      // Step 1: Aging & Promotions
      this.processAging();

      // Step 2: Release TTL Expired holds
      await this.checkExpiredHolds();

      // Step 3: Pick highest-priority pending request
      const pendingRequests = db.requests.filter(r => r.status === 'PENDING');
      if (pendingRequests.length === 0) {
        return { decision: 'IDLE', details: { message: 'No PENDING requests' } };
      }

      // Multilevel Queue sort (EMERGENCY -> URGENT -> ROUTINE, then Effective Score DESC)
      const priorityOrder = { EMERGENCY: 0, URGENT: 1, ROUTINE: 2 };
      pendingRequests.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        const scoreA = this.calculateEffectiveScore(a);
        const scoreB = this.calculateEffectiveScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        // Round-robin tie breaker: earlier created first
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const req = pendingRequests[0];
      const profile = req.priority === 'EMERGENCY' ? 'FASTEST' : 'BALANCED';

      // Step 4: Banker Check before granting holds
      const bankerState = this.isSafeState();
      if (!bankerState.is_safe && req.items.length > 1) {
        EventQueueService.enqueue('UNSAFE_STATE', 2, { requestId: req.id, bankerState });
        db.schedulerRuns.push({
          id: runId,
          started_at: startedAt,
          completed_at: ClockService.nowISO(),
          request_id_processed: req.id,
          decision: 'UNSAFE_DEFERRED',
          details: { bankerState },
        });
        return { decision: 'UNSAFE_DEFERRED', details: { requestId: req.id } };
      }

      // Step 5: Run Matching Engine
      let allMatchesPlaced = true;
      const placedHoldIds: string[] = [];

      for (const item of req.items) {
        const matches = MatchingEngine.findMatches({
          requesting_hospital_id: req.requesting_hospital_id,
          blood_group: item.blood_group,
          component: item.component,
          required_quantity: item.quantity,
          rankingProfile: profile,
        });

        if (matches.length === 0) {
          // Attempt Preemption if EMERGENCY or URGENT
          const preemptionSuccess = await this.attemptPreemption(req, item);
          if (!preemptionSuccess) {
            allMatchesPlaced = false;
            break;
          }
        } else {
          // Place hold on best candidate (Top candidate from Matching Engine)
          const topMatch = matches[0];
          const hold = await InventorySyncEngine.placeHold(req.id, topMatch.inventory_id, topMatch.allocated_quantity);
          placedHoldIds.push(hold.id);
        }
      }

      if (allMatchesPlaced && placedHoldIds.length > 0) {
        req.status = 'MATCHED';
        req.updated_at = ClockService.nowISO();

        db.schedulerRuns.push({
          id: runId,
          started_at: startedAt,
          completed_at: ClockService.nowISO(),
          request_id_processed: req.id,
          decision: 'MATCHED_AND_HELD',
          details: { placedHoldIds, profile },
        });

        db.auditLogs.push({
          id: uuidv4(),
          action: 'MATCHED_REQUEST',
          entity_type: 'REQUEST',
          entity_id: req.id,
          details: { placedHoldIds, profile },
          timestamp: ClockService.nowISO(),
        });

        return { decision: 'MATCHED_AND_HELD', processedRequestId: req.id, details: { placedHoldIds } };
      }

      return { decision: 'NO_SUITABLE_MATCH', processedRequestId: req.id, details: {} };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Attempt Preemption of tentative holds for higher priority requests
   */
  private static async attemptPreemption(highReq: BloodRequest, item: { blood_group: any; component: any; quantity: number }): Promise<boolean> {
    if (highReq.priority === 'ROUTINE') return false; // Routine requests cannot preempt

    // Find tentative holds on MATCHED lower priority requests
    const tentativeHolds = db.holds.filter(h => h.status === 'ACTIVE');
    const victims: Array<{ hold: typeof tentativeHolds[0]; req: BloodRequest; score: number }> = [];

    for (const h of tentativeHolds) {
      const victimReq = db.requests.find(r => r.id === h.request_id);
      if (victimReq && victimReq.status === 'MATCHED') {
        // Only preempt lower priority
        const highLevel = highReq.priority === 'EMERGENCY' ? 0 : 1;
        const victimLevel = victimReq.priority === 'EMERGENCY' ? 0 : (victimReq.priority === 'URGENT' ? 1 : 2);

        if (highLevel < victimLevel) {
          const inv = db.inventory.find(i => i.id === h.inventory_id);
          if (inv && inv.blood_group === item.blood_group && inv.component === item.component) {
            victims.push({ hold: h, req: victimReq, score: this.calculateEffectiveScore(victimReq) });
          }
        }
      }
    }

    if (victims.length === 0) return false;

    // Pick victim with lowest effective score
    victims.sort((a, b) => a.score - b.score);
    const chosen = victims[0];

    // Single transaction preemption swap
    await InventorySyncEngine.releaseHold(chosen.hold.id, 'PREEMPTED');

    // Victim request compensation & re-enqueue
    chosen.req.status = 'PENDING';
    chosen.req.compensation_boost += 15; // +15 compensation boost to prevent starvation
    chosen.req.preempted_count += 1;
    chosen.req.updated_at = ClockService.nowISO();

    // Place hold for high priority request
    const newHold = await InventorySyncEngine.placeHold(highReq.id, chosen.hold.inventory_id, item.quantity);

    // Notify event queue
    EventQueueService.enqueue('PREEMPTION', 1, {
      preemptingRequestId: highReq.id,
      victimRequestId: chosen.req.id,
      inventoryId: chosen.hold.inventory_id,
      newHoldId: newHold.id,
    });

    db.auditLogs.push({
      id: uuidv4(),
      action: 'PREEMPTED_REQUEST',
      entity_type: 'REQUEST',
      entity_id: highReq.id,
      details: { victimRequestId: chosen.req.id, inventoryId: chosen.hold.inventory_id },
      timestamp: ClockService.nowISO(),
    });

    return true;
  }
}
