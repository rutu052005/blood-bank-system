import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BloodUnit, BloodRequest, Transfer, Alert, Hospital } from '../types/index.js';
import { PriorityBadge } from '../components/PriorityBadge.js';
import { EngineWorkflowModal, EngineId } from '../components/EngineWorkflowModal.js';
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
  Activity,
  ShieldCheck,
  Network,
  Layers,
  Globe,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [inventory, setInventory] = useState<BloodUnit[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEngine, setSelectedEngine] = useState<EngineId | null>(null);

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
    return (
      <div className="p-8 text-center text-emerald-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
        <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <span>Querying Live Obsidian Grid...</span>
      </div>
    );
  }

  // Calculated Statistics
  const availableUnitsTotal = inventory
    .filter(i => i.status === 'AVAILABLE')
    .reduce((acc, i) => acc + (i.available_quantity || 0), 0);

  const pendingCount = requests.filter(r => r.status === 'PENDING' || r.status === 'MATCHED').length;
  const activeTransfersCount = transfers.filter(t => t.status === 'IN_TRANSIT').length;
  const nearExpiryCount = inventory.filter(i => i.tier === 'NEAR_EXPIRY').length;
  const criticalExpiryCount = inventory.filter(i => i.tier === 'CRITICAL').length;
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

  const COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Executive Live Dashboard
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time network statistics and live emergency resource coordination.
          </p>
        </div>
        <Link
          to="/engine-control"
          className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition self-start sm:self-auto"
        >
          <Activity className="w-4 h-4 text-black" /> Open Operations Center
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link to="/hospitals" className="bg-[#090d16] p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <Building2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Hospitals</span>
          </div>
          <div className="text-2xl font-black text-white">{hospitals.length}</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Active Nodes</div>
        </Link>

        <Link to="/inventory" className="bg-[#090d16] p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <Droplets className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Available Stock</span>
          </div>
          <div className="text-2xl font-black text-white">{availableUnitsTotal}</div>
          <div className="text-[10px] text-zinc-400 font-medium mt-1">Total Units</div>
        </Link>

        <Link to="/requests" className="bg-[#090d16] p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Pending</span>
          </div>
          <div className="text-2xl font-black text-white">{pendingCount}</div>
          <div className="text-[10px] text-teal-400 font-semibold mt-1">Awaiting Dispatch</div>
        </Link>

        <Link to="/transfers" className="bg-[#090d16] p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Transfers</span>
          </div>
          <div className="text-2xl font-black text-white">{activeTransfersCount}</div>
          <div className="text-[10px] text-cyan-400 font-semibold mt-1">In Transit</div>
        </Link>

        <Link to="/expiry" className="bg-[#090d16] p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-rose-500/40 transition group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <Clock className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Critical Expiry</span>
          </div>
          <div className="text-2xl font-black text-rose-400">{criticalExpiryCount}</div>
          <div className="text-[10px] text-zinc-400 font-medium mt-1">{nearExpiryCount} Near Expiry</div>
        </Link>

        <Link to="/alerts" className="bg-[#090d16] p-4 rounded-2xl border border-zinc-800 shadow-sm hover:border-amber-500/40 transition group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Alerts</span>
          </div>
          <div className="text-2xl font-black text-amber-400">{unackCriticalAlerts}</div>
          <div className="text-[10px] text-amber-400 font-semibold mt-1">Requires Action</div>
        </Link>
      </div>

      {/* 4 CORE OPERATIONAL ENGINES (User-Understandable Naming & Clickable Working Modals) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>CORE LOGISTICS ENGINES • CLICK ANY ENGINE TO VIEW DETAILED WORKING</span>
            </div>
            <h2 className="text-base font-black text-white tracking-tight mt-0.5">
              The 4 Core Operational Systems
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Interactive Working & Algorithmic Traces
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Engine 1: Inventory Sync Engine */}
          <div
            onClick={() => setSelectedEngine('inventory-sync')}
            className="bg-[#090d16] p-5 rounded-2xl border border-zinc-800 hover:border-emerald-500/60 transition-all duration-200 cursor-pointer shadow-md hover:shadow-emerald-500/10 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  100% ACID MUTEX
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                  1. Inventory Sync Engine
                </h3>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Single-Writer Ledger Mutex
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Deterministic row-level locking eliminates phantom stock, race conditions, and double-allocation across hospitals.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
              <span>Explore Mutex Logic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Engine 2: Priority Scheduling Engine */}
          <div
            onClick={() => setSelectedEngine('priority-scheduling')}
            className="bg-[#090d16] p-5 rounded-2xl border border-zinc-800 hover:border-teal-500/60 transition-all duration-200 cursor-pointer shadow-md hover:shadow-teal-500/10 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/60">
                  OS MLFQ TRIAGE
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-teal-300 transition-colors">
                  2. Priority Scheduling Engine
                </h3>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Banker's Deadlock Safety
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                3-lane feedback queues preempt non-urgent holds during trauma crises with +15 compensation boost to guarantee zero patient starvation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-teal-400 font-bold group-hover:translate-x-0.5 transition-transform">
              <span>Test Triage & Preemption</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Engine 3: Web Engine */}
          <div
            onClick={() => setSelectedEngine('web-engine')}
            className="bg-[#090d16] p-5 rounded-2xl border border-zinc-800 hover:border-cyan-500/60 transition-all duration-200 cursor-pointer shadow-md hover:shadow-cyan-500/10 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  REAL-TIME SSE STREAM
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                  3. Web Engine
                </h3>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Reactive Multi-Hospital Portal
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Server-Sent Events (SSE) push live hospital stock, emergency dispatches, and simulated clock updates with sub-15ms packet latency.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
              <span>View Web Stream</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Engine 4: Match and Expiry Engine */}
          <div
            onClick={() => setSelectedEngine('match-expiry')}
            className="bg-[#090d16] p-5 rounded-2xl border border-zinc-800 hover:border-green-500/60 transition-all duration-200 cursor-pointer shadow-md hover:shadow-green-500/10 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Network className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-950 text-green-300 border border-green-800/60">
                  DIJKSTRA + MIN-HEAP
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-green-300 transition-colors">
                  4. Match and Expiry Engine
                </h3>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Shortest Route & FEFO Tracker
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Dijkstra pathfinder finds fastest highway links while Binary Min-Heap surfaces earliest-expiring units to eliminate blood waste.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-green-400 font-bold group-hover:translate-x-0.5 transition-transform">
              <span>Run Dijkstra & Heap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Available Units by Blood Group */}
        <div className="bg-[#090d16] p-5 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Available Stock by Blood Group
            </h2>
            <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">FEFO Surfaced</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByGroup}>
                <XAxis dataKey="group" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #27272a', color: '#10b981', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="units" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Request Status Distribution */}
        <div className="bg-[#090d16] p-5 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              Request Lifecycle Status
            </h2>
            <span className="text-[10px] font-bold text-teal-400 uppercase font-mono bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/40">State Machine</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {chartByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000000', border: '1px solid #27272a', color: '#10b981', borderRadius: '12px', fontSize: '12px' }} />
                <Legend formatter={(value) => <span className="text-xs font-semibold text-zinc-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Recent Requests Table */}
      <div className="bg-[#090d16] p-5 rounded-2xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Recent Priority Requests
          </h2>
          <Link to="/requests" className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/60 text-zinc-400 font-mono font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="p-3">Request ID</th>
                <th className="p-3">Hospital</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Blood Group / Component</th>
                <th className="p-3">Status</th>
                <th className="p-3">Effective Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {requests.slice(0, 5).map((req) => (
                <tr key={req.id} className="hover:bg-zinc-900/50 transition">
                  <td className="p-3 font-mono font-bold text-white">
                    <Link to={`/requests/${req.id}`} className="hover:underline text-emerald-400">
                      {req.id}
                    </Link>
                  </td>
                  <td className="p-3 text-zinc-300">{req.requesting_hospital_name}</td>
                  <td className="p-3">
                    <PriorityBadge priority={req.priority} />
                  </td>
                  <td className="p-3 font-bold text-white">
                    {req.items[0]?.blood_group} {req.items[0]?.component} ({req.items[0]?.quantity} units)
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-emerald-300 border border-zinc-800">
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{req.effective_score || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Engine Workflow Modal */}
      {selectedEngine && (
        <EngineWorkflowModal
          engineId={selectedEngine}
          onClose={() => setSelectedEngine(null)}
          onSelectEngine={(id) => setSelectedEngine(id)}
          hospitals={hospitals}
          inventory={inventory}
          requests={requests}
        />
      )}
    </div>
  );
};
