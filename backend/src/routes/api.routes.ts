import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/db.js';
import { config } from '../config/index.js';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth.middleware.js';
import { ClockService } from '../services/clock.service.js';
import { EventQueueService } from '../services/event_queue.service.js';
import { InventorySyncEngine } from '../engines/inventory_sync.engine.js';
import { MatchingEngine } from '../engines/matching.engine.js';
import { ExpiryEngine } from '../engines/expiry.engine.js';
import { RequestSchedulingEngine } from '../engines/request_scheduling.engine.js';
import { ScenarioRunnerService } from '../services/scenario_runner.service.js';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../db/supabase.js';

const router = Router();

// Store SSE Response clients
const sseClients: Response[] = [];
(global as any).sseClients = sseClients;

/**
 * Async Error Handler Wrapper
 */
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// -------------------------------------------------------------
// SSE STREAM ENDPOINT
// -------------------------------------------------------------
router.get('/stream', (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    sseClients.push(res);

    // Send initial ping & clock
    res.write(`event: clock.sync\ndata: ${JSON.stringify({ now: ClockService.nowISO(), offsetHours: ClockService.getOffsetHours() })}\n\n`);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'SSE Stream Error' });
  }
});

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.users.find(u => u.email === email && u.status === 'ACTIVE');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, hospital_id: user.hospital_id, name: user.name },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    const hospital = db.hospitals.find(h => h.id === user.hospital_id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id,
        hospital_name: hospital ? hospital.name : user.hospital_id,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login error' });
  }
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const user = db.users.find(u => u.id === req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const hospital = db.hospitals.find(h => h.id === user.hospital_id);

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospital_id: user.hospital_id,
      hospital_name: hospital ? hospital.name : user.hospital_id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Auth check error' });
  }
});

