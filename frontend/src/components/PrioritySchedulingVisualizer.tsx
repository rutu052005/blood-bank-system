import React, { useState } from 'react';
import {
  Layers,
  Flame,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Activity,
  CheckCircle2,
  RotateCcw,
  TrendingUp,
  Info,
  Sliders,
  Zap,
} from 'lucide-react';

interface SimulatedPatient {
  id: string;
  patientName: string;
  condition: string;
  hospital: string;
  bloodGroup: string;
  units: number;
  lane: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  baseScore: number;
  hoursWaited: number;
  preemptedCount: number;
  promoted: boolean;
}

export const PrioritySchedulingVisualizer: React.FC = () => {
  // Initial demo patients
  const initialPatients: SimulatedPatient[] = [
    {
      id: 'REQ-01',
      patientName: 'Vikram Joshi (ICU)',
      condition: 'Multiple Trauma / Arterial Bleed',
      hospital: 'District Hospital',
      bloodGroup: 'O- Negative',
      units: 2,
      lane: 'EMERGENCY',
      baseScore: 100,
      hoursWaited: 0.5,
      preemptedCount: 0,
      promoted: false,
    },
    {
      id: 'REQ-02',
      patientName: 'Anita Sharma',
      condition: 'Scheduled Cardio-Vascular Surgery',
      hospital: 'KLE Hospital',
      bloodGroup: 'A+ Positive',
      units: 3,
      lane: 'URGENT',
      baseScore: 50,
      hoursWaited: 4,
      preemptedCount: 0,
      promoted: false,
    },
    {
      id: 'REQ-03',
      patientName: 'Ravi Kumar',
      condition: 'Elective Knee Arthroscopy',
      hospital: 'Sahyadri Medical Center',
      bloodGroup: 'B+ Positive',
      units: 2,
      lane: 'ROUTINE',
      baseScore: 10,
      hoursWaited: 8,
      preemptedCount: 0,
      promoted: false,
    },
    {
      id: 'REQ-04',
      patientName: 'Meera Deshmukh',
      condition: 'Chronic Anemia Blood Transfusion',
      hospital: 'City Care Hospital',
      bloodGroup: 'O+ Positive',
      units: 1,
      lane: 'ROUTINE',
      baseScore: 10,
      hoursWaited: 24,
      preemptedCount: 0,
      promoted: false,
    },
  ];

  const [patients, setPatients] = useState<SimulatedPatient[]>(initialPatients);
  const [logMessages, setLogMessages] = useState<string[]>([
    'Triage queues initialized. All patient requests assigned by medical urgency.',
    'Dynamic Aging active: Every 1 hour of waiting awards +1.5 bonus points.',
  ]);

  // Interactive Custom Calculator Sliders
  const [calcPriority, setCalcPriority] = useState<'EMERGENCY' | 'URGENT' | 'ROUTINE'>('ROUTINE');
  const [calcHours, setCalcHours] = useState<number>(14);
  const [calcPreempted, setCalcPreempted] = useState<number>(1);

  // Compute Effective Score
  const getEffectiveScore = (p: SimulatedPatient) => {
    const agingPoints = Math.round(p.hoursWaited * 1.5);
    const compensation = p.preemptedCount * 15;
    return p.baseScore + agingPoints + compensation;
  };

  // Calculator effective score
  const calcBase = calcPriority === 'EMERGENCY' ? 100 : calcPriority === 'URGENT' ? 50 : 10;
  const calcScore = calcBase + Math.round(calcHours * 1.5) + calcPreempted * 15;
  const calcPromoted = calcPriority === 'ROUTINE' && calcScore >= 50;

  // Simulate +4 Hours Waiting (Aging Math)
  const handleAdvanceTime = () => {
    setPatients((prev) =>
      prev.map((p) => {
        const newHours = p.hoursWaited + 4;
        const newScore = p.baseScore + Math.round(newHours * 1.5) + p.preemptedCount * 15;
        let newLane = p.lane;
        let newlyPromoted = p.promoted;

        if (p.lane === 'ROUTINE' && newScore >= 50) {
          newLane = 'URGENT';
          newlyPromoted = true;
        }

        return {
          ...p,
          hoursWaited: newHours,
          lane: newLane,
          promoted: newlyPromoted,
        };
      })
    );

    setLogMessages((prev) => [
      `[AGING TICK +4h] Waiting times updated. Routine requests earned +6 aging points. Patients with score ≥ 50 automatically promoted to Urgent lane to prevent starvation!`,
      ...prev.slice(0, 4),
    ]);
  };

  // Simulate Trauma Emergency Preemption
  const handleSimulatePreemption = () => {
    const newEmergencyId = `EMG-${Math.floor(Math.random() * 800 + 100)}`;
    const newEmergencyPatient: SimulatedPatient = {
      id: newEmergencyId,
      patientName: 'Incoming Trauma (Code-Red)',
      condition: 'Massive Hemorrhage / Ambulance En Route',
      hospital: 'District Hospital',
      bloodGroup: 'O- Negative',
      units: 2,
      lane: 'EMERGENCY',
      baseScore: 100,
      hoursWaited: 0.1,
      preemptedCount: 0,
      promoted: false,
    };

    setPatients((prev) => {
      // Find a routine/urgent patient to bump/preempt
      let bumpedOne = false;
      const updated = prev.map((p) => {
        if (!bumpedOne && (p.lane === 'ROUTINE' || p.lane === 'URGENT')) {
          bumpedOne = true;
          return {
            ...p,
            preemptedCount: p.preemptedCount + 1,
            lane: 'URGENT' as const, // elevated
          };
        }
        return p;
      });

      return [newEmergencyPatient, ...updated];
    });

    setLogMessages((prev) => [
      `[PREEMPTION APPLIED] Emergency request ${newEmergencyId} preempted standard queue. Bumped patient received +15 Compensation Boost and priority queue head position!`,
      ...prev.slice(0, 4),
    ]);
  };

  // Reset
  const handleReset = () => {
    setPatients(initialPatients);
    setLogMessages([
      'Queues reset to baseline triage status.',
      'Dynamic Aging active: Every 1 hour of waiting awards +1.5 bonus points.',
    ]);
  };

  // Group patients by lane
  const emergencyPatients = patients.filter((p) => p.lane === 'EMERGENCY');
  const urgentPatients = patients.filter((p) => p.lane === 'URGENT');
  const routinePatients = patients.filter((p) => p.lane === 'ROUTINE');

  return (
    <div className="bg-[#090d16] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-400">
              OPERATING SYSTEMS (OS) MODULE
            </span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-400" />
            Priority Scheduling Engine: 3-Tier ER Triage Queue (MLFQ)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            How the system fairly allocates scarce blood units between code-red emergencies, urgent surgeries, and routine requests.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAdvanceTime}
            className="px-3.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>+4 Hours Wait (Aging Math)</span>
          </button>

          <button
            onClick={handleSimulatePreemption}
            className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-mono text-xs font-black flex items-center gap-1.5 shadow-lg shadow-rose-500/25 transition cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 fill-black" />
            <span>Simulate Emergency Preemption</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Interactive Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LANE 0: EMERGENCY */}
        <div className="bg-rose-950/20 border border-rose-800/50 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span className="text-xs font-black text-rose-300 font-mono uppercase">
                  LANE 0: CODE-RED EMERGENCY
                </span>
              </div>
              <span className="text-[10px] font-mono bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded font-bold">
                Base 100
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug">
              Life-or-death trauma, arterial bleed, cardiac arrest. Immediate preemption rights.
            </p>

            {/* Patients list */}
            <div className="space-y-2.5 mt-3">
              {emergencyPatients.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs font-mono italic">
                  No active code-red emergency requests
                </div>
              ) : (
                emergencyPatients.map((p) => {
                  const score = getEffectiveScore(p);
                  return (
                    <div
                      key={p.id}
                      className="bg-black/70 border border-rose-500/50 rounded-xl p-3 shadow-md space-y-1.5 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                            <span>{p.patientName}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400">{p.condition}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-rose-400 font-mono font-black text-xs block">
                            {score} pts
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {p.bloodGroup}
                          </span>
                        </div>
                      </div>

                      <div className="text-[9px] font-mono text-zinc-400 flex items-center justify-between border-t border-zinc-900 pt-1">
                        <span>{p.hospital}</span>
                        <span className="text-rose-400 font-bold">{p.units} units required</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[9px] font-mono text-rose-300/80 bg-rose-950/60 p-2 rounded-lg border border-rose-900/40">
            ⚡ Rule: Bypasses waiting queue and executes instant courier hold.
          </div>
        </div>

        {/* LANE 1: URGENT */}
        <div className="bg-amber-950/20 border border-amber-800/50 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-black text-amber-300 font-mono uppercase">
                  LANE 1: URGENT CARE
                </span>
              </div>
              <span className="text-[10px] font-mono bg-amber-900/80 text-amber-200 px-2 py-0.5 rounded font-bold">
                Base 50
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug">
              Scheduled surgeries, chemotherapy, obstetrics. Needed within 4–24 hours.
            </p>

            {/* Patients list */}
            <div className="space-y-2.5 mt-3">
              {urgentPatients.map((p) => {
                const score = getEffectiveScore(p);
                return (
                  <div
                    key={p.id}
                    className="bg-black/70 border border-amber-500/40 rounded-xl p-3 shadow-md space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-amber-400" />
                          <span>{p.patientName}</span>
                          {p.promoted && (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[8px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                              PROMOTED
                            </span>
                          )}
                          {p.preemptedCount > 0 && (
                            <span className="bg-amber-900/80 text-amber-300 text-[8px] font-bold px-1.5 py-0.2 rounded-full">
                              +{p.preemptedCount * 15} BOOST
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400">{p.condition}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 font-mono font-black text-xs block">
                          {score} pts
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {p.bloodGroup}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-zinc-400 flex items-center justify-between border-t border-zinc-900 pt-1">
                      <span>Waited: {p.hoursWaited}h</span>
                      <span className="text-amber-400 font-bold">{p.units} units</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[9px] font-mono text-amber-300/80 bg-amber-950/60 p-2 rounded-lg border border-amber-900/40">
            ⏳ Rule: Automatically receives routine patients promoted by waiting aging.
          </div>
        </div>

        {/* LANE 2: ROUTINE */}
        <div className="bg-emerald-950/15 border border-emerald-800/40 rounded-2xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-black text-emerald-300 font-mono uppercase">
                  LANE 2: ROUTINE & ELECTIVE
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded font-bold">
                Base 10
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 leading-snug">
              Elective hip/knee surgeries, mild anemia. Needed in 24–72 hours.
            </p>

            {/* Patients list */}
            <div className="space-y-2.5 mt-3">
              {routinePatients.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs font-mono italic">
                  All routine requests have graduated to Urgent Lane via Aging Math!
                </div>
              ) : (
                routinePatients.map((p) => {
                  const score = getEffectiveScore(p);
                  return (
                    <div
                      key={p.id}
                      className="bg-black/70 border border-zinc-800 hover:border-emerald-500/40 rounded-xl p-3 shadow-md space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-extrabold text-white text-xs">
                            {p.patientName}
                          </div>
                          <div className="text-[10px] text-zinc-400">{p.condition}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-mono font-black text-xs block">
                            {score} pts
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {p.bloodGroup}
                          </span>
                        </div>
                      </div>

                      <div className="text-[9px] font-mono text-zinc-400 flex items-center justify-between border-t border-zinc-900 pt-1">
                        <span>Waited: {p.hoursWaited}h (+{Math.round(p.hoursWaited * 1.5)} pts)</span>
                        <span className="text-zinc-300 font-bold">{p.units} units</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[9px] font-mono text-emerald-300/80 bg-emerald-950/60 p-2 rounded-lg border border-emerald-900/40">
            🌱 Starvation Rule: Every hour waited gives +1.5 pts until promoted to Lane 1.
          </div>
        </div>

      </div>

      {/* Live Trace Logs */}
      <div className="p-3.5 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-teal-300 space-y-1">
        <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center justify-between pb-1 border-b border-zinc-900">
          <span>LIVE SCHEDULER TRACE LOG</span>
          <span className="text-teal-400">STARVATION INDEX: 0 (ZERO STARVATION)</span>
        </div>
        {logMessages.map((msg, i) => (
          <div key={i} className={i === 0 ? 'text-teal-300 font-semibold' : 'text-zinc-500'}>
            &gt; {msg}
          </div>
        ))}
      </div>

      {/* Interactive Priority Calculator Slider Tool */}
      <div className="bg-black/60 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Interactive Priority Score Calculator (Test Any Patient Scenario)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Formula: Base + (Hours × 1.5) + (Preemptions × 15)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Input 1: Priority Category */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-zinc-300 block">
              1. Patient Clinical Category:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['EMERGENCY', 'URGENT', 'ROUTINE'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCalcPriority(cat)}
                  className={`py-2 px-1 rounded-lg text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                    calcPriority === cat
                      ? cat === 'EMERGENCY'
                        ? 'bg-rose-500 text-black font-black'
                        : cat === 'URGENT'
                        ? 'bg-amber-500 text-black font-black'
                        : 'bg-emerald-500 text-black font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat === 'EMERGENCY' ? '🔴 Code-Red' : cat === 'URGENT' ? '🟡 Urgent' : '🟢 Routine'}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-zinc-500 block">
              Base Points: <strong className="text-white">{calcBase} pts</strong>
            </span>
          </div>

          {/* Input 2: Hours Waited Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-300">2. Hours Waited in Queue:</span>
              <span className="text-teal-400 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                {calcHours} hrs (+{Math.round(calcHours * 1.5)} pts)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="48"
              value={calcHours}
              onChange={(e) => setCalcHours(parseInt(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
              <span>0h (Just arrived)</span>
              <span>24h (1 day)</span>
              <span>48h (2 days)</span>
            </div>
          </div>

          {/* Input 3: Preempted Boost Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-300">3. Times Bumped by Emergency:</span>
              <span className="text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                {calcPreempted} times (+{calcPreempted * 15} pts)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={calcPreempted}
              onChange={(e) => setCalcPreempted(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
              <span>0 times</span>
              <span>1 (+15 pts)</span>
              <span>2 (+30 pts)</span>
              <span>3 (+45 pts)</span>
            </div>
          </div>
        </div>

        {/* Output Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-teal-950/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400">
              Calculated Queue Priority
            </div>
            <div className="text-2xl font-black font-mono text-teal-300 flex items-center gap-2">
              <span>{calcScore} Effective Points</span>
              {calcPromoted && (
                <span className="text-xs bg-emerald-500 text-black px-2 py-0.5 rounded-full font-black animate-pulse">
                  🎉 AUTOMATICALLY PROMOTED TO URGENT!
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-300">
              {calcPriority === 'EMERGENCY'
                ? 'Dispatched immediately. No queue delay allowed.'
                : calcPromoted
                ? 'Patient waited long enough to overcome routine status. Promoted to prevent starvation!'
                : calcPriority === 'URGENT'
                ? 'High priority. Assigned to next available transport courier.'
                : 'Routine queue. Will gain priority automatically as waiting time advances.'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono text-zinc-500 uppercase">Target Delivery Lane</div>
            <div className="text-sm font-black font-mono mt-0.5" style={{
              color: calcPriority === 'EMERGENCY' ? '#f43f5e' : (calcPromoted || calcPriority === 'URGENT') ? '#f59e0b' : '#10b981'
            }}>
              {calcPriority === 'EMERGENCY' ? '🔴 Lane 0 (Emergency)' : (calcPromoted || calcPriority === 'URGENT') ? '🟡 Lane 1 (Urgent Care)' : '🟢 Lane 2 (Routine)'}
            </div>
          </div>
        </div>
      </div>

      {/* Friendly Translation Glossary (OS Terms -> Hospital Terms) */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
        <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-teal-400" />
          <span>Quick Translation: Operating System Terms vs Hospital Terms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono pt-1">
          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-teal-400 font-bold block text-[11px]">MLFQ (Multilevel Feedback Queue)</span>
            <span className="text-zinc-400 text-[10px] block mt-1">Hospital: 3-tier ER Triage Lanes (Emergency, Urgent, Routine).</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-rose-400 font-bold block text-[11px]">Preemption</span>
            <span className="text-zinc-400 text-[10px] block mt-1">Hospital: Emergency accident patient cuts the line ahead of elective surgery.</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-amber-400 font-bold block text-[11px]">Aging Math (+1.5 pts/hr)</span>
            <span className="text-zinc-400 text-[10px] block mt-1">Hospital: Waiting time bonus so older requests are never forgotten.</span>
          </div>
          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-emerald-400 font-bold block text-[11px]">Starvation Prevention</span>
            <span className="text-zinc-400 text-[10px] block mt-1">Hospital: Guarantee that no patient is delayed indefinitely.</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PrioritySchedulingVisualizer;
