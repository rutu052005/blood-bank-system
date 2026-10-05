import { db } from '../db/db.js';
import { ExpiryTier, BloodUnit, AlertSeverity, Alert } from '../types/index.js';
import { ClockService } from '../services/clock.service.js';
import { InventorySyncEngine } from './inventory_sync.engine.js';
import { EventQueueService } from '../services/event_queue.service.js';
import { MatchingEngine } from './matching.engine.js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

export class ExpiryEngine {
  /**
   * Determine current tier of a blood unit based on expiry policies
   */
  public static calculateTier(unit: BloodUnit): { tier: ExpiryTier; nextTransitionAt: Date } {
    const now = ClockService.now();
    const expiryDate = new Date(unit.expiry_date);
    const msRemaining = expiryDate.getTime() - now.getTime();
    const hoursRemaining = msRemaining / (1000 * 3600);
    const daysRemaining = msRemaining / (1000 * 3600 * 24);

    const policy = db.expiryPolicies.find(p => p.component === unit.component) || {
      component: unit.component,
      near_expiry_days: 7,
      critical_hours: 72,
      updated_at: now.toISOString(),
    };

    if (msRemaining <= 0) {
      return { tier: 'EXPIRED', nextTransitionAt: new Date(expiryDate.getTime() + 365 * 86400000) };
    }

    if (hoursRemaining <= policy.critical_hours) {
      return { tier: 'CRITICAL', nextTransitionAt: expiryDate };
    }

    if (daysRemaining <= policy.near_expiry_days) {
      const criticalTransition = new Date(expiryDate.getTime() - policy.critical_hours * 3600000);
      return { tier: 'NEAR_EXPIRY', nextTransitionAt: criticalTransition };
    }

    const nearExpiryTransition = new Date(expiryDate.getTime() - policy.near_expiry_days * 86400000);
    return { tier: 'VALID', nextTransitionAt: nearExpiryTransition };
  }

  /**
   * Min-Heap Tick for Expiry Engine O(log n) per transition
   */
  public static async tick(): Promise<{ processedCount: number; transitions: any[] }> {
    const now = ClockService.now();
    const transitions: any[] = [];

    for (const unit of db.inventory) {
      if (unit.status === 'EXPIRED') continue;

      const currentTier = db.expiryStates.find(s => s.inventory_id === unit.id)?.tier || 'VALID';
      const { tier: newTier, nextTransitionAt } = this.calculateTier(unit);

      // State record update
      let stateRecord = db.expiryStates.find(s => s.inventory_id === unit.id);
      if (!stateRecord) {
        stateRecord = {
          inventory_id: unit.id,
          tier: newTier,
          next_transition_at: nextTransitionAt.toISOString(),
          updated_at: now.toISOString(),
        };
        db.expiryStates.push(stateRecord);
      } else {
        stateRecord.tier = newTier;
        stateRecord.next_transition_at = nextTransitionAt.toISOString();
        stateRecord.updated_at = now.toISOString();
      }

      if (currentTier !== newTier) {
        transitions.push({ unitId: unit.id, from: currentTier, to: newTier });

        if (newTier === 'NEAR_EXPIRY') {
          EventQueueService.enqueue('EXPIRY_WARNING', 5, {
            inventoryId: unit.id,
            hospitalId: unit.hospital_id,
            bloodGroup: unit.blood_group,
            component: unit.component,
            quantity: unit.quantity_total,
            expiryDate: unit.expiry_date,
          });

          // Trigger matching engine redistribution suggestion
          MatchingEngine.createRedistributionSuggestion(unit.id);
        } else if (newTier === 'CRITICAL') {
          EventQueueService.enqueue('EXPIRY_CRITICAL', 1, {
            inventoryId: unit.id,
            hospitalId: unit.hospital_id,
            bloodGroup: unit.blood_group,
            component: unit.component,
            quantity: unit.quantity_total,
            expiryDate: unit.expiry_date,
          });
        } else if (newTier === 'EXPIRED') {
          await InventorySyncEngine.markExpired(unit.id);
        }
      }
    }

    return { processedCount: db.inventory.length, transitions };
  }

  /**
   * FEFO Surfacing Query: Returns units ordered by nearest expiry date
   */
  public static getFEFOUnits(bloodGroup?: string, component?: string): BloodUnit[] {
    const now = ClockService.now();
    return db.inventory
      .filter(u => {
        const available = u.quantity_total - u.quantity_held - u.quantity_in_transit;
        const groupMatch = !bloodGroup || u.blood_group === bloodGroup;
        const compMatch = !component || u.component === component;
        return u.status === 'AVAILABLE' && available > 0 && new Date(u.expiry_date) > now && groupMatch && compMatch;
      })
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  }

