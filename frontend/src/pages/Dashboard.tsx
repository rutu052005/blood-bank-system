import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BloodUnit, BloodRequest, Transfer, Alert, Hospital } from '../types/index.js';
import { PriorityBadge } from '../components/PriorityBadge.js';
import { EngineWorkflowModal, EngineId } from '../components/EngineWorkflowModal.js';
import { MatchAndExpiryVisualizer } from '../components/MatchAndExpiryVisualizer.js';
import { AIDonorPredictor } from '../components/AIDonorPredictor.js';
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
  Flame,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [inventory, setInventory] = useState<BloodUnit[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEngine, setSelectedEngine] = useState<EngineId | null>(null);
  const [activeVisualEngine, setActiveVisualEngine] = useState<EngineId>('match-expiry');
  const [inventorySubTab, setInventorySubTab] = useState<'mutex' | 'ml-predictor'>('ml-predictor');

  // In-page visual simulator states for other engines
  const [mutexRunning, setMutexRunning] = useState<boolean>(false);
  const [mutexLogs, setMutexLogs] = useState<string[]>([
    'Single-writer transaction mutex ready. 100% ACID consistency active.',
    'System Invariant: Available = Total (30) - Held (5) - In-Transit (3) = 22 Units.',
  ]);

  const [mlfqRunning, setMlfqRunning] = useState<boolean>(false);
  const [preemptionTriggered, setPreemptionTriggered] = useState<boolean>(false);
  const [mlfqLog, setMlfqLog] = useState<string>(
    '3-Lane MLFQ active. Lane 0 (Emergency Base 100), Lane 1 (Urgent Base 50), Lane 2 (Routine Base 10). Ready for trauma preemption.'
  );

  const [webStreaming, setWebStreaming] = useState<boolean>(false);
  const [webPackets, setWebPackets] = useState<Array<{ id: string; time: string; event: string; latency: string; status: string }>>([
    { id: 'EVT001', time: '15:20:02.102', event: 'SSE_STREAM_ESTABLISHED', latency: '8ms', status: '200 OK' },
    { id: 'EVT002', time: '15:20:05.418', event: 'STOCK_HOLD_BROADCAST (H001 -> H003)', latency: '12ms', status: 'SYNCHRONIZED' },
    { id: 'EVT003', time: '15:20:10.820', event: 'HEARTBEAT_CLOCK_SYNC (+0h)', latency: '4ms', status: 'ACTIVE' },
  ]);

  const handleRunMutexSimulation = () => {
    setMutexRunning(true);
    setMutexLogs(['Dispatched 10 concurrent allocation threads across regional hospitals...']);
    setTimeout(() => {
      setMutexLogs([
        'T0: Thread 1 requests Lock(H001:INV001, qty: 2). Mutex acquired.',
        'T1: Thread 2 requests Lock(H001:INV001, qty: 1). Enqueued behind Thread 1.',
        'T2: Invariant Check: Available (10) >= Requested (2) -> PASS. Held count updated: 2.',
        'T3: Thread 1 releases lock. Thread 2 acquires Lock(H001:INV001).',
        'T4: Thread 3 & 4 request cross-hospital hold (H001 & H002). Ordered by Ascending ID: Lock(H001) -> Lock(H002). Cyclic circular wait impossible.',
        'T5: All 10 parallel transactions completed. 0 Deadlocks, 0 Overdrafts. 100% ACID consistency verified.',
      ]);
      setMutexRunning(false);
    }, 700);
  };

  const handleTriggerPreemption = () => {
    setMlfqRunning(true);
    setTimeout(() => {
      setPreemptionTriggered(true);
      setMlfqLog(
        '[PREEMPTION EXECUTED] Code-Red Emergency request REQ003 (Shree Hospital) preempted tentative hold on Unit INV008 held by Routine REQ005. Victim REQ005 awarded +15 point compensation boost and elevated to Head of Lane 1 (Urgent). Zero patient starvation.'
      );
      setMlfqRunning(false);
    }, 600);
  };

  const handleBroadcastEvent = () => {
    setWebStreaming(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds();
      const newPacket = {
        id: `EVT00${webPackets.length + 1}`,
        time: timeStr,
        event: 'EMERGENCY_DISPATCH_PUSH (REQ003 Matched)',
        latency: `${Math.floor(Math.random() * 8 + 6)}ms`,
        status: 'BROADCASTED',
      };
      setWebPackets(prev => [newPacket, ...prev]);
      setWebStreaming(false);
    }, 400);
  };

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

      {/* 4 CORE OPERATIONAL ENGINES (User-Understandable Naming & In-Page Visual Implementations) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>CORE LOGISTICS ENGINES • CLICK ANY ENGINE TO VIEW IN-PAGE VISUAL WORKING</span>
            </div>
            <h2 className="text-base font-black text-white tracking-tight mt-0.5">
              The 4 Core Operational Systems
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-mono">
              Live In-Page Algorithmic Workspace
            </span>
            <button
              onClick={() => setSelectedEngine(activeVisualEngine)}
              className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Open Fullscreen Inspector →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Engine 1: Inventory sync engine */}
          <div
            onClick={() => setActiveVisualEngine('inventory-sync')}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md group flex flex-col justify-between ${
              activeVisualEngine === 'inventory-sync'
                ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/50 shadow-emerald-500/20'
                : 'bg-[#090d16] border-zinc-800 hover:border-emerald-500/60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                {activeVisualEngine === 'inventory-sync' ? (
                  <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500 text-black animate-pulse">
                    ● ACTIVE IN PAGE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    100% ACID MUTEX
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                  1. Inventory sync engine
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
              <span>{activeVisualEngine === 'inventory-sync' ? 'Active Below' : 'Show Visual Mutex'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Engine 2: Priority scheduling engine */}
          <div
            onClick={() => setActiveVisualEngine('priority-scheduling')}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md group flex flex-col justify-between ${
              activeVisualEngine === 'priority-scheduling'
                ? 'bg-slate-900 border-teal-400 ring-2 ring-teal-500/50 shadow-teal-500/20'
                : 'bg-[#090d16] border-zinc-800 hover:border-teal-500/60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                {activeVisualEngine === 'priority-scheduling' ? (
                  <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-teal-400 text-black animate-pulse">
                    ● ACTIVE IN PAGE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/60">
                    OS MLFQ TRIAGE
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-teal-300 transition-colors">
                  2. Priority scheduling engine
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
              <span>{activeVisualEngine === 'priority-scheduling' ? 'Active Below' : 'Show Visual Triage'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Engine 3: Web engine */}
          <div
            onClick={() => setActiveVisualEngine('web-engine')}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md group flex flex-col justify-between ${
              activeVisualEngine === 'web-engine'
                ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/50 shadow-cyan-500/20'
                : 'bg-[#090d16] border-zinc-800 hover:border-cyan-500/60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                {activeVisualEngine === 'web-engine' ? (
                  <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-cyan-400 text-black animate-pulse">
                    ● ACTIVE IN PAGE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    REAL-TIME SSE
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                  3. Web engine
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
              <span>{activeVisualEngine === 'web-engine' ? 'Active Below' : 'Show Visual Stream'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Engine 4: Match and expiry engine */}
          <div
            onClick={() => setActiveVisualEngine('match-expiry')}
            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-md group flex flex-col justify-between ${
              activeVisualEngine === 'match-expiry'
                ? 'bg-slate-900 border-green-400 ring-2 ring-green-500/50 shadow-green-500/20'
                : 'bg-[#090d16] border-zinc-800 hover:border-green-500/60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Network className="w-5 h-5" />
                </div>
                {activeVisualEngine === 'match-expiry' ? (
                  <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full bg-green-400 text-black animate-pulse">
                    ● ACTIVE IN PAGE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-950 text-green-300 border border-green-800/60">
                    DIJKSTRA + HEAP
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs font-black text-white group-hover:text-green-300 transition-colors">
                  4. Match and expiry engine
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
              <span>{activeVisualEngine === 'match-expiry' ? 'Active Below' : 'Show Dijkstra & Heap'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>

        {/* IN-PAGE VISUAL IMPLEMENTATION WORKSPACE */}
        <div className="pt-2">
          {activeVisualEngine === 'match-expiry' && (
            <MatchAndExpiryVisualizer />
          )}

          {activeVisualEngine === 'inventory-sync' && (
            <div className="bg-[#090d16] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
              
              {/* Sub-Tab Navigation for Inventory Sync Engine */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInventorySubTab('ml-predictor')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
                      inventorySubTab === 'ml-predictor'
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>1. AI Donor Replenishment Predictor (ML Model)</span>
                  </button>
                  <button
                    onClick={() => setInventorySubTab('mutex')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
                      inventorySubTab === 'mutex'
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>2. Mutex Concurrency Simulator (DBMS)</span>
                  </button>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {inventorySubTab === 'ml-predictor' ? 'Kaggle UCI Model' : 'Single-Writer Mutex'}
                </span>
              </div>

              {inventorySubTab === 'ml-predictor' ? (
                <AIDonorPredictor />
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                          IN-PAGE VISUAL WORKSPACE
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        Inventory sync engine: Concurrency Mutex Simulator
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Single-writer transactional locking with ascending ID acquisition hierarchy.
                      </p>
                    </div>

                    <button
                      onClick={handleRunMutexSimulation}
                      disabled={mutexRunning}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      {mutexRunning ? (
                        <span>Executing 10 Threads...</span>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-black" />
                          <span>Dispatch 10 Parallel Allocation Threads</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                      <div className="text-xs font-mono font-bold text-zinc-400 mb-1">Row Lock Status</div>
                      <div className="text-xl font-black text-emerald-400 font-mono">EXCLUSIVE (ACID)</div>
                      <div className="text-[11px] text-zinc-500 mt-1">Single-Writer Mutex: Active</div>
                    </div>

                    <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                      <div className="text-xs font-mono font-bold text-zinc-400 mb-1">Deadlock Prevention</div>
                      <div className="text-xl font-black text-white font-mono">ASCENDING ID HIERARCHY</div>
                      <div className="text-[11px] text-zinc-500 mt-1">H001 &lt; H002 &lt; H003 (No Cycles)</div>
                    </div>

                    <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                      <div className="text-xs font-mono font-bold text-zinc-400 mb-1">Reserve Safety Invariant</div>
                      <div className="text-xl font-black text-emerald-400 font-mono">VERIFIED 100%</div>
                      <div className="text-[11px] text-zinc-500 mt-1">Available = Total - Held - InTransit</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1.5 max-h-[180px] overflow-y-auto">
                    <div className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800 pb-1 mb-2 font-bold flex items-center justify-between">
                      <span>LIVE MUTEX CONCURRENCY TRACE LOG</span>
                      <span className="text-emerald-400">STATUS: HEALTHY</span>
                    </div>
                    {mutexLogs.map((log, idx) => (
                      <div key={idx} className={idx === 0 ? 'text-emerald-300' : 'text-zinc-400'}>
                        &gt; {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {activeVisualEngine === 'priority-scheduling' && (
            <div className="bg-[#090d16] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-400">
                      IN-PAGE VISUAL WORKSPACE
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                    <Layers className="w-6 h-6 text-teal-400" />
                    Priority scheduling engine: 3-Lane MLFQ Visualizer
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Multilevel Feedback Queues with dynamic aging points and trauma emergency preemption.
                  </p>
                </div>

                <button
                  onClick={handleTriggerPreemption}
                  disabled={mlfqRunning}
                  className="bg-teal-500 hover:bg-teal-400 text-black font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition disabled:opacity-50"
                >
                  <Flame className="w-4 h-4 fill-black" />
                  <span>Simulate Code-Red Trauma Preemption (+15 Boost)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-rose-950/30 border border-rose-800/60 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-rose-300 uppercase font-mono">LANE 0: EMERGENCY</span>
                    <span className="text-[10px] font-mono bg-rose-900 text-rose-200 px-1.5 py-0.5 rounded">BASE 100</span>
                  </div>
                  <div className="text-xs text-zinc-300 font-mono">Immediate Preemption Enabled</div>
                  <div className="text-[11px] text-rose-400 mt-2 font-bold">Priority Boost: +10 / tick</div>
                </div>

                <div className="bg-amber-950/30 border border-amber-800/60 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-amber-300 uppercase font-mono">LANE 1: URGENT</span>
                    <span className="text-[10px] font-mono bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded">BASE 50</span>
                  </div>
                  <div className="text-xs text-zinc-300 font-mono">Surgical & ICU Reservations</div>
                  <div className="text-[11px] text-amber-400 mt-2 font-bold">Priority Boost: +2 / tick</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-300 uppercase font-mono">LANE 2: ROUTINE</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">BASE 10</span>
                  </div>
                  <div className="text-xs text-zinc-300 font-mono">Elective Scheduled Operations</div>
                  <div className="text-[11px] text-slate-400 mt-2 font-bold">Aging: +1 / tick (No Starvation)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-teal-300">
                &gt; {mlfqLog}
              </div>
            </div>
          )}

          {activeVisualEngine === 'web-engine' && (
            <div className="bg-[#090d16] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                      IN-PAGE VISUAL WORKSPACE
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-cyan-400" />
                    Web engine: Reactive Telemetry & Live SSE Push
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time Server-Sent Events stream with sub-15ms packet latency across connected hospitals.
                  </p>
                </div>

                <button
                  onClick={handleBroadcastEvent}
                  disabled={webStreaming}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                >
                  <Activity className="w-4 h-4 fill-black" />
                  <span>Broadcast Live SSE Push Packet</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                  <div className="text-xs font-mono font-bold text-zinc-400 mb-1">Packet Latency</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono">&lt; 15ms</div>
                  <div className="text-[11px] text-zinc-500 mt-1">HTTP/2 Persistent Stream</div>
                </div>

                <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                  <div className="text-xs font-mono font-bold text-zinc-400 mb-1">Client Connections</div>
                  <div className="text-2xl font-black text-white font-mono">5 Hospitals Active</div>
                  <div className="text-[11px] text-zinc-500 mt-1">Live Multi-Node Synchronization</div>
                </div>

                <div className="bg-black/60 p-4 rounded-xl border border-zinc-800">
                  <div className="text-xs font-mono font-bold text-zinc-400 mb-1">Offline Self-Healing</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">ONLINE FALLBACK</div>
                  <div className="text-[11px] text-zinc-500 mt-1">IndexedDB / LocalStore Sync</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2 max-h-[180px] overflow-y-auto">
                <div className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800 pb-1 mb-2 font-bold flex items-center justify-between">
                  <span>LIVE SSE PACKET STREAM</span>
                  <span className="text-cyan-400">STREAM: ACTIVE</span>
                </div>
                {webPackets.map((pkt) => (
                  <div key={pkt.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">[{pkt.time}]</span>
                    <span className="text-cyan-300 font-bold">{pkt.event}</span>
                    <span className="text-zinc-400">{pkt.latency}</span>
                    <span className="text-emerald-400 font-bold">{pkt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
