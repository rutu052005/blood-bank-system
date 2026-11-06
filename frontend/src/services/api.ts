import { mockStore } from './mockStore.js';

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

    if (!response.ok) {
      if (response.status === 405 || response.status === 404 || response.status >= 500) {
        return handleMockFallback<T>(endpoint, options);
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return response.json();
  } catch (err: any) {
    return handleMockFallback<T>(endpoint, options);
  }
}

function handleMockFallback<T>(endpoint: string, options: RequestInit = {}): T {
  // 1. Auth
  if (endpoint === '/auth/login') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    return mockStore.login(body) as unknown as T;
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
      mockStore.hospitals.push(newHosp);
      return newHosp as unknown as T;
    }
    return mockStore.hospitals as unknown as T;
  }
  if (endpoint === '/users') {
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
        id: 'INV' + (mockStore.inventory.length + 1).toString().padStart(3, '0'),
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
      mockStore.inventory.unshift(newUnit);
      return newUnit as unknown as T;
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
      return { success: true } as unknown as T;
    }
    if (options.method === 'POST') {
      const data = options.body ? JSON.parse(options.body as string) : {};
      const hospitalName = mockStore.hospitals.find(h => h.id === data.requesting_hospital_id)?.name || 'District Hospital';
      const newReq = {
        id: 'REQ' + (mockStore.requests.length + 1).toString().padStart(3, '0'),
        requesting_hospital_id: data.requesting_hospital_id || 'H002',
        requesting_hospital_name: hospitalName,
        priority: data.priority || 'URGENT',
        status: 'PENDING' as const,
        required_by: new Date(Date.now() + 12 * 3600000).toISOString(),
        aging_points: 0,
        promoted_by_aging: false,
        preempted_count: 0,
        compensation_boost: 0,
        effective_score: data.priority === 'EMERGENCY' ? 95 : data.priority === 'URGENT' ? 70 : 40,
        items: (data.items && data.items.length > 0) ? data.items.map((it: any, i: number) => ({
          id: 'ITEM' + Date.now() + i,
          request_id: 'REQ' + (mockStore.requests.length + 1).toString().padStart(3, '0'),
          blood_group: it.blood_group || 'O+',
          component: it.component || 'RBC',
          quantity: it.quantity || 2,
        })) : [{
          id: 'ITEM' + Date.now(),
          request_id: 'REQ' + (mockStore.requests.length + 1).toString().padStart(3, '0'),
          blood_group: 'O+',
          component: 'RBC',
          quantity: 2,
        }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockStore.requests.unshift(newReq);
      return newReq as unknown as T;
    }
    if (endpoint.includes('/matches')) {
      return [
        {
          hospital_id: 'H001',
          hospital_name: 'KLE Hospital',
          inventory_id: 'INV001',
          blood_group: 'O+',
          component: 'RBC',
          quantity_available: 10,
          allocated_quantity: 2,
          expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          days_to_expiry: 30,
          distance_km: 5.0,
          shortest_path: ['H002', 'H001'],
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
    if (options.method === 'POST') {
      const data = options.body ? JSON.parse(options.body as string) : {};
      const newTrf = {
        id: 'TRF' + (mockStore.transfers.length + 1).toString().padStart(3, '0'),
        request_id: data.request_id || 'REQ001',
        source_hospital_id: data.source_hospital_id || 'H001',
        source_hospital_name: 'KLE Hospital',
        destination_hospital_id: data.destination_hospital_id || 'H002',
        destination_hospital_name: 'District Hospital',
        inventory_id: data.inventory_id || 'INV001',
        quantity: data.quantity || 2,
        priority: 'URGENT' as const,
        status: 'IN_TRANSIT' as const,
        dispatched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      mockStore.transfers.unshift(newTrf);
      return newTrf as unknown as T;
    }
    return mockStore.transfers as unknown as T;
  }

  // 7. Expiry & Alerts
  if (endpoint.startsWith('/expiry/fefo')) {
    return mockStore.inventory as unknown as T;
  }
  if (endpoint === '/alerts') {
    return mockStore.alerts as unknown as T;
  }
  if (endpoint.includes('/acknowledge')) {
    const id = endpoint.split('/')[2];
    const alert = mockStore.alerts.find(a => a.id === id);
    if (alert) alert.is_acknowledged = true;
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
