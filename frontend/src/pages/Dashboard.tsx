import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BloodUnit, BloodRequest, Transfer, Alert, Hospital } from '../types/index.js';
import { PriorityBadge } from '../components/PriorityBadge.js';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Building2,
  Droplets,
  FileSpreadsheet,
  ArrowLeftRight,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
  Activity,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [inventory, setInventory] = useState<BloodUnit[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, iRes, rRes, tRes, aRes] = await Promise.all([
          api.getHospitals().catch(() => []),
          api.getInventory().catch(() => []),
          api.getRequests().catch(() => []),
          api.getTransfers().catch(() => []),
          api.getAlerts().catch(() => []),
        ]);
        if (Array.isArray(hRes)) setHospitals(hRes);
        if (Array.isArray(iRes)) setInventory(iRes);
        if (Array.isArray(rRes)) setRequests(rRes);
        if (Array.isArray(tRes)) setTransfers(tRes);
        if (Array.isArray(aRes)) setAlerts(aRes);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading SQL Live Dashboard...</div>;
  }

  // Calculated SQL Statistics
  const availableUnitsTotal = inventory
    .filter(i => i.status === 'AVAILABLE')
    .reduce((acc, i) => acc + (i.available_quantity || 0), 0);

  const pendingCount = requests.filter(r => r.status === 'PENDING' || r.status === 'MATCHED').length;
  const activeTransfersCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;
  const nearExpiryCount = inventory.filter(i => i.tier === 'NEAR_EXPIRY').length;
  const criticalExpiryCount = inventory.filter(i => i.tier === 'CRITICAL').length;
  const expiredCount = inventory.filter(i => i.status === 'EXPIRED' || i.tier === 'EXPIRED').length;
  const unackCriticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && !a.is_acknowledged).length;

  // Chart Data Preparation
  const groupDataMap: Record<string, number> = {};
  inventory.forEach(i => {
    if (i.status === 'AVAILABLE') {
      groupDataMap[i.blood_group] = (groupDataMap[i.blood_group] || 0) + (i.available_quantity || 0);
    }
  });

  const chartByGroup = Object.entries(groupDataMap).map(([group, count]) => ({
    group,
    units: count,
  }));

  const statusMap: Record<string, number> = {};
  requests.forEach(r => {
    statusMap[r.status] = (statusMap[r.status] || 0) + 1;
  });

  const chartByStatus = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Executive Live Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time statistics queried from backend database engines and priority queues.
          </p>
        </div>
        <Link
          to="/engine-control"
          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md transition self-start sm:self-auto"
        >
          <Activity className="w-4 h-4 text-crimson-400" /> Open Engine Control Center
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link to="/hospitals" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Hospitals</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{hospitals.length}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Active Nodes</div>
        </Link>

        <Link to="/inventory" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Droplets className="w-5 h-5 text-crimson-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Available Units</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{availableUnitsTotal}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Network Stock</div>
        </Link>

        <Link to="/requests" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Requests</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
          <div className="text-[10px] text-amber-600 font-semibold mt-1">In OS Queues</div>
        </Link>

        <Link to="/transfers" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Transfers</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{activeTransfersCount}</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">In Transit</div>
        </Link>

        <Link to="/expiry" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-5 h-5 text-rose-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Expiry</span>
          </div>
          <div className="text-2xl font-black text-rose-600">{criticalExpiryCount}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">{nearExpiryCount} Near Expiry</div>
        </Link>

        <Link to="/alerts" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Alerts</span>
          </div>
          <div className="text-2xl font-black text-rose-600">{unackCriticalAlerts}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">Requires Action</div>
        </Link>
      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Available Units by Blood Group */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Available Stock by Blood Group</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">FEFO Surfaced</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByGroup}>
                <XAxis dataKey="group" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="units" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Request Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Request Lifecycle Status</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">State Machine</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {chartByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                <Legend formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Recent Requests Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Recent Priority Requests</h2>
          <Link to="/requests" className="text-xs text-crimson-600 font-bold hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Hospital</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Blood Group / Component</th>
                <th className="p-3">Status</th>
                <th className="p-3">Effective Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {requests.slice(0, 5).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">
                    <Link to={`/requests/${req.id}`} className="hover:underline text-crimson-600">
                      {req.id}
                    </Link>
                  </td>
                  <td className="p-3">{req.requesting_hospital_name}</td>
                  <td className="p-3">
                    <PriorityBadge priority={req.priority} />
                  </td>
                  <td className="p-3 font-bold">
                    {req.items[0]?.blood_group} {req.items[0]?.component} ({req.items[0]?.quantity} units)
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{req.effective_score || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