  /**
   * Alert Dispatcher: Processes queued events and manages escalation
   */
  public static async processAlertEvents(): Promise<number> {
    let processed = 0;
    let event = EventQueueService.dequeue();

    while (event) {
      processed++;
      const payload = event.payload;

      let severity: AlertSeverity = 'INFO';
      let title = '';
      let message = '';
      let entityId = payload.inventoryId || payload.requestId || payload.transferId || '';

      switch (event.type) {
        case 'EXPIRED_RESOURCE':
          severity = 'CRITICAL';
          title = `Resource Expired: ${payload.bloodGroup} ${payload.component}`;
          message = `Unit ${payload.inventoryId} (${payload.quantity} units) has expired at hospital ${payload.hospitalId}.`;
          break;
        case 'EXPIRY_CRITICAL':
          severity = 'CRITICAL';
          title = `Critical Expiry Warning: ${payload.bloodGroup} ${payload.component}`;
          message = `Unit ${payload.inventoryId} (${payload.quantity} units) enters critical expiry window at hospital ${payload.hospitalId}.`;
          break;
        case 'EXPIRY_WARNING':
          severity = 'WARNING';
          title = `Near Expiry Alert: ${payload.bloodGroup} ${payload.component}`;
          message = `Unit ${payload.inventoryId} enters near expiry window. Consider redistribution.`;
          break;
        case 'NEW_REQUEST':
          if (payload.priority === 'EMERGENCY') {
            severity = 'CRITICAL';
            title = `EMERGENCY Blood Request ${payload.requestId}`;
            message = `Hospital ${payload.hospitalId} requested ${payload.quantity} units of ${payload.bloodGroup} ${payload.component}.`;
          } else if (payload.priority === 'URGENT') {
            severity = 'WARNING';
            title = `URGENT Blood Request ${payload.requestId}`;
            message = `Hospital ${payload.hospitalId} requested ${payload.quantity} units of ${payload.bloodGroup} ${payload.component}.`;
          } else {
            severity = 'INFO';
            title = `ROUTINE Blood Request ${payload.requestId}`;
            message = `New request registered for Hospital ${payload.hospitalId}.`;
          }
          break;
        case 'PREEMPTION':
          severity = 'WARNING';
          title = `Preemption Notice: Request ${payload.victimRequestId}`;
          message = `Tentative hold on ${payload.inventoryId} preempted by EMERGENCY request ${payload.preemptingRequestId}. Boost applied.`;
          break;
        case 'UNSAFE_STATE':
          severity = 'WARNING';
          title = `Deadlock Avoidance: Request ${payload.requestId} Deferred`;
          message = `Banker safety check flagged unsafe state. Multi-resource request deferred.`;
          break;
        case 'TRANSFER_UPDATE':
          severity = 'INFO';
          title = `Transfer Status Update ${payload.transferId}`;
          message = `Transfer status changed to ${payload.status}.`;
          break;
        default:
          severity = 'INFO';
          title = `System Event: ${event.type}`;
          message = JSON.stringify(payload);
          break;
      }

      // Deduplication check: 1 alert per (type, entity_id)
      const existingAlert = db.alerts.find(a => a.type === event?.type && a.entity_id === entityId && !a.is_acknowledged);
      if (!existingAlert) {
        const newAlert: Alert = {
          id: uuidv4(),
          severity,
          type: event.type,
          entity_id: entityId,
          hospital_id: payload.hospitalId,
          title,
          message,
          is_acknowledged: false,
          escalation_level: 0,
          created_at: ClockService.nowISO(),
        };

        db.alerts.push(newAlert);

        // Simulated Delivery Logging
        db.notificationDeliveries.push({
          id: uuidv4(),
          alert_id: newAlert.id,
          channel: 'IN_APP',
          recipient: payload.hospitalId || 'SYSTEM',
          status: 'SENT',
          sent_at: ClockService.nowISO(),
        });
        db.notificationDeliveries.push({
          id: uuidv4(),
          alert_id: newAlert.id,
          channel: 'EMAIL_SIMULATED',
          recipient: `admin@hospital-${payload.hospitalId || 'all'}.local`,
          status: 'SENT',
          sent_at: ClockService.nowISO(),
        });
      }

      EventQueueService.markDone(event.id);
      event = EventQueueService.dequeue();
    }

    // Process Alert Escalations for Unacknowledged CRITICAL Alerts
    const now = ClockService.now();
    for (const alert of db.alerts) {
      if (alert.severity === 'CRITICAL' && !alert.is_acknowledged) {
        const ageMinutes = (now.getTime() - new Date(alert.created_at).getTime()) / (1000 * 60);

        if (ageMinutes >= config.escalation.criticalMinutes && alert.escalation_level < 2) {
          alert.escalation_level = 2;
          db.auditLogs.push({
            id: uuidv4(),
            action: 'ALERT_ESCALATED',
            entity_type: 'ALERT',
            entity_id: alert.id,
            details: { escalationLevel: 2, recipientRole: 'SYSTEM_ADMIN' },
            timestamp: now.toISOString(),
          });
        } else if (ageMinutes >= config.escalation.warningMinutes && alert.escalation_level < 1) {
          alert.escalation_level = 1;
          db.auditLogs.push({
            id: uuidv4(),
            action: 'ALERT_ESCALATED',
            entity_type: 'ALERT',
            entity_id: alert.id,
            details: { escalationLevel: 1, recipientRole: 'HOSPITAL_ADMIN' },
            timestamp: now.toISOString(),
          });
        }
      }
    }

    return processed;
  }
}
