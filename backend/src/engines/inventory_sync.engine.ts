import { db } from '../db/db.js';
import { BloodUnit, InventoryHold, InventoryMovement, BloodGroup, ComponentType } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { ClockService } from '../services/clock.service.js';
import { EventQueueService } from '../services/event_queue.service.js';

export interface ConsistencyReport {
  is_consistent: boolean;
  checked_units: number;
  discrepancies: Array<{
    inventory_id: string;
    recorded_total: number;
    ledger_computed_total: number;
    mismatch: number;
  }>;
}

export class InventorySyncEngine {
  /**
   * Helper to broadcast SSE event
   */
  private static broadcastChange(type: string, data: any) {
    if ((global as any).sseClients) {
      (global as any).sseClients.forEach((res: any) => {
        res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
      });
    }
  }

  /**
   * Assert inventory invariants
   */
  private static assertInvariants(unit: BloodUnit): void {
    const available = unit.quantity_total - unit.quantity_held - unit.quantity_in_transit;
    if (unit.quantity_total < 0 || unit.quantity_held < 0 || unit.quantity_in_transit < 0) {
      throw new Error(`Invariant Violation: Quantities cannot be negative for unit ${unit.id}`);
    }
    if (available < 0) {
      throw new Error(`Invariant Violation: Available quantity cannot be negative for unit ${unit.id}`);
    }
    if (unit.status === 'EXPIRED' && available > 0) {
      throw new Error(`Invariant Violation: Expired unit ${unit.id} cannot have available quantity`);
    }
  }

  /**
   * Add new inventory record
   */
  public static async addInventory(params: {
    hospital_id: string;
    blood_group: BloodGroup;
    component: ComponentType;
    quantity_total: number;
    collection_date: string;
    expiry_date: string;
    performed_by?: string;
  }): Promise<BloodUnit> {
    if (params.quantity_total <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    if (new Date(params.expiry_date) <= new Date(params.collection_date)) {
      throw new Error('Expiry date must be after collection date');
    }

    const newId = `INV${String(db.inventory.length + 1).padStart(3, '0')}`;
    const nowStr = ClockService.nowISO();

    const unit: BloodUnit = {
      id: newId,
      hospital_id: params.hospital_id,
      blood_group: params.blood_group,
      component: params.component,
      quantity_total: params.quantity_total,
      quantity_held: 0,
      quantity_in_transit: 0,
      collection_date: params.collection_date,
      expiry_date: params.expiry_date,
      status: 'AVAILABLE',
      created_at: nowStr,
      updated_at: nowStr,
    };

    this.assertInvariants(unit);

    // Single Writer Mutation inside transaction
    db.inventory.push(unit);

    // Ledger entry
    const movement: InventoryMovement = {
      id: uuidv4(),
      inventory_id: unit.id,
      movement_type: 'ADD',
      quantity_change: params.quantity_total,
      performed_by: params.performed_by || 'SYSTEM',
      notes: 'Initial inventory registration',
      created_at: nowStr,
    };
    db.movements.push(movement);

    // Audit log
    db.auditLogs.push({
      id: uuidv4(),
      user_id: params.performed_by || 'SYSTEM',
      action: 'ADDED_INVENTORY',
      entity_type: 'INVENTORY',
      entity_id: unit.id,
      details: { hospital_id: unit.hospital_id, group: unit.blood_group, component: unit.component, qty: unit.quantity_total },
      timestamp: nowStr,
    });

    this.broadcastChange('inventory.changed', { action: 'ADD', unitId: unit.id });
    return unit;
  }

  /**
   * Place hold on an inventory unit with deadlock prevention lock ordering
   */
  public static async placeHold(
    requestId: string,
    inventoryId: string,
    quantity: number,
    ttlMinutes: number = 30
  ): Promise<InventoryHold> {
    // Deadlock prevention: Lock row in ascending order
    await db.acquireRowLocks([inventoryId]);
    try {
      const unit = db.inventory.find(i => i.id === inventoryId);
      if (!unit) {
        throw new Error(`Inventory unit ${inventoryId} not found`);
      }
      if (unit.status !== 'AVAILABLE') {
        throw new Error(`Unit ${inventoryId} is not available (Status: ${unit.status})`);
      }

      const currentAvailable = unit.quantity_total - unit.quantity_held - unit.quantity_in_transit;
      if (currentAvailable < quantity) {
        throw new Error(`Insufficient available quantity for ${inventoryId}. Requested: ${quantity}, Available: ${currentAvailable}`);
      }

      const now = ClockService.now();
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60000).toISOString();
      const holdId = `HOLD-${uuidv4().substring(0, 8)}`;

      const hold: InventoryHold = {
        id: holdId,
        request_id: requestId,
        inventory_id: inventoryId,
        quantity,
        expires_at: expiresAt,
        status: 'ACTIVE',
        created_at: now.toISOString(),
      };

      // Single Writer Mutation
      unit.quantity_held += quantity;
      unit.updated_at = now.toISOString();
      this.assertInvariants(unit);

      db.holds.push(hold);

      // Ledger & Audit
      db.movements.push({
        id: uuidv4(),
        inventory_id: inventoryId,
        movement_type: 'HOLD',
        quantity_change: quantity,
        reference_id: requestId,
        notes: `Placed hold for request ${requestId}`,
        created_at: now.toISOString(),
      });

      db.auditLogs.push({
        id: uuidv4(),
        action: 'PLACED_HOLD',
        entity_type: 'HOLD',
        entity_id: holdId,
        details: { requestId, inventoryId, quantity, expiresAt },
        timestamp: now.toISOString(),
      });

      this.broadcastChange('inventory.changed', { action: 'HOLD', inventoryId, requestId });
      return hold;
    } finally {
      db.releaseRowLocks([inventoryId]);
    }
  }

