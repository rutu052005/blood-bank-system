import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Pause,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  Droplets,
  Building2,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SimStep {
  stepIndex: number;
  title: string;
  description: string;
  h1Action: string;
  h2Action: string;
  dbStock: number;
  h1Allocated: number;
  h2Allocated: number;
  lockStatus: 'UNLOCKED' | 'LOCKED_BY_H1' | 'LOCKED_BY_H2';
  dbmsDecision: string;
}

export const DBMSTransactionVisualizer: React.FC = () => {
  // Mode: Safe (with DBMS locks) vs Unsafe (without DBMS locks)
  const [mode, setMode] = useState<'safe' | 'unsafe'>('safe');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // --------------------------------------------------------------------------
  // SCENARIO 1: WITH DBMS CONCURRENCY LOCKS (SAFE & ATOMIC)
  // --------------------------------------------------------------------------
  const safeSteps: SimStep[] = [
    {
      stepIndex: 0,
      title: 'Initial State: Blood Bank Shelf',
      description: 'The blood bank in Belagavi has exactly 3 units of rare O- Negative blood in stock.',
      h1Action: 'Idle (Preparing Emergency Request for 2 units)',
      h2Action: 'Idle (Preparing Surgery Request for 2 units)',
      dbStock: 3,
      h1Allocated: 0,
      h2Allocated: 0,
      lockStatus: 'UNLOCKED',
      dbmsDecision: 'Database in steady state. Total O- stock = 3 units.',
    },
    {
      stepIndex: 1,
      title: 'Step 1: Hospital 1 Acquires Exclusive Mutex Lock',
      description: 'Hospital 1 (KLE Trauma) submits request for 2 units. DBMS starts Transaction T1 and locks the O- blood row (SELECT ... FOR UPDATE).',
      h1Action: 'Acquires Exclusive Lock on O- inventory row',
      h2Action: 'Submits concurrent request for 2 units',
      dbStock: 3,
      h1Allocated: 0,
      h2Allocated: 0,
      lockStatus: 'LOCKED_BY_H1',
      dbmsDecision: '🔒 ROW LOCKED by T1. Hospital 2 is queued to prevent dirty reads.',
    },
    {
      stepIndex: 2,
      title: 'Step 2: DBMS Serializes Hospital 2 (Lock Wait)',
      description: 'Hospital 2 attempts to modify the same blood stock at the same second. DBMS Concurrency Control intercepts and forces Hospital 2 to WAIT.',
      h1Action: 'Verifying stock invariant (3 >= 2: VALID)',
      h2Action: 'BLOCKED in Lock Wait Queue',
      dbStock: 3,
      h1Allocated: 0,
      h2Allocated: 0,
      lockStatus: 'LOCKED_BY_H1',
      dbmsDecision: '⏳ CONFLICT PREVENTED: Hospital 2 blocked until T1 completes.',
    },
    {
      stepIndex: 3,
      title: 'Step 3: Hospital 1 Commits (Stock Deducted: 3 - 2 = 1)',
      description: 'T1 deducts 2 units, records audit ledger, and executes COMMIT. Lock is released. Database stock updates from 3 to 1 unit.',
      h1Action: 'COMMITTED! 2 Units Successfully Dispatched',
      h2Action: 'Woken up from wait queue; Reads committed stock = 1 unit',
      dbStock: 1,
      h1Allocated: 2,
      h2Allocated: 0,
      lockStatus: 'UNLOCKED',
      dbmsDecision: '✅ T1 COMMITTED. Stock safely reduced to 1 unit. Mutex released.',
    },
    {
      stepIndex: 4,
      title: 'Step 4: Hospital 2 Invariant Check & Safe Abort',
      description: 'Hospital 2 resumes execution. DBMS checks requested units (2) against remaining stock (1). Stock is insufficient!',
      h1Action: 'Transfusion in progress with guaranteed blood',
      h2Action: 'Insufficient stock detected (1 < 2)',
      dbStock: 1,
      h1Allocated: 2,
      h2Allocated: 0,
      lockStatus: 'UNLOCKED',
      dbmsDecision: '🛑 TRANSACTION ROLLBACK: Request rejected safely. Zero stock corruption.',
    },
    {
      stepIndex: 5,
      title: 'Final State: 100% Data Integrity Preserved',
      description: 'Hospital 1 got 2 units. Hospital 2 was safely informed so they can reroute. Stock remains 1 unit (no negative stock, no double-allocation!).',
      h1Action: '2 Units Received and Transfused',
      h2Action: 'Safely redirected to nearest alternate donor node',
      dbStock: 1,
      h1Allocated: 2,
      h2Allocated: 0,
      lockStatus: 'UNLOCKED',
      dbmsDecision: '🏆 SUCCESS: Zero overdraft, zero race conditions, zero lost updates.',
    },
  ];

  // --------------------------------------------------------------------------
  // SCENARIO 2: WITHOUT DBMS LOCKS (UNSAFE - DIRTY READ & OVERDRAFT)
  // --------------------------------------------------------------------------
  const unsafeSteps: SimStep[] = [
    {
      stepIndex: 0,
      title: 'Initial State: Blood Bank Shelf',
      description: 'The blood bank in Belagavi has exactly 3 units of O- Negative blood in stock.',
      h1Action: 'Idle (Preparing Request for 2 units)',
      h2Action: 'Idle (Preparing Request for 2 units)',
      dbStock: 3,
      h1Allocated: 0,
      h2Allocated: 0,
      lockStatus: 'UNLOCKED',
      dbmsDecision: 'No concurrency control enabled. Risk of race condition high.',
    },
    {
      stepIndex: 1,
      title: 'Step 1: Simultaneous Unlocked Reads (Dirty Read)',
      description: 'Both Hospital 1 and Hospital 2 query the database at the same millisecond. BOTH see Available = 3 units!',
      h1Action: 'Reads stock: Sees 3 units available',
      h2Action: 'Reads stock: Sees 3 units available (RACE CONDITION)',
      dbStock: 3,
      h1Allocated: 0,
      h2Allocated: 0,
      lockStatus: 'UNLOCKED',
      dbmsDecision: '⚠️ DIRTY READ: Both hospitals think they have exclusive access to all 3 units.',
    },
    {
      stepIndex: 2,
      title: 'Step 2: Uncoordinated Parallel Approvals',
      description: 'Hospital 1 assumes it can take 2 units. Hospital 2 ALSO assumes it can take 2 units! Neither knows about the other.',
      h1Action: 'Approving 2 units for patient A',
      h2Action: 'Approving 2 units for patient B',
      dbStock: 3,
      h1Allocated: 2,
      h2Allocated: 2,
      lockStatus: 'UNLOCKED',
      dbmsDecision: '⚠️ OVER-ALLOCATION: 4 units promised to patients when only 3 physically exist!',
    },
    {
      stepIndex: 3,
      title: 'Step 3: Conflicting Database Overwrite (Lost Update)',
      description: 'Hospital 1 writes stock = 3 - 2 = 1. Milliseconds later, Hospital 2 also writes stock = 3 - 2 = 1 (or 1 - 2 = -1)!',
      h1Action: 'Writes stock = 1 unit',
      h2Action: 'Overwrites stock = -1 (NEGATIVE CORRUPTION)',
      dbStock: -1,
      h1Allocated: 2,
      h2Allocated: 2,
      lockStatus: 'UNLOCKED',
      dbmsDecision: '💥 LOST UPDATE ANOMALY: Stock corrupted to negative balance (-1 unit)!',
    },
    {
      stepIndex: 4,
      title: 'Step 4: Fatal Clinical Crisis',
      description: 'Two ambulances arrive at the blood bank for 4 total units. The blood bank only has 3 units! One patient receives NO blood.',
      h1Action: 'Received 2 units at hospital',
      h2Action: 'Ambulance arrived: Blood bank EMPTY for Patient B!',
      dbStock: -1,
      h1Allocated: 2,
      h2Allocated: 0,
      lockStatus: 'UNLOCKED',
      dbmsDecision: '🚨 CATASTROPHIC FAILURE: Double allocation caused critical patient emergency.',
    },
  ];

  const steps = mode === 'safe' ? safeSteps : unsafeSteps;
  const currentStepData = steps[Math.min(currentStep, steps.length - 1)];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 2500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, steps.length]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="bg-[#090d16] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* ==================================================================== */}
      {/* HEADER & MODE SWITCHER                                               */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
              DBMS CORE ENGINE (INTERACTIVE SIMULATOR)
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Concurrent Blood Booking & Lock Simulator
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Demonstrates how database Mutex Row Locks prevent Lost Updates, Double Allocations, and Negative Stock when two hospitals request blood at the same second.
          </p>
        </div>

        {/* Safe vs Unsafe Mode Switcher */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-2xl border border-zinc-800 self-start md:self-auto">
          <button
            onClick={() => {
              setMode('safe');
              handleReset();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'safe'
                ? 'bg-emerald-500 text-black shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>WITH DBMS Lock (Safe)</span>
          </button>
          <button
            onClick={() => {
              setMode('unsafe');
              handleReset();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'unsafe'
                ? 'bg-rose-600 text-white shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>WITHOUT Lock (Anomaly)</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* INTERACTIVE CONTROLS BAR                                             */}
      {/* ==================================================================== */}
      <div className="bg-black/60 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Auto-Play Simulation</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black rounded-xl border border-zinc-700 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            Next Step <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-700 transition cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(idx);
              }}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition cursor-pointer ${
                currentStep === idx
                  ? mode === 'safe'
                    ? 'bg-emerald-500 text-black font-black ring-2 ring-emerald-400/50'
                    : 'bg-rose-600 text-white font-black ring-2 ring-rose-500/50'
                  : currentStep > idx
                  ? 'bg-zinc-800 text-zinc-300'
                  : 'bg-zinc-950 text-zinc-600 border border-zinc-800'
              }`}
            >
              {idx}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VISUAL ARENA: 2 HOSPITALS COMPETING FOR CENTRAL BLOOD BANK SHELF     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        
        {/* HOSPITAL 1 CARD (KLE HOSPITAL) */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
          currentStepData.h1Allocated > 0
            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg'
            : currentStepData.lockStatus === 'LOCKED_BY_H1'
            ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30'
            : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                REQUESTER 1
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> KLE Hospital
              </span>
            </div>

            <h4 className="font-extrabold text-sm text-white">Emergency Trauma Need</h4>
            <p className="text-xs text-zinc-400 mt-1">Requested Quantity: <b className="text-white">2 Units of O- Negative</b></p>

            <div className="mt-4 p-3 rounded-xl bg-black/60 border border-zinc-800 space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Transaction Action:</div>
              <div className={currentStepData.h1Allocated > 0 ? 'text-emerald-300 font-bold' : 'text-zinc-300'}>
                {currentStepData.h1Action}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Allocated Units:</span>
            <span className="font-mono font-extrabold text-emerald-400 text-sm">
              {currentStepData.h1Allocated} / 2 Units
            </span>
          </div>
        </div>

        {/* CENTRAL BLOOD BANK SHELF (PHYSICAL INVENTORY) */}
        <div className="p-5 rounded-2xl bg-black border border-zinc-800 flex flex-col justify-between items-center text-center space-y-4">
          <div>
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-zinc-400 mb-1">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Belagavi Blood Bank Central Storage</span>
            </div>
            <div className="text-xs text-zinc-500">Inventory Batch: <code className="text-cyan-300 font-mono">INV-O-NEG-01</code></div>
          </div>

          {/* Visual Blood Bags Shelf */}
          <div className="space-y-2 w-full">
            <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block">
              Physical Blood Units On Shelf:
            </span>
            <div className="flex items-center justify-center gap-3 py-2">
              {[1, 2, 3].map((bagNum) => {
                const isTakenByH1 = currentStepData.h1Allocated >= bagNum;
                const isTakenByH2 = mode === 'unsafe' && bagNum === 3 && currentStepData.h2Allocated > 0;
                const isHeld = currentStepData.lockStatus === 'LOCKED_BY_H1' && bagNum <= 2;
                const isOverdraft = mode === 'unsafe' && currentStepData.dbStock < 0;

                return (
                  <div
                    key={bagNum}
                    className={`w-16 h-24 rounded-2xl border-2 flex flex-col items-center justify-between p-2 transition-all duration-300 ${
                      isTakenByH1
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : isTakenByH2
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                        : isHeld
                        ? 'bg-amber-950/40 border-amber-400 text-amber-300 animate-pulse'
                        : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Droplets className="w-4 h-4 text-rose-500 fill-rose-500" />
                      {isHeld && <Lock className="w-3 h-3 text-amber-400" />}
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-black font-mono">O-</div>
                      <div className="text-[9px] text-zinc-400">Unit #{bagNum}</div>
                    </div>

                    <div className="text-[9px] font-bold">
                      {isTakenByH1 ? 'HOSP 1' : isTakenByH2 ? 'HOSP 2' : isHeld ? 'LOCKED' : 'AVAILABLE'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Live Stock Counter */}
          <div className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Remaining Stock:</span>
            <span className={`text-xl font-black font-mono ${
              currentStepData.dbStock < 0
                ? 'text-rose-500 animate-pulse'
                : currentStepData.dbStock === 0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}>
              {currentStepData.dbStock} {currentStepData.dbStock === 1 ? 'Unit' : 'Units'}
            </span>
          </div>
        </div>

        {/* HOSPITAL 2 CARD (CITY CARE HOSPITAL) */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
          mode === 'unsafe' && currentStepData.h2Allocated > 0
            ? 'bg-rose-950/20 border-rose-500/50 shadow-lg'
            : currentStepData.h2Action.includes('Insufficient') || currentStepData.h2Action.includes('ROLLBACK')
            ? 'bg-zinc-900 border-zinc-700'
            : currentStepData.h2Action.includes('BLOCKED')
            ? 'bg-amber-950/10 border-amber-500/30'
            : 'bg-zinc-950 border-zinc-800'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                REQUESTER 2
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> City Care Hospital
              </span>
            </div>

            <h4 className="font-extrabold text-sm text-white">Critical Surgical Need</h4>
            <p className="text-xs text-zinc-400 mt-1">Requested Quantity: <b className="text-white">2 Units of O- Negative</b></p>

            <div className="mt-4 p-3 rounded-xl bg-black/60 border border-zinc-800 space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-zinc-500 uppercase font-bold">Transaction Action:</div>
              <div className={
                currentStepData.h2Action.includes('BLOCKED')
                  ? 'text-amber-400 font-bold'
                  : currentStepData.h2Action.includes('Insufficient')
                  ? 'text-rose-400 font-bold'
                  : 'text-zinc-300'
              }>
                {currentStepData.h2Action}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Allocated Units:</span>
            <span className={`font-mono font-extrabold text-sm ${
              mode === 'unsafe' && currentStepData.h2Allocated > 0 ? 'text-rose-400' : 'text-zinc-400'
            }`}>
              {currentStepData.h2Allocated} / 2 Units
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* STEP DESCRIPTION & DBMS INTERCEPTION DECISION BOX                    */}
      {/* ==================================================================== */}
      <div className={`p-4 rounded-2xl border font-mono text-xs space-y-2 ${
        mode === 'safe'
          ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-300'
          : 'bg-rose-950/15 border-rose-500/30 text-rose-300'
      }`}>
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black font-bold text-[10px] text-white">
              STEP {currentStepData.stepIndex} OF {steps.length - 1}
            </span>
            <span className="font-bold text-white text-xs">{currentStepData.title}</span>
          </div>
          <span className="text-[10px] text-zinc-400">
            {mode === 'safe' ? 'ACID Transaction Mutex Enabled' : 'No Concurrency Controls (Race Condition Danger)'}
          </span>
        </div>

        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
          {currentStepData.description}
        </p>

        <div className="p-2.5 bg-black/60 rounded-xl border border-zinc-800 text-xs font-mono flex items-center gap-2">
          <span className="text-zinc-400 font-bold uppercase text-[10px]">DBMS Engine Status:</span>
          <span className="font-bold">{currentStepData.dbmsDecision}</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FINAL VERDICT EXPLANATION CARD                                       */}
      {/* ==================================================================== */}
      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div className="space-y-1">
          <span className="font-mono text-emerald-400 font-bold text-[11px] block">1. The Project Problem:</span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            In our blood bank, units are physically limited assets. If two hospitals book the last units simultaneously, an uncoordinated system promises blood that doesn't exist.
          </p>
        </div>

        <div className="space-y-1">
          <span className="font-mono text-cyan-400 font-bold text-[11px] block">2. How the DBMS Solves It:</span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            The DBMS uses <code className="text-cyan-300 font-mono">Row-Level Locks (SELECT ... FOR UPDATE)</code>. Hospital 1 holds the lock until its transaction finishes, forcing Hospital 2 to see only committed, accurate stock.
          </p>
        </div>

        <div className="space-y-1">
          <span className="font-mono text-amber-400 font-bold text-[11px] block">3. Result in Viva / Presentation:</span>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Zero lost updates, zero double allocation, and guaranteed ACID consistency. Even during peak city emergencies, database stock never goes into negative.
          </p>
        </div>
      </div>
    </div>
  );
};
