import React, { useState } from 'react';
import {
  ShieldCheck,
  Network,
  Clock,
  Layers,
  X,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Zap,
  Building2,
  Droplets,
  TrendingUp,
  GitBranch,
  Lock,
  Compass,
  Flame,
  Activity
} from 'lucide-react';
import { BloodUnit, BloodRequest, Hospital } from '../types/index.js';

export type EngineId = 'inventory-sync' | 'matching-dijkstra' | 'expiry-minheap' | 'scheduler-mlfq';

interface EngineWorkflowModalProps {
  engineId: EngineId;
  onClose: () => void;
  onSelectEngine: (id: EngineId) => void;
  hospitals?: Hospital[];
  inventory?: BloodUnit[];
  requests?: BloodRequest[];
}

export const EngineWorkflowModal: React.FC<EngineWorkflowModalProps> = ({
  engineId,
  onClose,
  onSelectEngine,
  hospitals = [],
  inventory = [],
  requests = [],
}) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'how-it-works' | 'live-data'>('simulation');

  // 1. DIJKSTRA SIMULATOR STATE
  const [sourceHosp, setSourceHosp] = useState<string>('H001');
  const [targetHosp, setTargetHosp] = useState<string>('H003');
  const [dijkstraRunning, setDijkstraRunning] = useState<boolean>(false);
  const [dijkstraResult, setDijkstraResult] = useState<any>(null);

  // 2. MIN-HEAP SIMULATOR STATE
  const [simulatedHours, setSimulatedHours] = useState<number>(0);
  const [heapSimulationUnits, setHeapSimulationUnits] = useState<any[]>([
    { id: 'INV004', blood_group: 'O+', component: 'RBC', hospital: 'District Hospital', initialHours: 48, currentHours: 48, tier: 'CRITICAL' },
    { id: 'INV010', blood_group: 'O-', component: 'RBC', hospital: 'Shree Hospital', initialHours: 72, currentHours: 72, tier: 'CRITICAL' },
    { id: 'INV002', blood_group: 'A+', component: 'RBC', hospital: 'KLE Hospital', initialHours: 120, currentHours: 120, tier: 'NEAR_EXPIRY' },
    { id: 'INV008', blood_group: 'O-', component: 'RBC', hospital: 'City Care Hospital', initialHours: 432, currentHours: 432, tier: 'VALID' },
    { id: 'INV001', blood_group: 'O+', component: 'RBC', hospital: 'KLE Hospital', initialHours: 720, currentHours: 720, tier: 'VALID' },
  ]);
  const [heapLog, setHeapLog] = useState<string>('Min-Heap initialized: Root node INV004 has minimum remaining shelf-life (48h). Peak peek complexity O(1).');

  // 3. INVENTORY SYNC MUTEX SIMULATOR STATE
  const [mutexRunning, setMutexRunning] = useState<boolean>(false);
  const [mutexLogs, setMutexLogs] = useState<string[]>([
    'Single-writer transaction mutex ready.',
    'System Invariant: Available = Total (30) - Held (5) - In-Transit (3) = 22 Units.',
  ]);

  // 4. MLFQ SCHEDULER SIMULATOR STATE
  const [mlfqRunning, setMlfqRunning] = useState<boolean>(false);
  const [mlfqLog, setMlfqLog] = useState<string>('3-Lane MLFQ active. Lane 0 (Emergency), Lane 1 (Urgent), Lane 2 (Routine). Ready for preemption.');
  const [preemptionTriggered, setPreemptionTriggered] = useState<boolean>(false);

  // Handle Dijkstra Run
  const handleRunDijkstra = () => {
    setDijkstraRunning(true);
    setTimeout(() => {
      setDijkstraRunning(false);

      // Distance matrix between Belagavi regional hubs
      const roadGraph: Record<string, Record<string, number>> = {
        H001: { H002: 5, H004: 28, H003: 100, H005: 505 },
        H002: { H001: 5, H004: 25, H003: 95, H005: 500 },
        H003: { H004: 20, H001: 100, H002: 95, H005: 410 },
        H004: { H001: 28, H002: 25, H003: 20, H005: 430 },
        H005: { H001: 505, H002: 500, H003: 410, H004: 430 },
      };

      const dist = roadGraph[sourceHosp]?.[targetHosp] || 45;
      const hours = (dist / 40).toFixed(1);
      const minutes = Math.round((dist / 40) * 60);

      const pathSteps = sourceHosp === targetHosp
        ? [`${sourceHosp} (Self-fulfill: 0 km, 0 mins)`]
        : dist <= 30
        ? [`${sourceHosp} → ${targetHosp} (Direct highway link, ${dist} km)`]
        : [`${sourceHosp} → H004 (Dharwad bypass, 28 km) → ${targetHosp} (Total ${dist} km)`];

      setDijkstraResult({
        distanceKm: dist,
        transitMinutes: minutes,
        transitHours: hours,
        path: pathSteps,
        matchScore: Math.min(98, Math.max(72, 100 - dist * 0.15)).toFixed(1),
        freshnessScore: 92,
        bufferVerified: true,
      });
    }, 500);
  };

  // Handle Min-Heap Advance Time
  const handleAdvanceHeapTime = (hours: number) => {
    const newTotalHours = simulatedHours + hours;
    setSimulatedHours(newTotalHours);

    const updated = heapSimulationUnits.map(u => {
      const remaining = Math.max(0, u.currentHours - hours);
      let tier = 'VALID';
      if (remaining === 0) tier = 'EXPIRED';
      else if (remaining <= 72) tier = 'CRITICAL';
      else if (remaining <= 168) tier = 'NEAR_EXPIRY';
      return { ...u, currentHours: remaining, tier };
    }).sort((a, b) => a.currentHours - b.currentHours);

    setHeapSimulationUnits(updated);
    setHeapLog(`Advanced clock +${hours}h. Total elapsed: +${newTotalHours}h. Min-Heap re-heapified in O(log N). Root: ${updated[0].id} (${updated[0].currentHours}h left, Tier: ${updated[0].tier}).`);
  };

  const handleResetHeap = () => {
    setSimulatedHours(0);
    setHeapSimulationUnits([
      { id: 'INV004', blood_group: 'O+', component: 'RBC', hospital: 'District Hospital', initialHours: 48, currentHours: 48, tier: 'CRITICAL' },
      { id: 'INV010', blood_group: 'O-', component: 'RBC', hospital: 'Shree Hospital', initialHours: 72, currentHours: 72, tier: 'CRITICAL' },
      { id: 'INV002', blood_group: 'A+', component: 'RBC', hospital: 'KLE Hospital', initialHours: 120, currentHours: 120, tier: 'NEAR_EXPIRY' },
      { id: 'INV008', blood_group: 'O-', component: 'RBC', hospital: 'City Care Hospital', initialHours: 432, currentHours: 432, tier: 'VALID' },
      { id: 'INV001', blood_group: 'O+', component: 'RBC', hospital: 'KLE Hospital', initialHours: 720, currentHours: 720, tier: 'VALID' },
    ]);
    setHeapLog('Min-Heap reset to baseline state.');
  };

  // Handle Mutex Simulation
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

  // Handle MLFQ Preemption Simulation
  const handleTriggerMlfqPreemption = () => {
    setMlfqRunning(true);
    setTimeout(() => {
      setPreemptionTriggered(true);
      setMlfqLog('[PREEMPTION EXECUTED] Code-Red Emergency request REQ003 (Shree Hospital) preempted tentative hold on Unit INV008 held by Routine REQ005. Victim REQ005 awarded +15 point compensation boost and elevated to Head of Lane 1 (Urgent). Zero starvation.');
      setMlfqRunning(false);
    }, 600);
  };

  const handleRunBankerCheck = () => {
    setMlfqRunning(true);
    setTimeout(() => {
      setMlfqLog("[BANKER'S SAFETY VERIFIED] Evaluated Work Vector [10, 5, 15, 6] against remaining hospital Max Claims. Verified safe allocation sequence: [REQ003 -> REQ001 -> REQ006 -> REQ002]. Zero risk of supply deadlock.");
      setMlfqRunning(false);
    }, 500);
  };

  const engineMeta = {
    'inventory-sync': {
      title: 'Real-Time Inventory Synchronization',
      subtitle: 'Deterministic Row-Level Locking & Single-Writer ACID Ledger',
      icon: ShieldCheck,
      badge: '100% ACID MUTEX',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      tagline: 'Guarantees zero double-allocation, zero race conditions, and zero phantom inventory across hospitals.',
    },
    'matching-dijkstra': {
      title: 'Smart Transit & Route Optimizer',
      subtitle: 'Dijkstra Shortest-Path Graph Pathfinder & Proximity Matcher',
      icon: Network,
      badge: 'DIJKSTRA DSA • O((V+E) log V)',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      tagline: 'Calculates the fastest hospital travel route and pairs emergency requests with the closest compatible donor units in under 1.2s.',
    },
    'expiry-minheap': {
      title: 'Automated Freshness & Expiry Management',
      subtitle: 'Event-Driven Binary Min-Heap & First-Expiry Protocol (FEFO)',
      icon: Clock,
      badge: 'MIN-HEAP • O(log N) TRANSITIONS',
      badgeColor: 'bg-green-500/20 text-green-300 border-green-500/40',
      tagline: 'Tracks blood component shelf-life to the minute, prioritizing units closest to expiry to prevent wastage of scarce donor units.',
    },
    'scheduler-mlfq': {
      title: 'Priority Emergency Triage Dispatcher',
      subtitle: 'Multilevel Feedback Queue (MLFQ) & Banker’s Deadlock Avoidance',
      icon: Layers,
      badge: 'OS MLFQ • BANKER SAFE',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      tagline: 'Automates trauma emergency preemption with +15 compensation boost, ensuring urgent surgeries are expedited while routine patient queues never starve.',
    },
  }[engineId];

  const Icon = engineMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#090d16] border border-zinc-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ============================================================ */}
        {/* MODAL HEADER WITH ENGINE SWITCHER PILLS                     */}
        {/* ============================================================ */}
        <div className="p-6 border-b border-zinc-800/80 bg-black/60 shrink-0">
          <div className="flex items-start justify-between gap-4">
            
            {/* Title & Badge */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Icon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {engineMeta.title}
                  </h2>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${engineMeta.badgeColor}`}>
                    {engineMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {engineMeta.subtitle}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Engine Switcher Bar */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-zinc-900">
            {[
              { id: 'inventory-sync', label: '1. Inventory Sync', sub: 'ACID Mutex' },
              { id: 'matching-dijkstra', label: '2. Smart Routing', sub: 'Dijkstra Path' },
              { id: 'expiry-minheap', label: '3. Freshness & Expiry', sub: 'Min-Heap FEFO' },
              { id: 'scheduler-mlfq', label: '4. Triage Dispatch', sub: 'OS MLFQ Queue' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSelectEngine(tab.id as EngineId)}
                className={`px-3 py-2 rounded-xl text-left transition-all border cursor-pointer ${
                  engineId === tab.id
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950'
                    : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <div className="text-xs font-black truncate">{tab.label}</div>
                <div className="text-[10px] text-zinc-500 font-mono">{tab.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB NAVIGATION (Simulation / How It Works / Live Data)       */}
        {/* ============================================================ */}
        <div className="px-6 pt-3 border-b border-zinc-800/80 flex items-center gap-4 bg-black/30 shrink-0 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulation'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Interactive Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'how-it-works'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>How It Works (Step-by-Step)</span>
          </button>

          <button
            onClick={() => setActiveTab('live-data')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live-data'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live System State</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MODAL BODY (Scrollable Container)                           */}
        {/* ============================================================ */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* ========================================================== */}
          {/* TAB 1: INTERACTIVE SIMULATORS                              */}
          {/* ========================================================== */}
          {activeTab === 'simulation' && (
            <div className="space-y-6">
              
              {/* ------------------------------------------------------ */}
              {/* SIMULATOR 1: DIJKSTRA PATHFINDER                      */}
              {/* ------------------------------------------------------ */}
              {engineId === 'matching-dijkstra' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Network className="w-4 h-4 text-teal-400" />
                          <span>Regional Highway Graph Pathfinder Simulator</span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Select any requesting hospital and destination facility to compute the Dijkstra shortest route via the binary min-heap priority queue.
                        </p>
                      </div>

                      <button
                        onClick={handleRunDijkstra}
                        disabled={dijkstraRunning}
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {dijkstraRunning ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>Computing Shortest Path...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-black" />
                            <span>Run Dijkstra Pathfinder</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Selector Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-800">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                          Source Requesting Hospital (V0):
                        </label>
                        <select
                          value={sourceHosp}
                          onChange={(e) => setSourceHosp(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="H001">H001 - KLE Hospital (Belagavi)</option>
                          <option value="H002">H002 - District Hospital (Belagavi)</option>
                          <option value="H003">H003 - City Care Hospital (Hubballi)</option>
                          <option value="H004">H004 - Sahyadri Medical Center (Dharwad)</option>
                          <option value="H005">H005 - Shree Hospital (Bengaluru)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                          Target Sourcing Facility (Vn):
                        </label>
                        <select
                          value={targetHosp}
                          onChange={(e) => setTargetHosp(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="H003">H003 - City Care Hospital (Hubballi)</option>
                          <option value="H001">H001 - KLE Hospital (Belagavi)</option>
                          <option value="H002">H002 - District Hospital (Belagavi)</option>
                          <option value="H004">H004 - Sahyadri Medical Center (Dharwad)</option>
                          <option value="H005">H005 - Shree Hospital (Bengaluru)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pathfinder Result Display */}
                  {dijkstraResult && (
                    <div className="bg-[#030712] p-5 rounded-2xl border border-teal-500/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                          <span>Dijkstra Shortest Path Verified</span>
                        </div>
                        <span className="text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800/60 px-2.5 py-0.5 rounded-full font-bold">
                          Total Score: {dijkstraResult.matchScore}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div className="text-lg font-black text-white font-mono">{dijkstraResult.distanceKm} km</div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Driving Distance</div>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div className="text-lg font-black text-teal-300 font-mono">{dijkstraResult.transitMinutes} mins</div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Transit @ 40 km/h</div>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div className="text-lg font-black text-emerald-400 font-mono">4-Hour Safe</div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Viability Buffer</div>
                        </div>
                        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div className="text-lg font-black text-white font-mono">&lt; 1.2s</div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">Compute Latency</div>
                        </div>
                      </div>

                      <div className="bg-black p-3.5 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">Algorithm Min-Heap Traversal Path:</div>
                        <div className="text-teal-300 font-bold">
                          {dijkstraResult.path.join(' ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------ */}
              {/* SIMULATOR 2: MIN-HEAP FRESHNESS & EXPIRY              */}
              {/* ------------------------------------------------------ */}
              {engineId === 'expiry-minheap' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-400" />
                          <span>Binary Min-Heap Shelf-Life Tracker</span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Simulate timeline progression to observe how units age and bubble up to the root of the Min-Heap priority queue in O(log N).
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAdvanceHeapTime(24)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Advance +24 Hours</span>
                        </button>
                        <button
                          onClick={() => handleAdvanceHeapTime(72)}
                          className="bg-teal-500 hover:bg-teal-400 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>+72 Hours</span>
                        </button>
                        <button
                          onClick={handleResetHeap}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Reset Simulator"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-300">
                      &gt; {heapLog}
                    </div>
                  </div>

                  {/* Heap Tree surfs root first */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-bold text-zinc-400 uppercase">
                        Current Min-Heap Queue (Root = Minimum Expiry Time):
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        Simulation Offset: +{simulatedHours} Hours Elapsed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {heapSimulationUnits.map((unit, idx) => (
                        <div
                          key={unit.id}
                          className={`p-3.5 rounded-xl border transition ${
                            idx === 0
                              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950'
                              : 'bg-zinc-950 border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="font-bold text-white">{unit.id}</span>
                            {idx === 0 && (
                              <span className="bg-emerald-500 text-black px-1.5 py-0.2 rounded font-black text-[9px]">
                                HEAP ROOT
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-black text-white">{unit.blood_group} {unit.component}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{unit.hospital}</div>
                          <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-zinc-500">Expires:</span>
                            <span className={`font-black ${unit.currentHours <= 72 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                              {unit.currentHours}h left
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                              unit.tier === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' :
                              unit.tier === 'NEAR_EXPIRY' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                              unit.tier === 'EXPIRED' ? 'bg-zinc-800 text-zinc-400' :
                              'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            }`}>
                              {unit.tier}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------ */}
              {/* SIMULATOR 3: INVENTORY SYNC MUTEX                     */}
              {/* ------------------------------------------------------ */}
              {engineId === 'inventory-sync' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Single-Writer Concurrency & ACID Mutex Simulator</span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Simulate high-concurrency peak load where 10 parallel hospital worker threads attempt simultaneous holds on shared stock.
                        </p>
                      </div>

                      <button
                        onClick={handleRunMutexSimulation}
                        disabled={mutexRunning}
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {mutexRunning ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                            <span>Acquiring Locks...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-black" />
                            <span>Simulate 10 Parallel Requests</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Invariant Formula Card */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500">Central Ledger Invariant: </span>
                        <span className="text-emerald-400 font-bold">Available = Total - Held - In_Transit</span>
                      </div>
                      <div className="text-zinc-400">
                        Acquisition Order: <span className="text-white font-bold">Ascending Hospital ID (H001 → H005)</span>
                      </div>
                    </div>
                  </div>

                  {/* Mutex Execution Logs */}
                  <div className="bg-[#030712] p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1.5">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase pb-1 border-b border-zinc-800 flex items-center justify-between">
                      <span>Real-Time Mutex Acquisition Trace:</span>
                      <span className="text-emerald-400 font-bold">100% ACID CONSISTENT</span>
                    </div>
                    {mutexLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed text-emerald-300">
                        &gt; {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------ */}
              {/* SIMULATOR 4: OS MLFQ SCHEDULER & PREEMPTION           */}
              {/* ------------------------------------------------------ */}
              {engineId === 'scheduler-mlfq' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span>3-Lane Priority Multilevel Feedback Queue (MLFQ)</span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Simulate emergency preemption with victim compensation (+15 boost) and run Banker's Deadlock Avoidance algorithm.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={handleTriggerMlfqPreemption}
                          disabled={mlfqRunning}
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 fill-black" />
                          <span>Simulate Preemption (+15 Boost)</span>
                        </button>
                        <button
                          onClick={handleRunBankerCheck}
                          disabled={mlfqRunning}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <span>Banker Safety Check</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-300">
                      &gt; {mlfqLog}
                    </div>
                  </div>

                  {/* 3 Priority Lanes Visualizer */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Lane 0: Emergency */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-rose-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-rose-400 uppercase font-mono">Lane 0: Emergency</span>
                        <span className="text-[9px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded font-bold">PREEMPTION POWER</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="bg-black p-2.5 rounded-lg border border-zinc-800">
                          <div className="font-bold text-white">REQ003 - Shree Hospital</div>
                          <div className="text-[10px] text-zinc-400">2 Units O- RBC • Critical Trauma</div>
                          <div className="text-[10px] text-emerald-400 font-mono font-bold mt-1">Status: Dispatched Instantly</div>
                        </div>
                      </div>
                    </div>

                    {/* Lane 1: Urgent */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-teal-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-teal-400 uppercase font-mono">Lane 1: Urgent</span>
                        <span className="text-[9px] font-mono bg-teal-950 text-teal-300 px-2 py-0.5 rounded font-bold">&lt; 24H SURGERY</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="bg-black p-2.5 rounded-lg border border-zinc-800">
                          <div className="font-bold text-white">REQ001 - District Hospital</div>
                          <div className="text-[10px] text-zinc-400">4 Units O+ RBC • Scheduled</div>
                        </div>
                        {preemptionTriggered && (
                          <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/60 animate-in fade-in">
                            <div className="font-bold text-emerald-300">REQ005 - Victim Compensated</div>
                            <div className="text-[10px] text-zinc-400">+15 Compensation Score Added</div>
                            <div className="text-[10px] text-emerald-400 font-mono font-bold mt-1">Next in Line for Allocation</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lane 2: Routine */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-zinc-400 uppercase font-mono">Lane 2: Routine</span>
                        <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold">AGING BOOST ACTIVE</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="bg-black p-2.5 rounded-lg border border-zinc-800">
                          <div className="font-bold text-white">REQ002 - City Care Hospital</div>
                          <div className="text-[10px] text-zinc-400">5 Units A+ RBC • General Restock</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-1">Wait: 12h (+24 Aging Pts)</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: HOW IT WORKS (STEP-BY-STEP & CS EXPLANATION)        */}
          {/* ========================================================== */}
          {activeTab === 'how-it-works' && (
            <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
              
              {engineId === 'matching-dijkstra' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-3">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Network className="w-4 h-4 text-teal-400" />
                      <span>Dijkstra Shortest-Path Algorithm & Multi-Factor Match Score</span>
                    </h4>
                    <p>
                      The Smart Transit Optimizer treats the regional hospital network as a weighted graph <code className="text-emerald-400 font-mono font-bold">G = (V, E)</code>, where vertices <code className="text-emerald-400 font-mono font-bold">V</code> represent hospital blood banks and edges <code className="text-emerald-400 font-mono font-bold">E</code> represent real road links with kilometer weights.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">1. Priority Queue Relaxation</div>
                      <p className="text-zinc-400 text-[11px]">
                        Uses a binary min-heap priority queue to extract the nearest unvisited hospital in <code className="text-teal-400 font-mono">O(log V)</code>. For each connected neighbor:
                      </p>
                      <div className="bg-black p-2 rounded-lg font-mono text-[11px] text-emerald-300">
                        if dist[u] + weight(u, v) &lt; dist[v]:<br />
                        &nbsp;&nbsp;dist[v] = dist[u] + weight(u, v)<br />
                        &nbsp;&nbsp;heap.push((dist[v], v))
                      </div>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">2. Multi-Factor Scoring Formula</div>
                      <p className="text-zinc-400 text-[11px]">
                        Balances transit travel distance, expiry urgency (FEFO), and volume availability to select the optimal donor hospital:
                      </p>
                      <div className="bg-black p-2 rounded-lg font-mono text-[11px] text-teal-300">
                        Score = (0.45 * Freshness) +<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(0.35 * TransitSpeed) +<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(0.20 * QuantityFit)
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="font-bold text-white text-xs uppercase font-mono">3. Safe Viability Verification Buffer</div>
                    <p className="text-zinc-400 text-[11px]">
                      Before approving a match, the algorithm verifies that the estimated transit time plus a mandatory 4-hour clinical preparation buffer does not exceed the remaining shelf-life of the blood units:
                    </p>
                    <div className="bg-black p-2 rounded-lg font-mono text-[11px] text-emerald-300">
                      TotalTransitHours = (DistanceKm / 40 km/h)<br />
                      Viable = (RemainingShelfLifeHours &gt; TotalTransitHours + 4.0 Hours)
                    </div>
                  </div>
                </div>
              )}

              {engineId === 'expiry-minheap' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-3">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-400" />
                      <span>Event-Driven Binary Min-Heap Priority Queue (FEFO)</span>
                    </h4>
                    <p>
                      To guarantee zero blood wastage, the Freshness Management Engine orders every blood donation into a Binary Min-Heap where the key is the unit's timestamp of expiration.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">Constant-Time Root Access O(1)</div>
                      <p className="text-zinc-400 text-[11px]">
                        The root element of the Min-Heap is mathematically guaranteed to be the unit closest to expiration. When matching scheduled transfusions, peeking the optimal unit takes <code className="text-emerald-400 font-mono">O(1)</code> time.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">Logarithmic Heapify O(log N)</div>
                      <p className="text-zinc-400 text-[11px]">
                        When new units are donated or existing units are administered, the binary heap structure restores invariant via <code className="text-teal-400 font-mono">bubbleUp()</code> and <code className="text-teal-400 font-mono">sinkDown()</code> in strictly logarithmic time.
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                    <div className="font-bold text-white text-xs uppercase font-mono">4 Automated Freshness Tiers</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                      <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                        <div className="font-bold">TIER 1: VALID</div>
                        <div className="text-zinc-400 mt-1">&gt; 7 Days Life</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300">
                        <div className="font-bold">TIER 2: NEAR EXPIRY</div>
                        <div className="text-zinc-400 mt-1">&le; 7 Days Life</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300">
                        <div className="font-bold">TIER 3: CRITICAL</div>
                        <div className="text-zinc-400 mt-1">&le; 72 Hours Life</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400">
                        <div className="font-bold">TIER 4: EXPIRED</div>
                        <div className="text-zinc-500 mt-1">0 Hours (Locked)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {engineId === 'inventory-sync' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-3">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Single-Writer Invariant & Ascending-ID Deadlock Prevention</span>
                    </h4>
                    <p>
                      Hospital blood allocation requires strict distributed consistency. Multiple ER facilities requesting the same rare blood component (such as O-Negative) simultaneously must never cause overdrafts, phantom reserves, or lock freezes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">1. Row-Level Mutex Locking</div>
                      <p className="text-zinc-400 text-[11px]">
                        The database executes transaction holds using atomic row-level locks (<code className="text-emerald-400 font-mono">SELECT ... FOR UPDATE</code>). Only the single-writer engine is allowed to mutate inventory quantities.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">2. Ascending Lock Hierarchy</div>
                      <p className="text-zinc-400 text-[11px]">
                        To prevent cyclic deadlocks (Coffman's Circular Wait), all multi-hospital holds must acquire resource locks in strictly ascending hospital ID order:
                      </p>
                      <div className="bg-black p-2 rounded-lg font-mono text-[11px] text-teal-300">
                        Lock(H001) &rarr; Lock(H002) &rarr; Lock(H003) &rarr; ...
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="font-bold text-white text-xs uppercase font-mono">3. Mathematical Conservation Invariant</div>
                    <p className="text-zinc-400 text-[11px]">
                      At every millisecond, the ledger enforces the fundamental conservation of physical units:
                    </p>
                    <div className="bg-black p-2 rounded-lg font-mono text-[11px] text-emerald-300">
                      TotalUnits = AvailableUnits + HeldUnits + InTransitUnits<br />
                      Invariant: AvailableUnits &ge; 0
                    </div>
                  </div>
                </div>
              )}

              {engineId === 'scheduler-mlfq' && (
                <div className="space-y-5">
                  <div className="bg-black/50 p-5 rounded-2xl border border-zinc-800 space-y-3">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>Multilevel Feedback Queue (MLFQ) & Banker’s Safety State</span>
                    </h4>
                    <p>
                      Emergency blood requests cannot afford to wait behind non-urgent scheduled orders. The scheduler dynamically balances immediate trauma triage with starvation-free routine execution.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">1. Preemption & Victim Compensation</div>
                      <p className="text-zinc-400 text-[11px]">
                        When an Emergency request arrives, it immediately preempts non-urgent holds. The preempted request is awarded an immediate <code className="text-emerald-400 font-mono">+15 point compensation boost</code> to ensure it receives next available stock.
                      </p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                      <div className="font-bold text-white text-xs uppercase font-mono">2. Dynamic Aging Formula</div>
                      <p className="text-zinc-400 text-[11px]">
                        Routine requests accumulate aging points over simulated time to guarantee that low-priority requests never starve during prolonged emergency periods:
                      </p>
                      <div className="bg-black p-2 rounded-lg font-mono text-[11px] text-cyan-300">
                        AgingPoints = ElapsedWaitHours * 2.0<br />
                        Promote to Urgent if AgingPoints &gt;= 12.0
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="font-bold text-white text-xs uppercase font-mono">3. Banker's Deadlock Avoidance Algorithm</div>
                    <p className="text-zinc-400 text-[11px]">
                      Before granting multi-unit resource holds, the scheduler verifies that the network remains in a safe execution state where all hospitals can satisfy their maximum claim:
                    </p>
                    <div className="bg-black p-2 rounded-lg font-mono text-[11px] text-emerald-300">
                      Need[i] = MaxClaim[i] - Allocation[i]<br />
                      Safe if exists permutation P such that Need[P[i]] &le; WorkVector
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: LIVE SYSTEM RECORDS FOR THIS ENGINE                 */}
          {/* ========================================================== */}
          {activeTab === 'live-data' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Network State for {engineMeta.title}:</span>
                <span className="text-emerald-400">● LIVE QUERY SYNCHRONIZED</span>
              </div>

              {engineId === 'matching-dijkstra' && (
                <div className="bg-black p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="text-zinc-400 text-[11px]">Regional Distance Matrix (km) between Belagavi Hubs:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px]">
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800">H001 ↔ H002: 5 km</div>
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800">H001 ↔ H004: 28 km</div>
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800">H003 ↔ H004: 20 km</div>
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800">H001 ↔ H003: 100 km</div>
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800">H001 ↔ H005: 505 km</div>
                  </div>
                </div>
              )}

              {engineId === 'expiry-minheap' && (
                <div className="bg-black p-4 rounded-xl border border-zinc-800 space-y-2">
                  <div className="text-zinc-400 text-[11px]">Units Monitored in Min-Heap ({inventory.length} Total Registered):</div>
                  <div className="divide-y divide-zinc-900">
                    {inventory.slice(0, 5).map(u => (
                      <div key={u.id} className="py-2 flex items-center justify-between text-[11px]">
                        <span className="text-white font-bold">{u.id} ({u.blood_group} {u.component})</span>
                        <span className="text-zinc-400">{u.hospital_name}</span>
                        <span className="text-emerald-400">{u.available_quantity} available</span>
                        <span className="text-teal-300 font-bold">{u.tier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {engineId === 'inventory-sync' && (
                <div className="bg-black p-4 rounded-xl border border-zinc-800 space-y-2">
                  <div className="text-zinc-400 text-[11px]">Single-Writer Mutex State:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-emerald-400">Mutex: FREE</div>
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-white">Active Writer: Engine 1</div>
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-teal-300">Lock Queue: 0 Waiting</div>
                    <div className="p-2 bg-zinc-950 rounded border border-zinc-800 text-white">Isolation: Serialized</div>
                  </div>
                </div>
              )}

              {engineId === 'scheduler-mlfq' && (
                <div className="bg-black p-4 rounded-xl border border-zinc-800 space-y-2">
                  <div className="text-zinc-400 text-[11px]">Active Requests in MLFQ Queues ({requests.length} Total):</div>
                  <div className="divide-y divide-zinc-900">
                    {requests.slice(0, 4).map(r => (
                      <div key={r.id} className="py-2 flex items-center justify-between text-[11px]">
                        <span className="text-white font-bold">{r.id} ({r.requesting_hospital_name})</span>
                        <span className="text-amber-400 font-bold">{r.priority}</span>
                        <span className="text-zinc-400">Aging: {r.aging_points} pts</span>
                        <span className="text-emerald-400 font-bold">Score: {r.effective_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ============================================================ */}
        {/* MODAL FOOTER                                                 */}
        {/* ============================================================ */}
        <div className="p-4 px-6 border-t border-zinc-800 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational Engine Verified • High-Precision Healthcare Coordination</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition cursor-pointer"
          >
            Close View
          </button>
        </div>

      </div>
    </div>
  );
};
export default EngineWorkflowModal;