  /**
   * Release an active hold
   */
  public static async releaseHold(holdId: string, reason: 'EXPIRED' | 'PREEMPTED' | 'CANCELLED' | 'FULFILLED'): Promise<void> {
    const hold = db.holds.find(h => h.id === holdId);
    if (!hold || hold.status !== 'ACTIVE') {
      return;
    }

    await db.acquireRowLocks([hold.inventory_id]);
    try {
      const unit = db.inventory.find(i => i.id === hold.inventory_id);
      if (unit) {
        unit.quantity_held = Math.max(0, unit.quantity_held - hold.quantity);
        unit.updated_at = ClockService.nowISO();
        this.assertInvariants(unit);
      }

      hold.status = reason === 'PREEMPTED' ? 'PREEMPTED' : (reason === 'FULFILLED' ? 'FULFILLED' : 'RELEASED');

      db.movements.push({
        id: uuidv4(),
        inventory_id: hold.inventory_id,
        movement_type: 'RELEASE',
        quantity_change: -hold.quantity,
        reference_id: hold.request_id,
        notes: `Released hold (${reason})`,
        created_at: ClockService.nowISO(),
      });

      db.auditLogs.push({
        id: uuidv4(),
        action: 'RELEASED_HOLD',
        entity_type: 'HOLD',
        entity_id: holdId,
        details: { requestId: hold.request_id, inventoryId: hold.inventory_id, reason },
        timestamp: ClockService.nowISO(),
      });

      this.broadcastChange('inventory.changed', { action: 'RELEASE_HOLD', holdId, reason });
    } finally {
      db.releaseRowLocks([hold.inventory_id]);
    }
  }

  /**
   * Mark units in transit when transfer starts
   */
  public static async markInTransit(inventoryId: string, quantity: number): Promise<void> {
    await db.acquireRowLocks([inventoryId]);
    try {
      const unit = db.inventory.find(i => i.id === inventoryId);
      if (!unit) throw new Error('Inventory unit not found');

      unit.quantity_held = Math.max(0, unit.quantity_held - quantity);
      unit.quantity_in_transit += quantity;
      unit.updated_at = ClockService.nowISO();
      this.assertInvariants(unit);

      this.broadcastChange('inventory.changed', { action: 'IN_TRANSIT', inventoryId, quantity });
    } finally {
      db.releaseRowLocks([inventoryId]);
    }
  }

  /**
   * Confirm receipt of transfer (Source Out, Destination In) - Single ACID transaction
   */
  public static async confirmReceipt(transferId: string, performedByUserId: string): Promise<void> {
    const transfer = db.transfers.find(t => t.id === transferId);
    if (!transfer) throw new Error('Transfer record not found');
    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error(`Transfer ${transferId} is not IN_TRANSIT (Status: ${transfer.status})`);
    }

    const sourceUnit = db.inventory.find(i => i.id === transfer.inventory_id);
    if (!sourceUnit) throw new Error('Source inventory unit not found');

