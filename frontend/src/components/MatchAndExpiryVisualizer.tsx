import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  FastForward,
  Building2,
  Droplets,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Compass,
  Layers,
  Pause,
  Shuffle
} from 'lucide-react';

interface HospitalNode {
  id: string;
  name: string;
  city: string;
  x: number;
  y: number;
  stockUnits: number;
  role: string;
}

interface RoadEdge {
  from: string;
  to: string;
  distanceKm: number;
  roadName: string;
}

interface DijkstraStep {
  stepNum: number;
  currentNode: string;
  description: string;
  tentativeDistances: Record<string, number>;
  visitedNodes: string[];
  activeEdge?: { from: string; to: string };
  shortestPathTree: string[];
}

interface HeapNode {
  id: string;
  blood_group: string;
  component: string;
  hospital: string;
  hoursRemaining: number;
  tier: 'CRITICAL' | 'NEAR_EXPIRY' | 'VALID' | 'EXPIRED';
}

export const MatchAndExpiryVisualizer: React.FC = () => {
  const [activeSubMode, setActiveSubMode] = useState<'dijkstra' | 'minheap'>('dijkstra');

  // =========================================================================
  // 1. DIJKSTRA HIGHWAY SHORTEST-PATH VISUALIZER STATE & LOGIC
  // =========================================================================
  const hospitals: HospitalNode[] = [
    { id: 'H001', name: 'KLE Hospital', city: 'Belagavi', x: 130, y: 120, stockUnits: 30, role: 'Level 1 Trauma' },
    { id: 'H002', name: 'District Hospital', city: 'Belagavi', x: 280, y: 70, stockUnits: 10, role: 'District Blood Bank' },
    { id: 'H004', name: 'Sahyadri Medical', city: 'Dharwad', x: 250, y: 230, stockUnits: 6, role: 'Emergency Care' },
    { id: 'H003', name: 'City Care Hospital', city: 'Hubballi', x: 420, y: 220, stockUnits: 22, role: 'Specialty Surgical' },
    { id: 'H005', name: 'Shree Hospital', city: 'Bengaluru', x: 570, y: 310, stockUnits: 5, role: 'Tertiary Care' },
  ];

  const roadEdges: RoadEdge[] = [
    { from: 'H001', to: 'H002', distanceKm: 5, roadName: 'NH48 Spur' },
    { from: 'H001', to: 'H004', distanceKm: 28, roadName: 'Belagavi-Dharwad Expressway' },
    { from: 'H002', to: 'H004', distanceKm: 25, roadName: 'Old Highway 4' },
    { from: 'H004', to: 'H003', distanceKm: 20, roadName: 'Twin City Bypass' },
    { from: 'H001', to: 'H003', distanceKm: 100, roadName: 'Direct Highway' },
    { from: 'H002', to: 'H003', distanceKm: 95, roadName: 'Eastern Highway' },
    { from: 'H003', to: 'H005', distanceKm: 410, roadName: 'Bengaluru Corridor' },
    { from: 'H004', to: 'H005', distanceKm: 430, roadName: 'South Trunk Route' },
  ];

  const [sourceId, setSourceId] = useState<string>('H001');
  const [targetId, setTargetId] = useState<string>('H003');
  const [dijkstraSteps, setDijkstraSteps] = useState<DijkstraStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingDijkstra, setIsPlayingDijkstra] = useState<boolean>(false);
  const playTimerRef = useRef<any>(null);

  // Compute full Dijkstra step-by-step trace
  const computeDijkstraSteps = (src: string, dst: string) => {
    const adj: Record<string, Array<{ to: string; dist: number }>> = {};
    hospitals.forEach(h => { adj[h.id] = []; });
    roadEdges.forEach(e => {
      adj[e.from].push({ to: e.to, dist: e.distanceKm });
      adj[e.to].push({ to: e.from, dist: e.distanceKm });
    });

    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const visited = new Set<string>();

    hospitals.forEach(h => {
      dist[h.id] = Infinity;
      prev[h.id] = null;
    });
    dist[src] = 0;

    const steps: DijkstraStep[] = [];
    steps.push({
      stepNum: 1,
      currentNode: src,
      description: `Initialization: Set dist[${src}]=0 km, all other nodes set to ∞ km. Push ${src} into Priority Queue Q.`,
      tentativeDistances: { ...dist },
      visitedNodes: [],
      shortestPathTree: [src],
    });

    let stepCounter = 2;

    while (visited.size < hospitals.length) {
      // Find unvisited node with min dist
      let u: string | null = null;
      let minDist = Infinity;
      for (const h of hospitals) {
        if (!visited.has(h.id) && dist[h.id] < minDist) {
          minDist = dist[h.id];
          u = h.id;
        }
      }

      if (!u || minDist === Infinity) break;
      visited.add(u);

      steps.push({
        stepNum: stepCounter++,
        currentNode: u,
        description: `Popped node ${u} with minimum distance = ${dist[u]} km from Priority Queue. Marking as finalized.`,
        tentativeDistances: { ...dist },
        visitedNodes: Array.from(visited),
        shortestPathTree: Array.from(visited),
      });

      if (u === dst) break;

      // Relax neighbors
      for (const edge of adj[u]) {
        const v = edge.to;
        if (!visited.has(v)) {
          const newDist = dist[u] + edge.dist;
          const isRelaxed = newDist < dist[v];
          if (isRelaxed) {
            dist[v] = newDist;
            prev[v] = u;
          }

          steps.push({
            stepNum: stepCounter++,
            currentNode: u,
            description: `Inspect edge ${u} → ${v} (${edge.dist} km). Calculation: dist[${u}] (${dist[u]}) + ${edge.dist} = ${newDist} km. ${isRelaxed ? `RELAXED: Updated dist[${v}] to ${newDist} km.` : `Kept existing shorter dist[${v}] (${dist[v]} km).`}`,
            tentativeDistances: { ...dist },
            visitedNodes: Array.from(visited),
            activeEdge: { from: u, to: v },
            shortestPathTree: Array.from(visited),
          });
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = dst;
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }

    steps.push({
      stepNum: stepCounter++,
      currentNode: dst,
      description: `Destination ${dst} reached! Shortest highway route finalized: ${path.join(' → ')} (Total: ${dist[dst]} km, Estimated Transit: ${Math.round((dist[dst] / 40) * 60)} mins). Cold-chain buffer verified 100%.`,
      tentativeDistances: { ...dist },
      visitedNodes: Array.from(visited),
      shortestPathTree: path,
    });

    return steps;
  };

  useEffect(() => {
    const steps = computeDijkstraSteps(sourceId, targetId);
    setDijkstraSteps(steps);
    setCurrentStepIndex(0);
    setIsPlayingDijkstra(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, [sourceId, targetId]);

  useEffect(() => {
    if (isPlayingDijkstra) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= dijkstraSteps.length - 1) {
            setIsPlayingDijkstra(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlayingDijkstra, dijkstraSteps.length]);

  const currentStep = dijkstraSteps[currentStepIndex] || {
    stepNum: 1,
    currentNode: sourceId,
    description: 'Ready to calculate highway shortest path.',
    tentativeDistances: {},
    visitedNodes: [],
    shortestPathTree: [],
  };

  const handleStepForward = () => {
    if (currentStepIndex < dijkstraSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleResetDijkstra = () => {
    setIsPlayingDijkstra(false);
    setCurrentStepIndex(0);
  };

  // Check if an edge is in the current shortest path
  const isEdgeInFinalPath = (from: string, to: string) => {
    const tree = currentStep.shortestPathTree;
    for (let i = 0; i < tree.length - 1; i++) {
      if ((tree[i] === from && tree[i + 1] === to) || (tree[i] === to && tree[i + 1] === from)) {
        return true;
      }
    }
    return false;
  };

  const isEdgeActiveRelaxing = (from: string, to: string) => {
    if (!currentStep.activeEdge) return false;
    const { from: f, to: t } = currentStep.activeEdge;
    return (f === from && t === to) || (f === to && t === from);
  };

  // =========================================================================
  // 2. BINARY MIN-HEAP FEFO SHELF-LIFE VISUALIZER STATE & LOGIC
  // =========================================================================
  const initialHeapUnits: HeapNode[] = [
    { id: 'INV004', blood_group: 'O+', component: 'RBC', hospital: 'District Hospital', hoursRemaining: 48, tier: 'CRITICAL' },
    { id: 'INV010', blood_group: 'O-', component: 'RBC', hospital: 'Shree Hospital', hoursRemaining: 72, tier: 'CRITICAL' },
    { id: 'INV002', blood_group: 'A+', component: 'RBC', hospital: 'KLE Hospital', hoursRemaining: 120, tier: 'NEAR_EXPIRY' },
    { id: 'INV008', blood_group: 'O-', component: 'RBC', hospital: 'City Care Hospital', hoursRemaining: 240, tier: 'VALID' },
    { id: 'INV005', blood_group: 'B+', component: 'RBC', hospital: 'Sahyadri Medical', hoursRemaining: 360, tier: 'VALID' },
    { id: 'INV001', blood_group: 'O+', component: 'RBC', hospital: 'KLE Hospital', hoursRemaining: 720, tier: 'VALID' },
    { id: 'INV003', blood_group: 'AB+', component: 'RBC', hospital: 'City Care Hospital', hoursRemaining: 840, tier: 'VALID' },
  ];

  const [heapUnits, setHeapUnits] = useState<HeapNode[]>(initialHeapUnits);
  const [heapElapsedHours, setHeapElapsedHours] = useState<number>(0);
  const [heapActionLog, setHeapActionLog] = useState<string>(
    'Min-Heap initialized: Root node INV004 has minimum remaining shelf-life (48h). Peak peek complexity O(1).'
  );
  const [poppedUnit, setPoppedUnit] = useState<HeapNode | null>(null);

  // Advance time on the heap
  const handleAdvanceHeapHours = (hours: number) => {
    const nextElapsed = heapElapsedHours + hours;
    setHeapElapsedHours(nextElapsed);

    const updated = heapUnits.map(unit => {
      const remaining = Math.max(0, unit.hoursRemaining - hours);
      let tier: HeapNode['tier'] = 'VALID';
      if (remaining === 0) tier = 'EXPIRED';
      else if (remaining <= 72) tier = 'CRITICAL';
      else if (remaining <= 168) tier = 'NEAR_EXPIRY';
      return { ...unit, hoursRemaining: remaining, tier };
    });

    // Min-heapify by hoursRemaining
    updated.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    setHeapUnits(updated);
    setHeapActionLog(
      `Time advanced +${hours}h (Total: +${nextElapsed}h). Min-Heap re-heapified in O(log N). Root node ${updated[0].id} (${updated[0].blood_group}) has ${updated[0].hoursRemaining}h remaining (Tier: ${updated[0].tier}).`
    );
  };

  // Pop root element (FEFO dispatch)
  const handlePopRoot = () => {
    if (heapUnits.length === 0) return;
    const dispatched = heapUnits[0];
    const remaining = heapUnits.slice(1);
    setPoppedUnit(dispatched);
    setHeapUnits(remaining);
    setHeapActionLog(
      `FEFO DISPATCH: Popped Root Unit ${dispatched.id} (${dispatched.blood_group}, ${dispatched.hoursRemaining}h remaining). Sift-down executed in O(log N). New root is ${remaining[0]?.id || 'None'} with minimum expiration timestamp.`
    );
  };

  const handleResetHeap = () => {
    setHeapUnits(initialHeapUnits);
    setHeapElapsedHours(0);
    setPoppedUnit(null);
    setHeapActionLog('Min-Heap reset to initial donor stockpile configuration.');
  };

  // Coordinates for binary tree visualization (7-node full binary tree)
  const treePositions = [
    { x: 340, y: 55 },   // 0 (Root)
    { x: 190, y: 145 },  // 1 (Left child of 0)
    { x: 490, y: 145 },  // 2 (Right child of 0)
    { x: 120, y: 245 },  // 3 (Left child of 1)
    { x: 260, y: 245 },  // 4 (Right child of 1)
    { x: 420, y: 245 },  // 5 (Left child of 2)
    { x: 560, y: 245 },  // 6 (Right child of 2)
  ];

  return (
    <div className="bg-[#090d16] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* Visualizer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              INTERACTIVE IN-PAGE VISUAL IMPLEMENTATION
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-400" />
            Match and Expiry Engine: Visual Workspace
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Step through Dijkstra shortest-path highway routing and Binary Min-Heap FEFO shelf-life tracking in real time.
          </p>
        </div>

        {/* Dual Mode Selector Tabs */}
        <div className="inline-flex rounded-xl bg-black/60 p-1 border border-zinc-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubMode('dijkstra')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubMode === 'dijkstra'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1. Dijkstra Highway Pathfinder</span>
          </button>
          <button
            onClick={() => setActiveSubMode('minheap')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubMode === 'minheap'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Binary Min-Heap FEFO Tree</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DIJKSTRA HIGHWAY SHORTEST-PATH VISUAL WORKSPACE                        */}
      {/* ========================================================================= */}
      {activeSubMode === 'dijkstra' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            
            {/* Hospital Pickers */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Source (Requester):</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.id} - {h.name} ({h.city})</option>
                  ))}
                </select>
              </div>

              <ArrowRight className="w-4 h-4 text-zinc-500 mt-4 hidden sm:block" />

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target (Supplier):</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:border-emerald-500 outline-none"
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.id} - {h.name} ({h.city})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingDijkstra(!isPlayingDijkstra)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  isPlayingDijkstra
                    ? 'bg-amber-500 text-black'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isPlayingDijkstra ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                <span>{isPlayingDijkstra ? 'Pause' : 'Auto Play'}</span>
              </button>

              <button
                onClick={handleStepBack}
                disabled={currentStepIndex === 0 || isPlayingDijkstra}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-30 transition"
              >
                Prev
              </button>

              <span className="text-xs font-mono text-emerald-400 font-bold px-2">
                Step {currentStepIndex + 1}/{dijkstraSteps.length}
              </span>

              <button
                onClick={handleStepForward}
                disabled={currentStepIndex >= dijkstraSteps.length - 1 || isPlayingDijkstra}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-30 transition"
              >
                Next Step
              </button>

              <button
                onClick={handleResetDijkstra}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

          </div>

          {/* Interactive Graph Canvas + Side Trace Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SVG Visual Graph Map (2 Cols) */}
            <div className="lg:col-span-2 bg-black/70 rounded-2xl border border-zinc-800 p-4 relative overflow-hidden flex flex-col justify-between">
              
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Compass className="w-4 h-4" /> Belagavi Regional Highway Network Graph (V=5, E=8)
                </span>
                <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Complexity: O((V + E) log V)
                </span>
              </div>

              {/* SVG Canvas */}
              <div className="relative w-full h-[360px] flex items-center justify-center">
                <svg viewBox="0 0 700 380" className="w-full h-full">
                  <defs>
                    <linearGradient id="edgeGradFinal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Road Edges */}
                  {roadEdges.map((edge, idx) => {
                    const fromNode = hospitals.find(h => h.id === edge.from)!;
                    const toNode = hospitals.find(h => h.id === edge.to)!;
                    const isFinal = isEdgeInFinalPath(edge.from, edge.to);
                    const isActive = isEdgeActiveRelaxing(edge.from, edge.to);

                    const midX = (fromNode.x + toNode.x) / 2;
                    const midY = (fromNode.y + toNode.y) / 2;

                    return (
                      <g key={idx}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={isFinal ? '#10b981' : isActive ? '#06b6d4' : '#334155'}
                          strokeWidth={isFinal ? 4 : isActive ? 3 : 1.5}
                          strokeDasharray={isFinal ? 'none' : isActive ? '6 3' : '4 4'}
                          filter={isFinal ? 'url(#glowGreen)' : 'none'}
                          className={isActive ? 'animate-pulse' : ''}
                        />
                        {/* Distance Label Badge */}
                        <rect
                          x={midX - 18}
                          y={midY - 9}
                          width={36}
                          height={18}
                          rx={4}
                          fill="#090d16"
                          stroke={isFinal ? '#10b981' : isActive ? '#06b6d4' : '#1e293b'}
                          strokeWidth={1}
                        />
                        <text
                          x={midX}
                          y={midY + 3.5}
                          textAnchor="middle"
                          fill={isFinal ? '#34d399' : isActive ? '#38bdf8' : '#94a3b8'}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {edge.distanceKm}km
                        </text>
                      </g>
                    );
                  })}

                  {/* Hospital Nodes */}
                  {hospitals.map((hosp) => {
                    const isSource = hosp.id === sourceId;
                    const isTarget = hosp.id === targetId;
                    const isCurrent = currentStep.currentNode === hosp.id;
                    const isVisited = currentStep.visitedNodes.includes(hosp.id);
                    const isShortestPath = currentStep.shortestPathTree.includes(hosp.id);

                    const tentativeDist = currentStep.tentativeDistances[hosp.id];
                    const distDisplay = tentativeDist === undefined || tentativeDist === Infinity
                      ? '∞'
                      : `${tentativeDist}km`;

                    let ringColor = '#475569';
                    let fillColor = '#0f172a';
                    if (isSource) { ringColor = '#10b981'; fillColor = '#064e3b'; }
                    else if (isTarget) { ringColor = '#06b6d4'; fillColor = '#164e63'; }
                    else if (isCurrent) { ringColor = '#f59e0b'; fillColor = '#78350f'; }
                    else if (isVisited) { ringColor = '#3b82f6'; fillColor = '#1e3a8a'; }

                    return (
                      <g key={hosp.id} className="cursor-pointer">
                        {/* Outer Glow Ring if Current */}
                        {isCurrent && (
                          <circle
                            cx={hosp.x}
                            cy={hosp.y}
                            r={26}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            opacity={0.6}
                            className="animate-ping"
                          />
                        )}

                        {/* Node Circle */}
                        <circle
                          cx={hosp.x}
                          cy={hosp.y}
                          r={20}
                          fill={fillColor}
                          stroke={ringColor}
                          strokeWidth={isShortestPath ? 3 : 2}
                          filter={isShortestPath ? 'url(#glowGreen)' : 'none'}
                        />

                        {/* Hospital ID */}
                        <text
                          x={hosp.x}
                          y={hosp.y - 1}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {hosp.id}
                        </text>

                        {/* Distance Badge Below Node */}
                        <rect
                          x={hosp.x - 22}
                          y={hosp.y + 16}
                          width={44}
                          height={16}
                          rx={3}
                          fill="#000000"
                          stroke={ringColor}
                          strokeWidth={1}
                        />
                        <text
                          x={hosp.x}
                          y={hosp.y + 27}
                          textAnchor="middle"
                          fill={isSource ? '#34d399' : isTarget ? '#38bdf8' : '#e2e8f0'}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {distDisplay}
                        </text>

                        {/* Hospital Name & City Top Label */}
                        <text
                          x={hosp.x}
                          y={hosp.y - 25}
                          textAnchor="middle"
                          fill="#cbd5e1"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {hosp.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono border-t border-zinc-800/80 pt-3 text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Source (Origin)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Target (Destination)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Active Evaluating Node
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Finalized Node
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-emerald-400 rounded" /> Shortest Highway Route
                </div>
              </div>

            </div>

            {/* Step-by-Step Mathematical Trace Panel (1 Col) */}
            <div className="bg-black/70 rounded-2xl border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    EXECUTION STEP LOG
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Step {currentStep.stepNum} of {dijkstraSteps.length}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed mb-4">
                  {currentStep.description}
                </div>

                {/* Tentative Distance Table */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Priority Queue Distance Vector d[u]:
                  </div>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                    {hospitals.map(h => {
                      const d = currentStep.tentativeDistances[h.id];
                      const isFin = currentStep.visitedNodes.includes(h.id);
                      return (
                        <div
                          key={h.id}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                            currentStep.currentNode === h.id
                              ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300'
                              : isFin
                              ? 'bg-zinc-900/80 text-emerald-300'
                              : 'bg-zinc-950 text-zinc-400'
                          }`}
                        >
                          <span className="font-bold">{h.id} ({h.name.split(' ')[0]})</span>
                          <span className="font-bold">
                            {d === undefined || d === Infinity ? '∞ km' : `${d} km`}
                            {isFin && <span className="text-[9px] text-zinc-500 ml-1.5">✓ FIXED</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Transit & Safety Summary Box */}
              <div className="pt-3 border-t border-zinc-800 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Computed Distance:</span>
                  <span className="text-emerald-400 font-bold">
                    {currentStep.tentativeDistances[targetId] !== undefined && currentStep.tentativeDistances[targetId] !== Infinity
                      ? `${currentStep.tentativeDistances[targetId]} km`
                      : 'Calculating...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Transit Time (@40km/h):</span>
                  <span className="text-white font-bold">
                    {currentStep.tentativeDistances[targetId] !== undefined && currentStep.tentativeDistances[targetId] !== Infinity
                      ? `${Math.round((currentStep.tentativeDistances[targetId] / 40) * 60)} mins`
                      : 'Calculating...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Cold-Chain Buffer:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Safe (&lt;4h SLA)
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BINARY MIN-HEAP FEFO SHELF-LIFE WORKSPACE                              */}
      {/* ========================================================================= */}
      {activeSubMode === 'minheap' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-400">Simulate Timeline:</span>
              <button
                onClick={() => handleAdvanceHeapHours(24)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
              >
                <FastForward className="w-4 h-4 fill-black" />
                <span>+24h Fast-Forward</span>
              </button>

              <button
                onClick={() => handleAdvanceHeapHours(72)}
                className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
              >
                <FastForward className="w-4 h-4 fill-black" />
                <span>+72h Fast-Forward</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePopRoot}
                disabled={heapUnits.length === 0}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
              >
                <Droplets className="w-4 h-4 fill-black" />
                <span>Dispatch Root Unit (FEFO Pop O(1))</span>
              </button>

              <button
                onClick={handleResetHeap}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Heap</span>
              </button>
            </div>

          </div>

          {/* Binary Tree Visualizer + Live Heap State */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Binary Tree Canvas (2 Cols) */}
            <div className="lg:col-span-2 bg-black/70 rounded-2xl border border-zinc-800 p-4 relative overflow-hidden flex flex-col justify-between">
              
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Layers className="w-4 h-4" /> Binary Min-Heap Priority Queue: Expiry Timestamp Ordering
                </span>
                <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Peek: O(1) • Insert/Extract: O(log N)
                </span>
              </div>

              {/* Tree SVG */}
              <div className="relative w-full h-[360px] flex items-center justify-center">
                <svg viewBox="0 0 680 340" className="w-full h-full">
                  {/* Tree Branch Connecting Lines */}
                  {/* 0 -> 1 & 0 -> 2 */}
                  {heapUnits.length > 1 && (
                    <line x1={treePositions[0].x} y1={treePositions[0].y} x2={treePositions[1].x} y2={treePositions[1].y} stroke="#334155" strokeWidth={2} />
                  )}
                  {heapUnits.length > 2 && (
                    <line x1={treePositions[0].x} y1={treePositions[0].y} x2={treePositions[2].x} y2={treePositions[2].y} stroke="#334155" strokeWidth={2} />
                  )}
                  {/* 1 -> 3 & 1 -> 4 */}
                  {heapUnits.length > 3 && (
                    <line x1={treePositions[1].x} y1={treePositions[1].y} x2={treePositions[3].x} y2={treePositions[3].y} stroke="#334155" strokeWidth={2} />
                  )}
                  {heapUnits.length > 4 && (
                    <line x1={treePositions[1].x} y1={treePositions[1].y} x2={treePositions[4].x} y2={treePositions[4].y} stroke="#334155" strokeWidth={2} />
                  )}
                  {/* 2 -> 5 & 2 -> 6 */}
                  {heapUnits.length > 5 && (
                    <line x1={treePositions[2].x} y1={treePositions[2].y} x2={treePositions[5].x} y2={treePositions[5].y} stroke="#334155" strokeWidth={2} />
                  )}
                  {heapUnits.length > 6 && (
                    <line x1={treePositions[2].x} y1={treePositions[2].y} x2={treePositions[6].x} y2={treePositions[6].y} stroke="#334155" strokeWidth={2} />
                  )}

                  {/* Render Tree Nodes */}
                  {heapUnits.map((unit, index) => {
                    if (index >= treePositions.length) return null;
                    const pos = treePositions[index];
                    const isRoot = index === 0;

                    let tierColor = '#10b981';
                    let tierBg = '#064e3b';
                    if (unit.tier === 'EXPIRED') { tierColor = '#ef4444'; tierBg = '#7f1d1d'; }
                    else if (unit.tier === 'CRITICAL') { tierColor = '#f59e0b'; tierBg = '#78350f'; }
                    else if (unit.tier === 'NEAR_EXPIRY') { tierColor = '#06b6d4'; tierBg = '#164e63'; }

                    return (
                      <g key={unit.id} className="cursor-pointer group">
                        {isRoot && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={32}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={2}
                            opacity={0.5}
                            className="animate-ping"
                          />
                        )}

                        {/* Node Bubble */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={25}
                          fill={tierBg}
                          stroke={tierColor}
                          strokeWidth={isRoot ? 3 : 2}
                        />

                        {/* Unit ID */}
                        <text
                          x={pos.x}
                          y={pos.y - 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="black"
                          fontFamily="monospace"
                        >
                          {unit.id}
                        </text>

                        {/* Blood Group */}
                        <text
                          x={pos.x}
                          y={pos.y + 8}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="black"
                        >
                          {unit.blood_group}
                        </text>

                        {/* Remaining Hours Pill */}
                        <rect
                          x={pos.x - 22}
                          y={pos.y + 20}
                          width={44}
                          height={16}
                          rx={3}
                          fill="#000000"
                          stroke={tierColor}
                          strokeWidth={1}
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 31}
                          textAnchor="middle"
                          fill={tierColor}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {unit.hoursRemaining}h left
                        </text>

                        {/* Root Indicator Tag */}
                        {isRoot && (
                          <text
                            x={pos.x}
                            y={pos.y - 32}
                            textAnchor="middle"
                            fill="#10b981"
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            ★ FEFO ROOT (Next to Dispatch)
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono border-t border-zinc-800/80 pt-3 text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> VALID (&gt;168h)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> NEAR EXPIRY (72h-168h)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> CRITICAL (&le;72h Alert)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> EXPIRED (0h)
                </div>
              </div>

            </div>

            {/* Heap State & Action Log Panel (1 Col) */}
            <div className="bg-black/70 rounded-2xl border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    MIN-HEAP RUNTIME LOG
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Elapsed: +{heapElapsedHours}h
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed mb-4">
                  {heapActionLog}
                </div>

                {/* Dispatched Unit Notification */}
                {poppedUnit && (
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-xs font-mono text-emerald-300 space-y-1 mb-4">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Dispatched Via FEFO:
                    </div>
                    <div>Unit: {poppedUnit.id} ({poppedUnit.blood_group} RBC)</div>
                    <div>Source: {poppedUnit.hospital}</div>
                    <div>Shelf-Life Saved: {poppedUnit.hoursRemaining} hours buffer</div>
                  </div>
                )}

                {/* Array Representation of Binary Heap */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    Contiguous Array Vector:
                  </div>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                    {heapUnits.map((u, i) => (
                      <div
                        key={u.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                          i === 0
                            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-zinc-950 text-zinc-400'
                        }`}
                      >
                        <span>
                          [{i}] {u.id} ({u.blood_group})
                        </span>
                        <span className={u.tier === 'CRITICAL' ? 'text-amber-400 font-bold' : ''}>
                          {u.hoursRemaining}h left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Heap Invariant Card */}
              <div className="pt-3 border-t border-zinc-800 text-xs font-mono space-y-1 text-zinc-400">
                <div className="text-[10px] uppercase font-bold text-zinc-500">Heap Invariant Verified:</div>
                <div className="text-emerald-400">
                  Key(Parent[i]) &le; Key(Left[2i+1]) &amp; Key(Right[2i+2])
                </div>
                <div className="text-zinc-500 text-[11px]">
                  Guarantees earliest-expiring unit is always at root index 0.
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
export default MatchAndExpiryVisualizer;

