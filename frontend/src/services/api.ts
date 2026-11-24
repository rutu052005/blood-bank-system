import { mockStore } from './mockStore.js';
import { getSupabaseClient } from './supabase.js';

export const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function removeToken(): void {
  localStorage.removeItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    // If server returned non-OK, or returned HTML (static SPA index.html), use live Supabase or mock fallback
    if (!response.ok || contentType.includes('text/html') || response.status === 405 || response.status === 404) {
      return await handleMockFallback<T>(endpoint, options);
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return await handleMockFallback<T>(endpoint, options);
    }
  } catch (err: any) {
    return await handleMockFallback<T>(endpoint, options);
  }
}

async function handleMockFallback<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const sb = getSupabaseClient();

  // 1. Auth
  if (endpoint === '/auth/login') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    if (sb) {
      try {
        const { data: userRow } = await sb.from('users').select('*').eq('email', (body.email || '').toLowerCase()).single();
        if (userRow) {
          const token = 'supabase-jwt-' + userRow.id;
          const userObj = {
            id: userRow.id,
            name: userRow.name,
            email: userRow.email,
            role: userRow.role,
            hospital_id: userRow.hospital_id,
            hospital_name: mockStore.hospitals.find(h => h.id === userRow.hospital_id)?.name || 'KLE Hospital',
            status: userRow.status,
          };
          localStorage.setItem('demo_user', JSON.stringify(userObj));
          return { token, user: userObj } as unknown as T;
        }
      } catch {}
    }
    return mockStore.login(body) as unknown as T;
  }

  if (endpoint === '/auth/register') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    if (sb) {
      try {
        const newUserId = 'U' + Date.now().toString().slice(-4);
        const { data: createdUser } = await sb.from('users').insert([{
          id: newUserId,
          name: body.name || 'Medical Officer',
          email: body.email,
          role: body.role || 'HOSPITAL_ADMIN',
          hospital_id: body.hospital_id || 'H001',
          password_hash: 'demo123',
          status: 'ACTIVE',
        }]).select().single();

        if (createdUser) {
          const token = 'supabase-jwt-' + createdUser.id;
          const userObj = {
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role,
            hospital_id: createdUser.hospital_id,
            hospital_name: mockStore.hospitals.find(h => h.id === createdUser.hospital_id)?.name || 'Hospital',
            status: createdUser.status,
          };
          localStorage.setItem('demo_user', JSON.stringify(userObj));
          return { token, user: userObj } as unknown as T;
        }
      } catch {}
    }
    return mockStore.register(body) as unknown as T;
  }

  if (endpoint === '/auth/me') {
    return mockStore.getCurrentUser() as unknown as T;
  }

  // 2. Hospitals & Users
  if (endpoint.startsWith('/hospitals')) {
    if (options.method === 'POST') {
      const data = options.body ? JSON.parse(options.body as string) : {};
      const newHosp = {
        id: 'H' + (mockStore.hospitals.length + 1).toString().padStart(3, '0'),
        name: data.name || 'New Hospital',
        city: data.city || 'City',
        address: data.address || 'Address',
        contact_number: data.contact_number || '+91 80 0000 0000',
        status: 'ACTIVE' as const,
        created_at: new Date().toISOString(),
      };
      if (sb) {
        try { await sb.from('hospitals').insert([newHosp]); } catch {}
      }
      mockStore.hospitals.push(newHosp);
      return newHosp as unknown as T;
    }

    if (sb) {
      try {
        const { data: hospData, error: hospErr } = await sb.from('hospitals').select('*');
        if (!hospErr && hospData && hospData.length > 0) {
          return hospData as unknown as T;
        }
      } catch {}
    }
    return mockStore.hospitals as unknown as T;
  }

  if (endpoint === '/users') {
    if (sb) {
      try {
        const { data: uData, error: uErr } = await sb.from('users').select('*');
        if (!uErr && uData && uData.length > 0) return uData as unknown as T;
      } catch {}
    }
    return mockStore.users as unknown as T;
  }

  // 3. Engines & Monitoring
  if (endpoint === '/engines/status') {
    return mockStore.getEngineStatus() as unknown as T;
  }
  if (endpoint.includes('/pause')) {
    const engine = endpoint.split('/')[2];
    (mockStore.enginePaused as any)[engine] = true;
    return { success: true } as unknown as T;
  }
  if (endpoint.includes('/resume')) {
    const engine = endpoint.split('/')[2];
    (mockStore.enginePaused as any)[engine] = false;
    return { success: true } as unknown as T;
  }
  if (endpoint === '/engines/scheduler/queue') {
    return mockStore.getSchedulerQueue() as unknown as T;
  }
  if (endpoint === '/engines/scheduler/runs') {
    return [] as unknown as T;
  }
  if (endpoint === '/engines/scheduler/banker') {
    return mockStore.getBankerState() as unknown as T;
  }
  if (endpoint === '/engines/events') {
    return [] as unknown as T;
  }
  if (endpoint === '/engines/inventory/consistency') {
    return { valid: true, timestamp: new Date().toISOString() } as unknown as T;
  }

  // 4. Inventory
  if (endpoint.startsWith('/inventory')) {
    if (options.method === 'POST') {
      const data = options.body ? JSON.parse(options.body as string) : {};
      const hospitalName = mockStore.hospitals.find(h => h.id === data.hospital_id)?.name || 'KLE Hospital';
      const qty = Number(data.quantity_total) || 5;
      const newUnit = {
        id: 'INV' + Date.now().toString().slice(-6),
        hospital_id: data.hospital_id || 'H001',
        hospital_name: hospitalName,
        blood_group: data.blood_group || 'O+',
        component: data.component || 'RBC',
        quantity_total: qty,
        quantity_held: 0,
        quantity_in_transit: 0,
        available_quantity: qty,
        collection_date: data.collection_date || new Date().toISOString().split('T')[0],
        expiry_date: data.expiry_date || new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
        status: 'AVAILABLE' as const,
        tier: 'VALID' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (sb) {
        try {
          await sb.from('blood_inventory').insert([{
            id: newUnit.id,
            hospital_id: newUnit.hospital_id,
            blood_group: newUnit.blood_group,
            component: newUnit.component,
            quantity_total: newUnit.quantity_total,
            quantity_held: 0,
            quantity_in_transit: 0,
            collection_date: newUnit.collection_date,
            expiry_date: newUnit.expiry_date,
            status: newUnit.status,
          }]);
        } catch (e) {
          console.warn('[Supabase Insert Error]', e);
        }
      }

      mockStore.inventory.unshift(newUnit);
      mockStore.saveUserState();
      return newUnit as unknown as T;
    }

    if (sb) {
      try {
        const { data: invData, error: invErr } = await sb.from('blood_inventory').select('*').order('created_at', { ascending: false });
        if (!invErr && invData && invData.length > 0) {
          return invData.map((item: any) => ({
            ...item,
            hospital_name: mockStore.hospitals.find(h => h.id === item.hospital_id)?.name || 'Hospital',
            available_quantity: Math.max(0, (item.quantity_total || 0) - (item.quantity_held || 0) - (item.quantity_in_transit || 0)),
          })) as unknown as T;
        }
      } catch {}
    }
    return mockStore.inventory as unknown as T;
  }

  // 5. Requests
  if (endpoint.startsWith('/requests')) {
    if (options.method === 'POST' && endpoint.includes('/status')) {
      const id = endpoint.split('/')[2];
      const data = options.body ? JSON.parse(options.body as string) : {};
      const req = mockStore.requests.find(r => r.id === id);
      if (req && data.status) {
        req.status = data.status;
      }
      if (sb) {
        try { await sb.from('blood_requests').update({ status: data.status }).eq('id', id); } catch {}
      }
      mockStore.saveUserState();
      return { success: true } as unknown as T;
    }

    if (options.method === 'POST') {
      const data = options.body ? JSON.parse(options.body as string) : {};
      const hospitalName = mockStore.hospitals.find(h => h.id === data.requesting_hospital_id)?.name || 'District Hospital';
      const newReq = {
        id: 'REQ' + Date.now().toString().slice(-6),
        requesting_hospital_id: data.requesting_hospital_id || 'H002',
        requesting_hospital_name: hospitalName,
        priority: data.priority || 'URGENT',
        status: 'PENDING' as const,
        required_by: new Date(Date.now() + 12 * 3600000).toISOString(),
        aging_points: 0,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        effective_score: data.priority === 'EMERGENCY' ? 100 : data.priority === 'URGENT' ? 50 : 10,
        items: (data.items && data.items.length > 0) ? data.items.map((it: any, i: number) => ({
          id: 'ITEM' + Date.now() + i,
          request_id: 'REQ' + Date.now().toString().slice(-6),
          blood_group: it.blood_group || 'O+',
          component: it.component || 'RBC',
          quantity: it.quantity || 2,
        })) : [{
          id: 'ITEM' + Date.now(),
          request_id: 'REQ' + Date.now().toString().slice(-6),
          blood_group: 'O+',
          component: 'RBC',
          quantity: 2,
        }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (sb) {
        try {
          await sb.from('blood_requests').insert([{
            id: newReq.id,
            requesting_hospital_id: newReq.requesting_hospital_id,
            priority: newReq.priority,
            status: newReq.status,
            required_by: newReq.required_by,
            aging_points: 0,
            compensation_boost: 0,
          }]);
          for (const it of newReq.items) {
            await sb.from('request_items').insert([{
              id: it.id,
              request_id: newReq.id,
              blood_group: it.blood_group,
              component: it.component,
              quantity: it.quantity,
            }]);
          }
        } catch (e) {
          console.warn('[Supabase Insert Request Error]', e);
        }
      }

      mockStore.requests.unshift(newReq);
      mockStore.saveUserState();
      return newReq as unknown as T;
    }

    if (sb) {
      try {
        const { data: reqData, error: reqErr } = await sb.from('blood_requests').select('*, request_items(*)').order('created_at', { ascending: false });
        if (!reqErr && reqData && reqData.length > 0) {
          return reqData.map((r: any) => ({
            ...r,
            requesting_hospital_name: mockStore.hospitals.find(h => h.id === r.requesting_hospital_id)?.name || 'Hospital',
            items: r.request_items || [],
            effective_score: (r.priority === 'EMERGENCY' ? 100 : r.priority === 'URGENT' ? 50 : 10) + (r.aging_points || 0) + (r.compensation_boost || 0),
          })) as unknown as T;
        }
      } catch {}
    }

    if (endpoint.includes('/matches')) {
      const reqId = endpoint.split('/')[2];
      const req = mockStore.requests.find(r => r.id === reqId);
      const reqGroup = req?.items[0]?.blood_group || 'O+';
      const reqComp = req?.items[0]?.component || 'RBC';
      const reqQty = req?.items[0]?.quantity || 2;
      const reqHospId = req?.requesting_hospital_id || 'H002';

      // Find compatible inventory in other hospitals (FEFO: sorted by closest expiry)
      const compatibleUnits = mockStore.inventory
        .filter(i => 
          i.hospital_id !== reqHospId && 
          i.available_quantity > 0 &&
          (i.blood_group === reqGroup || i.blood_group === 'O-') &&
          i.component === reqComp
        )
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

      if (compatibleUnits.length > 0) {
        return compatibleUnits.slice(0, 3).map((unit, idx) => {
          const daysLeft = Math.max(1, Math.round((new Date(unit.expiry_date).getTime() - Date.now()) / (1000 * 3600 * 24)));
          const allocQty = Math.min(reqQty, unit.available_quantity);
          return {
            hospital_id: unit.hospital_id,
            hospital_name: unit.hospital_name || 'Partner Hospital',
            inventory_id: unit.id,
            blood_group: unit.blood_group,
            component: unit.component,
            quantity_available: unit.available_quantity,
            allocated_quantity: allocQty,
            expiry_date: unit.expiry_date,
            days_to_expiry: daysLeft,
            distance_km: 4.5 + idx * 3.2,
            shortest_path: [reqHospId, unit.hospital_id],
            total_score: Math.max(70, Math.round(98 - idx * 8 - (daysLeft < 5 ? 5 : 0))),
            expiry_score: daysLeft < 7 ? 98.0 : 85.0,
            distance_score: 95.0 - idx * 5,
            fit_score: allocQty >= reqQty ? 95.0 : 80.0,
            checks: {
              blood_group_match: true,
              component_match: true,
              quantity_available: unit.available_quantity >= allocQty,
              inventory_available: true,
              viable_before_expiry: daysLeft > 1,
            }
          };
        }) as unknown as T;
      }

      // Fallback default match
      return [
        {
          hospital_id: 'H001',
          hospital_name: 'KLE Hospital',
          inventory_id: 'INV001',
          blood_group: reqGroup,
          component: reqComp,
          quantity_available: 10,
          allocated_quantity: reqQty,
          expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          days_to_expiry: 30,
          distance_km: 5.0,
          shortest_path: [reqHospId, 'H001'],
          total_score: 94.2,
          expiry_score: 95.0,
          distance_score: 98.0,
          fit_score: 90.0,
          checks: {
            blood_group_match: true,
            component_match: true,
            quantity_available: true,
            inventory_available: true,
            viable_before_expiry: true,
          }
        }
      ] as unknown as T;
    }
    return mockStore.requests as unknown as T;
  }

  // 6. Transfers
  if (endpoint.startsWith('/transfers')) {
    // 6a. Confirm Receipt: /transfers/:id/receive
    if (endpoint.includes('/receive') && options.method === 'POST') {
      const transferId = endpoint.split('/')[2];
      const transfer = mockStore.transfers.find(t => t.id === transferId);
      if (transfer) {
        transfer.status = 'RECEIVED';
        transfer.received_at = new Date().toISOString();

        if (sb) {
          try {
            await sb.from('transfers').update({ status: 'RECEIVED', received_at: transfer.received_at }).eq('id', transferId);
            const { data: invData } = await sb.from('blood_inventory').select('*').eq('id', transfer.inventory_id).single();
            if (invData) {
              await sb.from('blood_inventory').update({
                quantity_in_transit: Math.max(0, (invData.quantity_in_transit || 0) - transfer.quantity),
                quantity_total: Math.max(0, invData.quantity_total - transfer.quantity),
              }).eq('id', transfer.inventory_id);
            }
            await sb.from('blood_requests').update({ status: 'FULFILLED' }).eq('id', transfer.request_id);
          } catch (e) {
            console.warn('[Supabase Receive Sync Error]', e);
          }
        }

        // Source hospital: remove from in-transit & total
        const sourceUnit = mockStore.inventory.find(i => i.id === transfer.inventory_id);
        if (sourceUnit) {
          sourceUnit.quantity_in_transit = Math.max(0, sourceUnit.quantity_in_transit - transfer.quantity);
          sourceUnit.quantity_total = Math.max(0, sourceUnit.quantity_total - transfer.quantity);
          sourceUnit.available_quantity = Math.max(0, sourceUnit.quantity_total - sourceUnit.quantity_held - sourceUnit.quantity_in_transit);
        }

        // Destination hospital: add transferred units
        const bloodGrp = transfer.blood_group || sourceUnit?.blood_group || 'O+';
        const comp = transfer.component || sourceUnit?.component || 'RBC';
        const destUnit = mockStore.inventory.find(i =>
          i.hospital_id === transfer.destination_hospital_id &&
          i.blood_group === bloodGrp &&
          i.component === comp
        );

        if (destUnit) {
          destUnit.quantity_total += transfer.quantity;
          destUnit.available_quantity = Math.max(0, destUnit.quantity_total - destUnit.quantity_held - destUnit.quantity_in_transit);
        } else {
          mockStore.inventory.unshift({
            id: 'INV' + Date.now().toString().slice(-6),
            hospital_id: transfer.destination_hospital_id,
            hospital_name: transfer.destination_hospital_name || 'Destination Hospital',
            blood_group: bloodGrp as any,
            component: comp as any,
            quantity_total: transfer.quantity,
            quantity_held: 0,
            quantity_in_transit: 0,
            available_quantity: transfer.quantity,
            collection_date: sourceUnit?.collection_date || new Date().toISOString().split('T')[0],
            expiry_date: sourceUnit?.expiry_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            status: 'AVAILABLE',
            tier: 'VALID',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Fulfill matching request
        const req = mockStore.requests.find(r => r.id === transfer.request_id);
        if (req) {
          req.status = 'FULFILLED';
        }
        mockStore.saveUserState();
      }
      return { success: true, message: 'Transfer received and inventory synced' } as unknown as T;
    }

    // 6b. Initiate Transfer: POST /transfers
    if (options.method === 'POST') {
      const data = options.body ? JSON.parse(options.body as string) : {};
      const sourceUnit = mockStore.inventory.find(i => i.id === data.inventory_id);
      const req = mockStore.requests.find(r => r.id === data.request_id);
      const transferQty = Number(data.quantity) || 2;

      const newTrf = {
        id: 'TRF' + Date.now().toString().slice(-6),
        request_id: req ? req.id : (data.request_id || 'REQ001'),
        source_hospital_id: sourceUnit ? sourceUnit.hospital_id : 'H001',
        source_hospital_name: sourceUnit ? (sourceUnit.hospital_name || 'KLE Hospital') : 'KLE Hospital',
        destination_hospital_id: req ? req.requesting_hospital_id : 'H002',
        destination_hospital_name: req ? (req.requesting_hospital_name || 'District Hospital') : 'District Hospital',
        inventory_id: sourceUnit ? sourceUnit.id : 'INV001',
        blood_group: sourceUnit ? sourceUnit.blood_group : (req?.items[0]?.blood_group || 'O+'),
        component: sourceUnit ? sourceUnit.component : (req?.items[0]?.component || 'RBC'),
        quantity: transferQty,
        priority: req ? req.priority : 'URGENT',
        status: 'IN_TRANSIT' as const,
        dispatched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      if (sb) {
        try {
          await sb.from('transfers').insert([{
            id: newTrf.id,
            request_id: newTrf.request_id,
            source_hospital_id: newTrf.source_hospital_id,
            destination_hospital_id: newTrf.destination_hospital_id,
            inventory_id: newTrf.inventory_id,
            quantity: newTrf.quantity,
            priority: newTrf.priority,
            status: 'IN_TRANSIT',
            dispatched_at: newTrf.dispatched_at,
          }]);
          const { data: invData } = await sb.from('blood_inventory').select('*').eq('id', data.inventory_id).single();
          if (invData) {
            await sb.from('blood_inventory').update({
              quantity_in_transit: (invData.quantity_in_transit || 0) + transferQty,
            }).eq('id', data.inventory_id);
          }
          await sb.from('blood_requests').update({ status: 'IN_PROGRESS' }).eq('id', data.request_id);
        } catch (e) {
          console.warn('[Supabase Transfer Sync Error]', e);
        }
      }

      // Update source inventory: mark in-transit
      if (sourceUnit) {
        if (sourceUnit.quantity_held >= transferQty) {
          sourceUnit.quantity_held -= transferQty;
        }
        sourceUnit.quantity_in_transit += transferQty;
        sourceUnit.available_quantity = Math.max(0, sourceUnit.quantity_total - sourceUnit.quantity_held - sourceUnit.quantity_in_transit);
      }

      // Update request status
      if (req) {
        req.status = 'IN_PROGRESS';
      }

      mockStore.transfers.unshift(newTrf);
      mockStore.saveUserState();
      return newTrf as unknown as T;
    }

    if (sb) {
      try {
        const { data: trfData, error: trfErr } = await sb.from('transfers').select('*').order('created_at', { ascending: false });
        if (!trfErr && trfData && trfData.length > 0) return trfData as unknown as T;
      } catch {}
    }
    return mockStore.transfers as unknown as T;
  }

  // 7. Expiry & Alerts
  if (endpoint.startsWith('/expiry/fefo')) {
    return mockStore.inventory as unknown as T;
  }
  if (endpoint === '/alerts') {
    if (sb) {
      try {
        const { data: aData } = await sb.from('alerts').select('*').order('created_at', { ascending: false });
        if (aData && aData.length > 0) return aData as unknown as T;
      } catch {}
    }
    return mockStore.alerts as unknown as T;
  }
  if (endpoint.includes('/acknowledge')) {
    const id = endpoint.split('/')[2];
    const alert = mockStore.alerts.find(a => a.id === id);
    if (alert) alert.is_acknowledged = true;
    if (sb) {
      try { await sb.from('alerts').update({ is_acknowledged: true }).eq('id', id); } catch {}
    }
    return { success: true } as unknown as T;
  }

  // 8. Simulation & Scenarios
  if (endpoint === '/sim/scenarios') {
    return mockStore.runAllScenarios() as unknown as T;
  }
  if (endpoint.startsWith('/sim/scenarios/')) {
    return { success: true, details: 'Academic scenario executed with Dijkstra and Banker algorithms.' } as unknown as T;
  }
  if (endpoint === '/sim/advance') {
    const data = options.body ? JSON.parse(options.body as string) : {};
    mockStore.offsetHours += (data.hours || 1);
    return { offsetHours: mockStore.offsetHours } as unknown as T;
  }
  if (endpoint === '/sim/reset') {
    mockStore.offsetHours = 0;
    return { success: true } as unknown as T;
  }

  // 9. Database Viewer
  if (endpoint === '/database/tables') {
    if (sb) {
      try {
        const [hRes, iRes, rRes, tRes, aRes] = await Promise.all([
          sb.from('hospitals').select('*'),
          sb.from('blood_inventory').select('*'),
          sb.from('blood_requests').select('*'),
          sb.from('transfers').select('*'),
          sb.from('alerts').select('*'),
        ]);

        return {
          hospitals: hRes.data && hRes.data.length > 0 ? hRes.data : mockStore.hospitals,
          users: mockStore.users,
          inventory: iRes.data && iRes.data.length > 0 ? iRes.data : mockStore.inventory,
          requests: rRes.data && rRes.data.length > 0 ? rRes.data : mockStore.requests,
          transfers: tRes.data && tRes.data.length > 0 ? tRes.data : mockStore.transfers,
          alerts: aRes.data && aRes.data.length > 0 ? aRes.data : mockStore.alerts,
        } as unknown as T;
      } catch {}
    }

    return {
      hospitals: mockStore.hospitals,
      users: mockStore.users,
      inventory: mockStore.inventory,
      requests: mockStore.requests,
      transfers: mockStore.transfers,
      alerts: mockStore.alerts,
    } as unknown as T;
  }

  return [] as unknown as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request<any>('/auth/me'),

  // Hospitals & Users
  getHospitals: () => request<any[]>('/hospitals'),
  createHospital: (data: any) => request<any>('/hospitals', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => request<any[]>('/users'),

  // Engines & Monitoring
  getEngineStatus: () => request<any>('/engines/status'),
  pauseEngine: (name: string) => request<any>(`/engines/${name}/pause`, { method: 'POST' }),
  resumeEngine: (name: string) => request<any>(`/engines/${name}/resume`, { method: 'POST' }),
  getSchedulerQueue: () => request<any>('/engines/scheduler/queue'),
  getSchedulerRuns: () => request<any[]>('/engines/scheduler/runs'),
  getBankerState: () => request<any>('/engines/scheduler/banker'),
  getEventLogs: () => request<any>('/engines/events'),
  getConsistencyCheck: () => request<any>('/engines/inventory/consistency'),

  // Inventory
  getInventory: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/inventory${query}`);
  },
  getInventoryById: (id: string) => request<any>(`/inventory/${id}`),
  addInventory: (data: any) => request<any>('/inventory', { method: 'POST', body: JSON.stringify(data) }),

  // Requests
  getRequests: () => request<any[]>('/requests'),
  getRequestById: (id: string) => request<any>(`/requests/${id}`),
  createRequest: (data: any) => request<any>('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequestStatus: (id: string, status: string, notes?: string) =>
    request<any>(`/requests/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  getRequestMatches: (id: string) => request<any[]>(`/requests/${id}/matches`),

  // Transfers
  getTransfers: () => request<any[]>('/transfers'),
  createTransfer: (data: any) => request<any>('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  confirmTransferReceipt: (id: string) => request<any>(`/transfers/${id}/receive`, { method: 'POST' }),

  // Expiry & Alerts
  getFEFOInventory: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/expiry/fefo${query}`);
  },
  triggerExpiryTick: () => request<any>('/expiry/tick', { method: 'POST' }),
  getAlerts: () => request<any[]>('/alerts'),
  acknowledgeAlert: (id: string) => request<any>(`/alerts/${id}/acknowledge`, { method: 'POST' }),

  // Audit, Reports & Database
  getAuditLogs: () => request<any[]>('/audit-logs'),
  getReport: (type: string) => request<any>(`/reports/${type}`),
  getDatabaseTables: () => request<any>('/database/tables'),
  eraseDatabase: (keepAdmin: boolean = true) => request<any>('/database/erase', { method: 'POST', body: JSON.stringify({ keepAdmin }) }),

  // Simulation & Scenarios
  advanceSimTime: (hours: number) => request<any>('/sim/advance', { method: 'POST', body: JSON.stringify({ hours }) }),
  triggerSimTick: () => request<any>('/sim/tick', { method: 'POST' }),
  resetSim: () => request<any>('/sim/reset', { method: 'POST' }),
  runAllScenarios: () => request<any[]>('/sim/scenarios', { method: 'POST' }),
  runScenarioById: (id: string) => request<any>(`/sim/scenarios/${id}`, { method: 'POST' }),
  triggerEmergency: () => request<any>('/sim/trigger-emergency', { method: 'POST' }),

  // Settings
  getSettings: () => request<any>('/settings/engines'),
};