    await db.acquireRowLocks([sourceUnit.id]);
    try {
      const nowStr = ClockService.nowISO();

      // 1. Source out
      sourceUnit.quantity_in_transit = Math.max(0, sourceUnit.quantity_in_transit - transfer.quantity);
      sourceUnit.quantity_total = Math.max(0, sourceUnit.quantity_total - transfer.quantity);
      sourceUnit.updated_at = nowStr;
      this.assertInvariants(sourceUnit);

      db.movements.push({
        id: uuidv4(),
        inventory_id: sourceUnit.id,
        movement_type: 'TRANSFER_OUT',
        quantity_change: -transfer.quantity,
        reference_id: transfer.id,
        performed_by: performedByUserId,
        notes: `Transfer out to hospital ${transfer.destination_hospital_id}`,
        created_at: nowStr,
      });

      // 2. Destination in (Check if existing matching unit or create new unit with ORIGINAL collection & expiry dates)
      let destUnit = db.inventory.find(i => 
        i.hospital_id === transfer.destination_hospital_id &&
        i.blood_group === sourceUnit.blood_group &&
        i.component === sourceUnit.component &&
        i.expiry_date === sourceUnit.expiry_date &&
        i.status === 'AVAILABLE'
      );

      if (destUnit) {
        destUnit.quantity_total += transfer.quantity;
        destUnit.updated_at = nowStr;
      } else {
        const newDestId = `INV${String(db.inventory.length + 1).padStart(3, '0')}`;
        destUnit = {
          id: newDestId,
          hospital_id: transfer.destination_hospital_id,
          blood_group: sourceUnit.blood_group,
          component: sourceUnit.component,
          quantity_total: transfer.quantity,
          quantity_held: 0,
          quantity_in_transit: 0,
          collection_date: sourceUnit.collection_date, // Retain original collection date!
          expiry_date: sourceUnit.expiry_date,         // Retain original expiry date!
          status: 'AVAILABLE',
          created_at: nowStr,
          updated_at: nowStr,
        };
        db.inventory.push(destUnit);
      }

      db.movements.push({
        id: uuidv4(),
        inventory_id: destUnit.id,
        movement_type: 'TRANSFER_IN',
        quantity_change: transfer.quantity,
        reference_id: transfer.id,
        performed_by: performedByUserId,
        notes: `Transfer in from hospital ${transfer.source_hospital_id}`,
        created_at: nowStr,
      });

      // 3. Update Transfer and Request Status
      transfer.status = 'RECEIVED';
      transfer.received_at = nowStr;

      const request = db.requests.find(r => r.id === transfer.request_id);
      if (request) {
        request.status = 'FULFILLED';
        request.updated_at = nowStr;

        db.auditLogs.push({
          id: uuidv4(),
          user_id: performedByUserId,
          action: 'FULFILLED_REQUEST',
          entity_type: 'REQUEST',
          entity_id: request.id,
          details: { transferId: transfer.id },
          timestamp: nowStr,
        });
      }

      db.auditLogs.push({
        id: uuidv4(),
        user_id: performedByUserId,
        action: 'CONFIRMED_RECEIPT',
        entity_type: 'TRANSFER',
        entity_id: transfer.id,
        details: { quantity: transfer.quantity, sourceUnitId: sourceUnit.id, destUnitId: destUnit.id },
        timestamp: nowStr,
      });

      this.broadcastChange('inventory.changed', { action: 'CONFIRM_RECEIPT', transferId });
    } finally {
      db.releaseRowLocks([sourceUnit.id]);
    }
  }

  /**
   * Mark inventory as expired
   */
  public static async markExpired(inventoryId: string): Promise<void> {
    await db.acquireRowLocks([inventoryId]);
    try {
      const unit = db.inventory.find(i => i.id === inventoryId);
      if (!unit || unit.status === 'EXPIRED') return;

      unit.status = 'EXPIRED';
      unit.quantity_held = 0;
      unit.updated_at = ClockService.nowISO();

      db.movements.push({
        id: uuidv4(),
        inventory_id: inventoryId,
        movement_type: 'EXPIRED',
        quantity_change: 0,
        notes: 'Digital status changed to EXPIRED',
        created_at: ClockService.nowISO(),
      });

      db.auditLogs.push({
        id: uuidv4(),
        action: 'INVENTORY_MARKED_EXPIRED',
        entity_type: 'INVENTORY',
        entity_id: inventoryId,
        details: { hospitalId: unit.hospital_id, group: unit.blood_group, component: unit.component },
        timestamp: ClockService.nowISO(),
      });

      EventQueueService.enqueue('EXPIRED_RESOURCE', 1, {
        inventoryId,
        hospitalId: unit.hospital_id,
        bloodGroup: unit.blood_group,
        component: unit.component,
        quantity: unit.quantity_total,
      });

      this.broadcastChange('inventory.changed', { action: 'EXPIRED', inventoryId });
    } finally {
      db.releaseRowLocks([inventoryId]);
    }
  }

  /**
   * Consistency Check API endpoint function
   * Recomputes totals from ledger movements
   */
  public static verifyConsistency(): ConsistencyReport {
    const discrepancies: ConsistencyReport['discrepancies'] = [];

    for (const unit of db.inventory) {
      const unitMovements = db.movements.filter(m => m.inventory_id === unit.id);
      let computedTotal = 0;

      for (const m of unitMovements) {
        if (['ADD', 'ADJUST', 'TRANSFER_IN'].includes(m.movement_type)) {
          computedTotal += m.quantity_change;
        } else if (['TRANSFER_OUT'].includes(m.movement_type)) {
          computedTotal += m.quantity_change; // m.quantity_change is negative for TRANSFER_OUT
        }
      }

      if (unit.quantity_total !== computedTotal && unit.status !== 'EXPIRED') {
        discrepancies.push({
          inventory_id: unit.id,
          recorded_total: unit.quantity_total,
          ledger_computed_total: computedTotal,
          mismatch: unit.quantity_total - computedTotal,
        });
      }
    }

    return {
      is_consistent: discrepancies.length === 0,
      checked_units: db.inventory.length,
      discrepancies,
    };
  }
}
