const API_BASE = '/api';

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
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