// -------------------------------------------------------------
// HOSPITALS & USERS CRUD
// -------------------------------------------------------------
router.get('/hospitals', authenticateToken, (req: Request, res: Response) => {
  try {
    res.json(db.hospitals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hospitals', authenticateToken, authorizeRoles('SYSTEM_ADMIN'), (req: Request, res: Response) => {
  try {
    const { name, city, address, contact_number } = req.body || {};
    const id = `H${String(db.hospitals.length + 1).padStart(3, '0')}`;
    const hospital = { id, name, city, address, contact_number, status: 'ACTIVE' as const, created_at: ClockService.nowISO() };
    db.hospitals.push(hospital);
    res.status(201).json(hospital);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'SYSTEM_ADMIN') {
      return res.json(db.users.map(({ password_hash, ...u }) => u));
    }
    const filtered = db.users
      .filter(u => u.hospital_id === req.user?.hospital_id)
      .map(({ password_hash, ...u }) => u);
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ENGINE CONTROL CENTER & MONITORING API
// -------------------------------------------------------------
router.get('/engines/status', authenticateToken, (req: Request, res: Response) => {
  try {
    const queueStats = EventQueueService.getStats();
    const consistencyReport = InventorySyncEngine.verifyConsistency();
    const fefoUnits = ExpiryEngine.getFEFOUnits();
    const bankerState = RequestSchedulingEngine.isSafeState();

    res.json({
      clock: {
        now: ClockService.nowISO(),
        offsetHours: ClockService.getOffsetHours(),
      },
      engines: [
        {
          id: 'inventory-sync',
          name: 'Inventory Sync Engine',
          subject: 'DBMS',
          algorithm: 'ACID Transactions & Lock Ordering',
          status: db.enginePausedStatus['inventory-sync'] ? 'PAUSED' : 'HEALTHY',
          lastTick: ClockService.nowISO(),
          queueDepth: 0,
          consistency: consistencyReport,
        },
        {
          id: 'matching',
          name: 'Matching Engine',
          subject: 'DSA',
          algorithm: 'Dijkstra Shortest Path + Min-Heap',
          status: db.enginePausedStatus['matching'] ? 'PAUSED' : 'HEALTHY',
          lastTick: ClockService.nowISO(),
          queueDepth: db.redistributionSuggestions.length,
        },
        {
          id: 'expiry',
          name: 'Expiry Engine & Alert Dispatcher',
          subject: 'DSA + OS',
          algorithm: 'Event-Driven Min-Heap & Escalation',
          status: db.enginePausedStatus['expiry'] ? 'PAUSED' : 'HEALTHY',
          lastTick: ClockService.nowISO(),
          queueDepth: queueStats.activeDepth,
          fefoCount: fefoUnits.length,
        },
        {
          id: 'scheduler',
          name: 'Request Scheduling Engine',
          subject: 'OS',
          algorithm: 'Multilevel Priority Queue, Aging & Banker Avoidance',
          status: db.enginePausedStatus['scheduler'] ? 'PAUSED' : 'HEALTHY',
          lastTick: ClockService.nowISO(),
          queueDepth: db.requests.filter(r => r.status === 'PENDING').length,
          bankerSafe: bankerState.is_safe,
        },
      ],
      eventQueue: queueStats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/engines/:name/pause', authenticateToken, authorizeRoles('SYSTEM_ADMIN'), (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    db.enginePausedStatus[name] = true;
    res.json({ message: `Engine ${name} paused`, status: db.enginePausedStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/engines/:name/resume', authenticateToken, authorizeRoles('SYSTEM_ADMIN'), (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    db.enginePausedStatus[name] = false;
    res.json({ message: `Engine ${name} resumed`, status: db.enginePausedStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/engines/scheduler/queue', authenticateToken, (req: Request, res: Response) => {
  try {
    const pending = db.requests.filter(r => r.status === 'PENDING' || r.status === 'MATCHED');

    const emergency = pending
      .filter(r => r.priority === 'EMERGENCY')
      .map(r => ({ ...r, effective_score: RequestSchedulingEngine.calculateEffectiveScore(r) }));

    const urgent = pending
      .filter(r => r.priority === 'URGENT')
      .map(r => ({ ...r, effective_score: RequestSchedulingEngine.calculateEffectiveScore(r) }));

    const routine = pending
      .filter(r => r.priority === 'ROUTINE')
      .map(r => ({ ...r, effective_score: RequestSchedulingEngine.calculateEffectiveScore(r) }));

    res.json({
      lanes: {
        EMERGENCY: emergency.sort((a, b) => (b.effective_score || 0) - (a.effective_score || 0)),
        URGENT: urgent.sort((a, b) => (b.effective_score || 0) - (a.effective_score || 0)),
        ROUTINE: routine.sort((a, b) => (b.effective_score || 0) - (a.effective_score || 0)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/engines/scheduler/runs', authenticateToken, (req: Request, res: Response) => {
  try {
    res.json(db.schedulerRuns.slice(-20).reverse());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/engines/scheduler/banker', authenticateToken, (req: Request, res: Response) => {
  try {
    const bankerState = RequestSchedulingEngine.isSafeState();
    res.json(bankerState);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/engines/events', authenticateToken, (req: Request, res: Response) => {
  try {
    res.json({
      stats: EventQueueService.getStats(),
      events: db.events.slice(-50).reverse(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/engines/inventory/consistency', authenticateToken, (req: Request, res: Response) => {
  try {
    const report = InventorySyncEngine.verifyConsistency();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// INVENTORY APIS
// -------------------------------------------------------------
router.get('/inventory', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { hospital_id, blood_group, component, status } = req.query;
    let result = [...db.inventory];

    if (hospital_id) result = result.filter(i => i.hospital_id === hospital_id);
    if (blood_group) result = result.filter(i => i.blood_group === blood_group);
    if (component) result = result.filter(i => i.component === component);
    if (status) result = result.filter(i => i.status === status);

    const enriched = result.map(unit => {
      const available = unit.quantity_total - unit.quantity_held - unit.quantity_in_transit;
      const hospital = db.hospitals.find(h => h.id === unit.hospital_id);
      const tierInfo = ExpiryEngine.calculateTier(unit);
      return {
        ...unit,
        available_quantity: available,
        hospital_name: hospital ? hospital.name : unit.hospital_id,
        tier: tierInfo.tier,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const unit = db.inventory.find(i => i.id === req.params.id);
    if (!unit) return res.status(404).json({ error: 'Inventory unit not found' });

    const hospital = db.hospitals.find(h => h.id === unit.hospital_id);
    const unitMovements = db.movements.filter(m => m.inventory_id === unit.id);
    const unitHolds = db.holds.filter(h => h.inventory_id === unit.id);
    const tierInfo = ExpiryEngine.calculateTier(unit);

    res.json({
      ...unit,
      available_quantity: unit.quantity_total - unit.quantity_held - unit.quantity_in_transit,
      hospital_name: hospital ? hospital.name : unit.hospital_id,
      tier: tierInfo.tier,
      movements: unitMovements,
      holds: unitHolds,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory', authenticateToken, authorizeRoles('SYSTEM_ADMIN', 'INVENTORY_MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const unit = await InventorySyncEngine.addInventory({
      ...req.body,
      performed_by: req.user?.id,
    });
    res.status(201).json(unit);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}));

// -------------------------------------------------------------
// REQUESTS & MATCHING APIS
// -------------------------------------------------------------
router.get('/requests', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const enriched = db.requests.map(reqItem => {
      const hospital = db.hospitals.find(h => h.id === reqItem.requesting_hospital_id);
      const effectiveScore = RequestSchedulingEngine.calculateEffectiveScore(reqItem);
      return {
        ...reqItem,
        requesting_hospital_name: hospital ? hospital.name : reqItem.requesting_hospital_id,
        effective_score: effectiveScore,
      };
    });
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests/:id', authenticateToken, (req: Request, res: Response) => {
  try {
    const reqItem = db.requests.find(r => r.id === req.params.id);
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });
    const hospital = db.hospitals.find(h => h.id === reqItem.requesting_hospital_id);

    const matches = (reqItem.items && reqItem.items.length > 0) ? MatchingEngine.findMatches({
      requesting_hospital_id: reqItem.requesting_hospital_id,
      blood_group: reqItem.items[0].blood_group,
      component: reqItem.items[0].component,
      required_quantity: reqItem.items[0].quantity,
      rankingProfile: reqItem.priority === 'EMERGENCY' ? 'FASTEST' : 'BALANCED',
    }) : [];

    res.json({
      ...reqItem,
      requesting_hospital_name: hospital ? hospital.name : reqItem.requesting_hospital_id,
      effective_score: RequestSchedulingEngine.calculateEffectiveScore(reqItem),
      matches,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests', authenticateToken, authorizeRoles('SYSTEM_ADMIN', 'REQUEST_MANAGER', 'HOSPITAL_ADMIN'), (req: AuthRequest, res: Response) => {
  try {
    const { requesting_hospital_id, priority, required_by, items } = req.body || {};
    const id = `REQ${String(db.requests.length + 1).padStart(3, '0')}`;
    const nowStr = ClockService.nowISO();

    const newRequest: any = {
      id,
      requesting_hospital_id: requesting_hospital_id || req.user?.hospital_id,
      priority: priority || 'ROUTINE',
      status: 'PENDING',
      required_by: required_by || new Date(Date.now() + 24 * 3600000).toISOString(),
      aging_points: 0,
      promoted_by_aging: false,
      preempted_count: 0,
      compensation_boost: 0,
      items: (items || []).map((it: any) => ({ ...it, id: uuidv4(), request_id: id, created_at: nowStr })),
      created_by: req.user?.id,
      created_at: nowStr,
      updated_at: nowStr,
    };

    db.requests.push(newRequest);

    EventQueueService.enqueue('NEW_REQUEST', priority === 'EMERGENCY' ? 1 : (priority === 'URGENT' ? 3 : 5), {
      requestId: id,
      hospitalId: newRequest.requesting_hospital_id,
      priority: newRequest.priority,
      bloodGroup: newRequest.items[0]?.blood_group,
      component: newRequest.items[0]?.component,
      quantity: newRequest.items[0]?.quantity,
    });

    db.auditLogs.push({
      id: uuidv4(),
      user_id: req.user?.id,
      action: 'CREATED_REQUEST',
      entity_type: 'REQUEST',
      entity_id: id,
      details: { priority: newRequest.priority, hospitalId: newRequest.requesting_hospital_id },
      timestamp: nowStr,
    });

    res.status(201).json(newRequest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests/:id/status', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body || {};
    const reqItem = db.requests.find(r => r.id === req.params.id);
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });

    const oldStatus = reqItem.status;
    reqItem.status = status;
    reqItem.updated_at = ClockService.nowISO();

    db.auditLogs.push({
      id: uuidv4(),
      user_id: req.user?.id,
      action: `REQUEST_STATUS_${status}`,
      entity_type: 'REQUEST',
      entity_id: reqItem.id,
      details: { oldStatus, newStatus: status, notes },
      timestamp: ClockService.nowISO(),
    });

    res.json(reqItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests/:id/matches', authenticateToken, (req: Request, res: Response) => {
  try {
    const reqItem = db.requests.find(r => r.id === req.params.id);
    if (!reqItem || !reqItem.items || reqItem.items.length === 0) return res.json([]);

    const profile = reqItem.priority === 'EMERGENCY' ? 'FASTEST' : 'BALANCED';
    const matches = MatchingEngine.findMatches({
      requesting_hospital_id: reqItem.requesting_hospital_id,
      blood_group: reqItem.items[0].blood_group,
      component: reqItem.items[0].component,
      required_quantity: reqItem.items[0].quantity,
      rankingProfile: profile,
    });

    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// TRANSFERS APIS
// -------------------------------------------------------------
router.get('/transfers', authenticateToken, (req: Request, res: Response) => {
  try {
    const enriched = db.transfers.map(tr => {
      const srcHospital = db.hospitals.find(h => h.id === tr.source_hospital_id);
      const destHospital = db.hospitals.find(h => h.id === tr.destination_hospital_id);
      const unit = db.inventory.find(i => i.id === tr.inventory_id);
      return {
        ...tr,
        source_hospital_name: srcHospital ? srcHospital.name : tr.source_hospital_id,
        destination_hospital_name: destHospital ? destHospital.name : tr.destination_hospital_id,
        blood_group: unit ? unit.blood_group : 'Unknown',
        component: unit ? unit.component : 'Unknown',
      };
    });
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transfers', authenticateToken, authorizeRoles('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'INVENTORY_MANAGER'), asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { request_id, inventory_id, quantity } = req.body || {};
    const reqItem = db.requests.find(r => r.id === request_id);
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });
    if (reqItem.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Transfer can only be created from an APPROVED request' });
    }

    const unit = db.inventory.find(i => i.id === inventory_id);
    if (!unit) return res.status(404).json({ error: 'Inventory unit not found' });

    const id = `TR${String(db.transfers.length + 1).padStart(3, '0')}`;
    const nowStr = ClockService.nowISO();

    const transfer = {
      id,
      request_id,
      source_hospital_id: unit.hospital_id,
      destination_hospital_id: reqItem.requesting_hospital_id,
      inventory_id,
      quantity: quantity || 1,
      priority: reqItem.priority,
      status: 'IN_TRANSIT' as const,
      dispatched_at: nowStr,
      created_at: nowStr,
      updated_at: nowStr,
    };

    db.transfers.push(transfer);
    reqItem.status = 'IN_PROGRESS';

    await InventorySyncEngine.markInTransit(inventory_id, quantity || 1);
    res.status(201).json(transfer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}));

router.post('/transfers/:id/receive', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await InventorySyncEngine.confirmReceipt(req.params.id, req.user?.id || 'U006');
    const updated = db.transfers.find(t => t.id === req.params.id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}));

// -------------------------------------------------------------
// EXPIRY & ALERTS APIS
// -------------------------------------------------------------
router.get('/expiry/fefo', authenticateToken, (req: Request, res: Response) => {
  try {
    const { blood_group, component } = req.query;
    const list = ExpiryEngine.getFEFOUnits(blood_group as string, component as string);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expiry/tick', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await ExpiryEngine.tick();
    await ExpiryEngine.processAlertEvents();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}));

router.get('/alerts', authenticateToken, (req: Request, res: Response) => {
  try {
    const sorted = [...db.alerts].sort((a, b) => {
      const sevOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/alerts/:id/acknowledge', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const alert = db.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    alert.is_acknowledged = true;
    alert.acknowledged_by = req.user?.id;
    alert.acknowledged_at = ClockService.nowISO();

    res.json(alert);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AUDIT LOGS, REPORTS & DATABASE VIEWER
// -------------------------------------------------------------
router.get('/audit-logs', authenticateToken, (req: Request, res: Response) => {
  try {
    const sorted = [...db.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(sorted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/:type', authenticateToken, (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const now = ClockService.now();

    switch (type) {
      case 'inventory-summary':
        const summary = db.hospitals.map(h => {
          const units = db.inventory.filter(i => i.hospital_id === h.id && i.status === 'AVAILABLE');
          const rbc = units.filter(i => i.component === 'RBC').reduce((acc, i) => acc + (i.quantity_total - i.quantity_held), 0);
          const plasma = units.filter(i => i.component === 'PLASMA').reduce((acc, i) => acc + (i.quantity_total - i.quantity_held), 0);
          const platelets = units.filter(i => i.component === 'PLATELETS').reduce((acc, i) => acc + (i.quantity_total - i.quantity_held), 0);
          return { hospital: h.name, rbc, plasma, platelets, total: rbc + plasma + platelets };
        });
        return res.json(summary);

      case 'expiry-forecast':
        const forecast = db.inventory
          .filter(i => i.status === 'AVAILABLE')
          .map(i => {
            const tierInfo = ExpiryEngine.calculateTier(i);
            return { id: i.id, group: i.blood_group, component: i.component, quantity: i.quantity_total, expiryDate: i.expiry_date, tier: tierInfo.tier };
          });
        return res.json(forecast);

      default:
        return res.json({ message: `Report ${type} generated`, timestamp: now.toISOString() });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/database/tables', authenticateToken, authorizeRoles('SYSTEM_ADMIN'), async (req: Request, res: Response) => {
  try {
    if (supabase) {
      try {
        const [h, u, d, inv, holds, mov, reqs, tr, al, logs] = await Promise.all([
          supabase.from('hospitals').select('*'),
          supabase.from('users').select('id, name, email, role, hospital_id, status, created_at'),
          supabase.from('hospital_distances').select('*'),
          supabase.from('blood_inventory').select('*'),
          supabase.from('inventory_holds').select('*'),
          supabase.from('inventory_movements').select('*'),
          supabase.from('blood_requests').select('*'),
          supabase.from('transfers').select('*'),
          supabase.from('alerts').select('*'),
          supabase.from('audit_logs').select('*'),
        ]);

        if (!h.error && !u.error) {
          return res.json({
            provider: 'Supabase PostgreSQL (Live Connected)',
            supabaseUrl: config.supabaseUrl,
            tables: [
              { name: 'hospitals', count: h.data?.length || 0, data: h.data || [] },
              { name: 'users', count: u.data?.length || 0, data: u.data || [] },
              { name: 'hospital_distances', count: d.data?.length || 0, data: d.data || [] },
              { name: 'blood_inventory', count: inv.data?.length || 0, data: inv.data || [] },
              { name: 'inventory_holds', count: holds.data?.length || 0, data: holds.data || [] },
              { name: 'inventory_movements', count: mov.data?.length || 0, data: mov.data || [] },
              { name: 'blood_requests', count: reqs.data?.length || 0, data: reqs.data || [] },
              { name: 'transfers', count: tr.data?.length || 0, data: tr.data || [] },
              { name: 'alerts', count: al.data?.length || 0, data: al.data || [] },
              { name: 'audit_logs', count: logs.data?.length || 0, data: logs.data || [] },
            ],
          });
        }
      } catch (sbErr) {
        console.warn('[Supabase] Warning reading live tables:', sbErr);
      }
    }

    res.json({
      provider: 'High-Performance In-Memory DB Engine',
      tables: [
        { name: 'hospitals', count: db.hospitals.length, data: db.hospitals },
        { name: 'users', count: db.users.length, data: db.users.map(({ password_hash, ...u }) => u) },
        { name: 'hospital_distances', count: db.distances.length, data: db.distances },
        { name: 'blood_inventory', count: db.inventory.length, data: db.inventory },
        { name: 'inventory_holds', count: db.holds.length, data: db.holds },
        { name: 'inventory_movements', count: db.movements.length, data: db.movements },
        { name: 'blood_requests', count: db.requests.length, data: db.requests },
        { name: 'transfers', count: db.transfers.length, data: db.transfers },
        { name: 'alerts', count: db.alerts.length, data: db.alerts },
        { name: 'audit_logs', count: db.auditLogs.length, data: db.auditLogs },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/database/erase', authenticateToken, authorizeRoles('SYSTEM_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { keepAdmin = true } = req.body || {};
    db.eraseData(keepAdmin);

    // If Supabase client is connected, also attempt to purge Supabase tables
    if (supabase) {
      try {
        await supabase.from('alerts').delete().neq('id', '0');
        await supabase.from('transfers').delete().neq('id', '0');
        await supabase.from('request_items').delete().neq('id', '0');
        await supabase.from('blood_requests').delete().neq('id', '0');
        await supabase.from('inventory_movements').delete().neq('id', '0');
        await supabase.from('inventory_holds').delete().neq('id', '0');
        await supabase.from('blood_inventory').delete().neq('id', '0');
      } catch (sbErr) {
        console.warn('[Supabase] Warning during Supabase table purge:', sbErr);
      }
    }

    res.json({
      message: 'All inventory, requests, movements, holds, and alerts have been erased successfully.',
      remainingUsers: db.users.length,
      remainingHospitals: db.hospitals.length,
      remainingInventory: db.inventory.length,
      remainingRequests: db.requests.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// SIMULATION & SCENARIOS APIS
// -------------------------------------------------------------
router.post('/sim/advance', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { hours } = req.body || {};
    const adv = ClockService.advanceHours(hours || 1);
    await ExpiryEngine.tick();
    await RequestSchedulingEngine.runSchedulerLoop();
    await ExpiryEngine.processAlertEvents();

    res.json({
      message: `Simulated time advanced by ${hours || 1} hours`,
      clock: adv,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}));

router.post('/sim/tick', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    await ExpiryEngine.tick();
    const schedResult = await RequestSchedulingEngine.runSchedulerLoop();
    await ExpiryEngine.processAlertEvents();
    res.json({ message: 'Simulation tick completed', scheduler: schedResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}));

router.post('/sim/reset', authenticateToken, (req: Request, res: Response) => {
  try {
    ClockService.reset();
    db.seed();
    res.json({ message: 'Demo data and clock reset to default state' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sim/scenarios', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const results = await ScenarioRunnerService.runAll();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}));

router.post('/sim/scenarios/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let result: any;
    switch (id) {
      case 'S1': result = await ScenarioRunnerService.runS1(); break;
      case 'S2': result = await ScenarioRunnerService.runS2(); break;
      case 'S3': result = ScenarioRunnerService.runS3(); break;
      case 'S4': result = await ScenarioRunnerService.runS4(); break;
      case 'S5': result = await ScenarioRunnerService.runS5(); break;
      case 'S6': result = await ScenarioRunnerService.runS6(); break;
      default: return res.status(404).json({ error: `Scenario ${id} not found` });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}));

router.post('/sim/trigger-emergency', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const reqId = `REQ${String(db.requests.length + 1).padStart(3, '0')}`;
    const nowStr = ClockService.nowISO();

    const emergencyReq = {
      id: reqId,
      requesting_hospital_id: 'H005',
      priority: 'EMERGENCY' as const,
      status: 'PENDING' as const,
      required_by: new Date(Date.now() + 4 * 3600000).toISOString(),
      aging_points: 0,
      promoted_by_aging: false,
      preempted_count: 0,
      compensation_boost: 0,
      items: [{ id: uuidv4(), request_id: reqId, blood_group: 'O-' as const, component: 'RBC' as const, quantity: 2, created_at: nowStr }],
      created_at: nowStr,
      updated_at: nowStr,
    };

    db.requests.push(emergencyReq);

    EventQueueService.enqueue('NEW_REQUEST', 1, {
      requestId: reqId,
      hospitalId: 'H005',
      priority: 'EMERGENCY',
      bloodGroup: 'O-',
      component: 'RBC',
      quantity: 2,
    });

    const schedResult = await RequestSchedulingEngine.runSchedulerLoop();
    await ExpiryEngine.processAlertEvents();

    res.json({ message: 'EMERGENCY request fired', request: emergencyReq, scheduler: schedResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}));

// -------------------------------------------------------------
// SETTINGS API
// -------------------------------------------------------------
router.get('/settings/engines', authenticateToken, (req: Request, res: Response) => {
  try {
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
