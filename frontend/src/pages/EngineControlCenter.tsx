import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useSimClock } from '../context/SimClockContext.js';
import { EngineStatusInfo, BloodRequest, MatchExplanation, BankerState } from '../types/index.js';
import { PriorityBadge } from '../components/PriorityBadge.js';
import { MatchDisclaimer } from '../components/MatchDisclaimer.js';
import {
  Cpu,
  Play,
  Pause,
  Clock,
  Layers,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  BookOpen,
  FastForward,
} from 'lucide-react';

export const EngineControlCenter: React.FC = () => {
  const { advanceTime, resetTime } = useSimClock();
  const [status, setStatus] = useState<EngineStatusInfo | null>(null);
  const [queueLanes, setQueueLanes] = useState<{ EMERGENCY: BloodRequest[]; URGENT: BloodRequest[]; ROUTINE: BloodRequest[] }>({
    EMERGENCY: [],
    URGENT: [],
    ROUTINE: [],
  });
  const [selectedRequestId, setSelectedRequestId] = useState<string>('REQ001');
  const [matches, setMatches] = useState<MatchExplanation[]>([]);
  const [banker, setBanker] = useState<BankerState | null>(null);
  const [fefoUnits, setFefoUnits] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any>(null);
  const [scenarioResults, setScenarioResults] = useState<any[]>([]);
  const [runningScenarios, setRunningScenarios] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'scheduler' | 'matching' | 'expiry' | 'banker' | 'events' | 'scenarios' | 'concept-map'>('scheduler');

  const fetchData = async () => {
    try {
      const [statusRes, queueRes, bankerRes, fefoRes, eventsRes] = await Promise.all([
        api.getEngineStatus(),
        api.getSchedulerQueue(),
        api.getBankerState(),
        api.getFEFOInventory(),
        api.getEventLogs(),
      ]);

      setStatus(statusRes);
      if (queueRes.lanes) setQueueLanes(queueRes.lanes);
      setBanker(bankerRes);
      setFefoUnits(fefoRes);
      setEventsData(eventsRes);
    } catch (err) {
      console.error('Failed to fetch engine data', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedRequestId) {
      api.getRequestMatches(selectedRequestId)
        .then(res => setMatches(res))
        .catch(() => setMatches([]));
    }
  }, [selectedRequestId]);

  const handlePauseResume = async (engineId: string, isPaused: boolean) => {
    if (isPaused) {
      await api.resumeEngine(engineId);
    } else {
      await api.pauseEngine(engineId);
    }
    fetchData();
  };

  const handleRunAllScenarios = async () => {
    setRunningScenarios(true);
    try {
      const results = await api.runAllScenarios();
      setScenarioResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningScenarios(false);
      fetchData();
    }
  };

  const handleTriggerEmergency = async () => {
    await api.triggerEmergency();
    fetchData();
  };

  const handleSimTick = async () => {
    await api.triggerSimTick();
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-crimson-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-crimson-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                Academic Showcase
              </span>
              <span className="text-xs text-slate-400 font-mono">Core Engine Architecture</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Cpu className="w-7 h-7 text-crimson-500" /> Engine Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Live visualization of the 4 priority-driven engines: DBMS Inventory Sync, DSA Matching Engine, DSA/OS Expiry Engine, and OS Multilevel Priority Request Scheduler.
            </p>
          </div>

          {/* Quick Simulation Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/90 p-2 rounded-xl border border-slate-700">
            <button
              onClick={handleTriggerEmergency}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition"
            >
              <Flame className="w-4 h-4 fill-white" /> Fire Emergency
            </button>
            <button
              onClick={handleSimTick}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Run Tick
            </button>
            <button
              onClick={() => advanceTime(24)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition"
            >
              <FastForward className="w-3.5 h-3.5" /> +24h
            </button>
          </div>
        </div>
      </div>

      {/* 1. FOUR ENGINES STATUS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {status?.engines.map((engine) => {
          const isPaused = engine.status === 'PAUSED';
          return (
            <div
              key={engine.id}
              className={`bg-white rounded-xl p-4 border transition shadow-sm relative overflow-hidden ${
                isPaused ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider font-mono">
                  {engine.subject}
                </span>
                <button
                  onClick={() => handlePauseResume(engine.id, isPaused)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition ${
                    isPaused
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {isPaused ? <Play className="w-3 h-3 fill-slate-950" /> : <Pause className="w-3 h-3 fill-emerald-800" />}
                  {isPaused ? 'PAUSED' : 'HEALTHY'}
                </button>
              </div>

              <h3 className="font-extrabold text-sm text-slate-900 leading-tight mb-1">{engine.name}</h3>
              <p className="text-[11px] text-slate-500 font-medium mb-3">{engine.algorithm}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                <span>Queue / Load:</span>
                <span className="font-bold text-slate-900">{engine.queueDepth}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'scheduler', label: 'Multilevel Priority Queue (OS)' },
          { id: 'matching', label: 'Matching Explainer (Dijkstra)' },
          { id: 'expiry', label: 'Expiry Timeline (FEFO Heap)' },
          { id: 'banker', label: "Banker's Avoidance Matrix" },
          { id: 'events', label: 'Event Queue (Producer-Consumer)' },
          { id: 'scenarios', label: 'Academic Test Scenarios (S1-S6)' },
          { id: 'concept-map', label: 'CS Concept Map' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MULTILEVEL PRIORITY QUEUE (OS SCHEDULER) */}
      {activeTab === 'scheduler' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-crimson-600" /> Multilevel Priority Queue Visualizer
              </h2>
              <p className="text-xs text-slate-500">
                OS Multilevel feedback queue ordering with aging points and preemption support. Higher priority queues serve first.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* EMERGENCY LANE */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-200">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600 fill-rose-600 animate-pulse" />
                  <span className="font-black text-xs text-rose-900 uppercase tracking-wider">Level 0: EMERGENCY</span>
                </div>
                <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  Base 100
                </span>
              </div>

              <div className="space-y-3">
                {queueLanes.EMERGENCY.length === 0 ? (
                  <div className="text-xs text-rose-400 italic text-center py-6">No active Emergency requests</div>
                ) : (
                  queueLanes.EMERGENCY.map((req) => (
                    <div key={req.id} className="bg-white p-3 rounded-lg border border-rose-300 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900">{req.id}</span>
                        <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[11px]">
                          Score: {req.effective_score}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {req.items[0]?.blood_group} {req.items[0]?.component} — Qty: {req.items[0]?.quantity}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Req by: {req.requesting_hospital_id}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* URGENT LANE */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-black text-xs text-amber-900 uppercase tracking-wider">Level 1: URGENT</span>
                </div>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Base 60
                </span>
              </div>

              <div className="space-y-3">
                {queueLanes.URGENT.length === 0 ? (
                  <div className="text-xs text-amber-500 italic text-center py-6">No active Urgent requests</div>
                ) : (
                  queueLanes.URGENT.map((req) => (
                    <div key={req.id} className="bg-white p-3 rounded-lg border border-amber-300 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">{req.id}</span>
                          {req.promoted_by_aging && (
                            <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                              AGED
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]">
                          Score: {req.effective_score}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {req.items[0]?.blood_group} {req.items[0]?.component} — Qty: {req.items[0]?.quantity}
                      </div>
                      {/* Aging Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Aging Pts: +{req.aging_points}</span>
                          <span>Wait: {req.aging_points}m</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, req.aging_points * 2)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ROUTINE LANE */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="font-black text-xs text-slate-800 uppercase tracking-wider">Level 2: ROUTINE</span>
                </div>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Base 20
                </span>
              </div>

              <div className="space-y-3">
                {queueLanes.ROUTINE.length === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center py-6">No active Routine requests</div>
                ) : (
                  queueLanes.ROUTINE.map((req) => (
                    <div key={req.id} className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">{req.id}</span>
                          {req.preempted_count > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                              PREEMPTED (+{req.compensation_boost})
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          Score: {req.effective_score}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {req.items[0]?.blood_group} {req.items[0]?.component} — Qty: {req.items[0]?.quantity}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Aging Progress:</span>
                          <span>{req.aging_points} / 50 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-crimson-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (req.aging_points / 50) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATCHING EXPLAINER */}
      {activeTab === 'matching' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Matching Engine Transparent Explainer</h2>
              <p className="text-xs text-slate-500">Dijkstra shortest path algorithm combined with min-heap candidate ranking.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Select Request:</label>
              <select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-xs font-bold rounded-lg px-3 py-1.5 text-slate-900"
              >
                <option value="REQ001">REQ001 (O+ RBC Qty 4 - URGENT)</option>
                <option value="REQ002">REQ002 (A+ RBC Qty 5 - ROUTINE)</option>
                <option value="REQ003">REQ003 (O- RBC Qty 2 - EMERGENCY)</option>
                <option value="REQ005">REQ005 (O- RBC Qty 2 - ROUTINE)</option>
              </select>
            </div>
          </div>

          <MatchDisclaimer />

          {/* Match Results Table */}
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">No candidates found for selected request.</div>
            ) : (
              matches.map((match, idx) => (
                <div key={match.inventory_id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">{match.hospital_name}</span>
                      <span className="font-mono text-xs text-slate-500">({match.inventory_id})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Score</span>
                        <span className="font-mono font-black text-sm text-crimson-600">{match.total_score} / 100</span>
                      </div>
                    </div>
                  </div>

                  {/* Factor Scores Grid */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expiry Score (FEFO)</span>
                      <div className="font-mono font-bold text-slate-900 mb-1">{match.expiry_score} pts</div>
                      <div className="text-[10px] text-slate-500">{match.days_to_expiry} days remaining</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Distance Score (Dijkstra)</span>
                      <div className="font-mono font-bold text-slate-900 mb-1">{match.distance_score} pts</div>
                      <div className="text-[10px] text-slate-500">{match.distance_km} km ({match.shortest_path.join(' → ')})</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quantity Fit Score</span>
                      <div className="font-mono font-bold text-slate-900 mb-1">{match.fit_score} pts</div>
                      <div className="text-[10px] text-slate-500">Allocated {match.allocated_quantity} / {match.quantity_available} avail</div>
                    </div>
                  </div>

                  {/* Verification Checks Ticks */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Blood Group Attribute Match
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Component Match ({match.component})
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ✓ Viable Before Expiry
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EXPIRY TIMELINE & MIN-HEAP */}
      {activeTab === 'expiry' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Expiry Engine FEFO Min-Heap View</h2>
              <p className="text-xs text-slate-500">Sorted by nearest transition time O(log n) transition updates.</p>
            </div>
            <button
              onClick={() => api.triggerExpiryTick().then(fetchData)}
              className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
            >
              Trigger Heap Tick
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Unit ID</th>
                  <th className="p-3">Hospital</th>
                  <th className="p-3">Group / Comp</th>
                  <th className="p-3">Qty Avail</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Current Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {fefoUnits.map((unit) => {
                  let tierColor = 'bg-emerald-100 text-emerald-800';
                  if (unit.tier === 'NEAR_EXPIRY') tierColor = 'bg-amber-100 text-amber-800';
                  if (unit.tier === 'CRITICAL') tierColor = 'bg-rose-100 text-rose-800 font-bold animate-pulse';
                  if (unit.tier === 'EXPIRED') tierColor = 'bg-slate-800 text-white font-bold';

                  return (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{unit.id}</td>
                      <td className="p-3">{unit.hospital_name || unit.hospital_id}</td>
                      <td className="p-3 font-bold">{unit.blood_group} {unit.component}</td>
                      <td className="p-3 font-mono">{unit.available_quantity} units</td>
                      <td className="p-3 font-mono text-slate-600">{unit.expiry_date}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${tierColor}`}>
                          {unit.tier || 'VALID'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BANKER'S AVOIDANCE MATRIX */}
      {activeTab === 'banker' && banker && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Banker's Algorithm Safe State Matrices</h2>
              <p className="text-xs text-slate-500">Multi-resource deadlock avoidance algorithm verification.</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase ${banker.is_safe ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {banker.is_safe ? '✓ SAFE STATE' : '⚠️ UNSAFE STATE'}
            </div>
          </div>

          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs">
            {banker.explanation}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Vector */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">Network Available Resource Vector</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                {Object.entries(banker.available).map(([resKey, qty]) => (
                  <div key={resKey} className="bg-white p-2 rounded border border-slate-200 flex justify-between">
                    <span className="text-slate-500">{resKey}:</span>
                    <span className="font-bold text-slate-900">{qty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Matrix */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">Request Need Matrix</h3>
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(banker.need).map(([reqId, resMap]) => (
                  <div key={reqId} className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900">{reqId}:</span>
                    <span className="text-slate-600">
                      {Object.entries(resMap).map(([k, v]) => `${k}=${v}`).join(', ') || 'No remaining need'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EVENT QUEUE MONITOR */}
      {activeTab === 'events' && eventsData && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Event Queue Bounded-Buffer Monitor</h2>
              <p className="text-xs text-slate-500">Internal Priority Event Queue (Producer-Consumer pattern with back-pressure logging).</p>
            </div>
            <div className="font-mono text-xs bg-slate-100 px-3 py-1 rounded-lg">
              Depth: <span className="font-bold text-crimson-600">{eventsData.stats.activeDepth}</span> / {eventsData.stats.maxBufferDepth}
            </div>
          </div>

          {/* Depth Meter Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-slate-600">
              <span>Buffer Utilization:</span>
              <span>{Math.round((eventsData.stats.activeDepth / eventsData.stats.maxBufferDepth) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-crimson-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (eventsData.stats.activeDepth / eventsData.stats.maxBufferDepth) * 100)}%` }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Payload Details</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Attempts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eventsData.events.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-crimson-600">#{ev.priority_rank}</td>
                    <td className="p-3 font-bold text-slate-900">{ev.type}</td>
                    <td className="p-3 text-slate-600 truncate max-w-xs">{JSON.stringify(ev.payload)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.status === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-3">{ev.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: ACADEMIC TEST SCENARIOS (S1-S6) */}
      {activeTab === 'scenarios' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Academic Demo Scenarios Runner (S1 – S6)</h2>
              <p className="text-xs text-slate-500">Automated verification runner testing engine algorithms and preemption requirements.</p>
            </div>
            <button
              onClick={handleRunAllScenarios}
              disabled={runningScenarios}
              className="bg-crimson-600 hover:bg-crimson-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-crimson-600/30 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" /> {runningScenarios ? 'Running Scenarios...' : 'Run All Scenarios (S1 - S6)'}
            </button>
          </div>

          <div className="space-y-3">
            {scenarioResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Click "Run All Scenarios" to execute test suite S1 to S6 live on the Express backend engines.
              </div>
            ) : (
              scenarioResults.map((res) => (
                <div key={res.scenarioId} className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-slate-500">{res.scenarioId}</span>
                      <h3 className="font-extrabold text-sm text-slate-900">{res.name}</h3>
                    </div>
                    <p className="text-xs text-slate-600">{res.message}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase shrink-0 ${res.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {res.passed ? '✓ PASS' : '❌ FAIL'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: CS CONCEPT MAP */}
      {activeTab === 'concept-map' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-crimson-600" /> Computer Science Viva Concept Map
            </h2>
            <p className="text-xs text-slate-500">Mapping of backend modules to fundamental Computer Science subjects & algorithms.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Engine Name</th>
                  <th className="p-3">CS Subject</th>
                  <th className="p-3">Core Algorithm / Subject Concept</th>
                  <th className="p-3">Source File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Inventory Sync Engine</td>
                  <td className="p-3 font-mono text-crimson-600 font-bold">DBMS</td>
                  <td className="p-3">ACID Transactions, Row-locking (`SELECT ... FOR UPDATE`), Ascending-id Lock Ordering, Ledger Audit Invariants</td>
                  <td className="p-3 font-mono text-slate-500">`src/engines/inventory_sync.engine.ts`</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Matching Engine</td>
                  <td className="p-3 font-mono text-blue-600 font-bold">DSA</td>
                  <td className="p-3">Dijkstra Shortest Path O((V+E) log V), Min-Priority Queue, Transparent Multi-Factor Score Calculation</td>
                  <td className="p-3 font-mono text-slate-500">`src/engines/matching.engine.ts`</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Expiry Engine & Alert Dispatcher</td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">DSA + OS</td>
                  <td className="p-3">Event-driven Min-Heap O(log n), FEFO Surfacing, Producer-Consumer Event Queue with Exponential Backoff</td>
                  <td className="p-3 font-mono text-slate-500">`src/engines/expiry.engine.ts`</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">Request Scheduling Engine</td>
                  <td className="p-3 font-mono text-purple-600 font-bold">OS</td>
                  <td className="p-3">Multilevel Priority Queue, Aging Math, Preemption with Compensation Boost, Banker's Deadlock Avoidance Algorithm</td>
                  <td className="p-3 font-mono text-slate-500">`src/engines/request_scheduling.engine.ts`</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
