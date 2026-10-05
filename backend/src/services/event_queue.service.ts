import { db } from '../db/db.js';
import { EngineEvent } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { ClockService } from './clock.service.js';
import { config } from '../config/index.js';

export class EventQueueService {
  /**
   * Enqueue an event (Producer)
   */
  public static enqueue(type: string, priorityRank: number, payload: any): { success: boolean; eventId?: string; message?: string } {
    const activeQueueDepth = db.events.filter(e => e.status === 'NEW' || e.status === 'PROCESSING').length;
    
    if (activeQueueDepth >= config.eventQueue.maxBufferDepth) {
      console.warn(`[EventQueue] BACK-PRESSURE TRIGGERED! Queue depth limit (${config.eventQueue.maxBufferDepth}) reached.`);
      return {
        success: false,
        message: `Back-pressure limit reached (${config.eventQueue.maxBufferDepth}). Event dropped or deferred.`,
      };
    }

    const event: EngineEvent = {
      id: uuidv4(),
      type,
      priority_rank: priorityRank,
      payload,
      status: 'NEW',
      attempts: 0,
      available_at: ClockService.nowISO(),
      created_at: ClockService.nowISO(),
    };

    db.events.push(event);
    return { success: true, eventId: event.id };
  }

  /**
   * Dequeue next due highest-priority event (Consumer - simulates FOR UPDATE SKIP LOCKED)
   */
  public static dequeue(): EngineEvent | null {
    const nowISO = ClockService.nowISO();
    
    // Sort by priority_rank ASC (1 = highest priority), then created_at ASC
    const candidateEvents = db.events
      .filter(e => e.status === 'NEW' && e.available_at <= nowISO)
      .sort((a, b) => {
        if (a.priority_rank !== b.priority_rank) {
          return a.priority_rank - b.priority_rank;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    if (candidateEvents.length === 0) {
      return null;
    }

    const event = candidateEvents[0];
    event.status = 'PROCESSING';
    return event;
  }

  /**
   * Mark event as DONE
   */
  public static markDone(eventId: string): void {
    const ev = db.events.find(e => e.id === eventId);
    if (ev) {
      ev.status = 'DONE';
    }
  }

  /**
   * Mark event as FAILED with exponential backoff
   */
  public static markFailed(eventId: string, errorMsg: string): void {
    const ev = db.events.find(e => e.id === eventId);
    if (!ev) return;

    ev.attempts += 1;
    if (ev.attempts >= config.eventQueue.maxRetries) {
      ev.status = 'FAILED';
      console.error(`[EventQueue] Event ${eventId} permanently FAILED after ${ev.attempts} attempts: ${errorMsg}`);
    } else {
      ev.status = 'NEW';
      // Exponential backoff: 2^attempts * 5 seconds in simulated time
      const backoffSec = Math.pow(2, ev.attempts) * 5;
      const nextTime = new Date(ClockService.now().getTime() + backoffSec * 1000);
      ev.available_at = nextTime.toISOString();
    }
  }

  /**
   * Get queue statistics
   */
  public static getStats() {
    const total = db.events.length;
    const newCount = db.events.filter(e => e.status === 'NEW').length;
    const processingCount = db.events.filter(e => e.status === 'PROCESSING').length;
    const doneCount = db.events.filter(e => e.status === 'DONE').length;
    const failedCount = db.events.filter(e => e.status === 'FAILED').length;

    return {
      total,
      new: newCount,
      processing: processingCount,
      done: doneCount,
      failed: failedCount,
      activeDepth: newCount + processingCount,
      maxBufferDepth: config.eventQueue.maxBufferDepth,
    };
  }
}
