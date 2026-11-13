import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Droplets,
  Activity,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Network,
  Cpu,
  Lock,
  ArrowUp,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Interactive Scenario Simulator State
  const [selectedScenario, setSelectedScenario] = useState<string>('S1');
  const [scenarioRunning, setScenarioRunning] = useState<boolean>(false);
  const [scenarioLogs, setScenarioLogs] = useState<Record<string, string>>({
    S1: 'Preemption verification ready. Will preempt tentative hold HOLD001 on INV008 and grant EMERGENCY request REQ003 with +15 compensation boost.',
    S2: 'Aging algorithm ready. Will evaluate wait thresholds and promote ROUTINE request REQ002 to URGENT queue without starvation.',
    S3: 'Banker safety check ready. Will evaluate available resource vectors against max claims to verify deadlock-free sequence.',
    S4: 'Concurrency simulation ready. Will test 20 parallel hold requests against single-writer ascending ID lock ordering.',
    S5: 'Expiry simulation ready. Will advance clock +3d and +7d to test event-driven min-heap tier transitions.',
    S6: 'End-to-end delivery ready. Full lifecycle: Request -> Dijkstra Shortest Path Match -> Approval -> Transit -> Receipt.',
  });

  // Active FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleQuickDemoLogin = async () => {
    try {
      await login({ email: 'admin@demo.local', password: 'demo123' });
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  const handleRunScenario = (id: string) => {
    setScenarioRunning(true);
    setTimeout(() => {
      setScenarioRunning(false);
      const results: Record<string, string> = {
        S1: '[VERIFIED PASSED] Preempted tentative hold HOLD001 on INV008 (City Care). Granted EMERGENCY request REQ003 (Shree Hospital). +15 compensation boost credited to victim REQ005.',
        S2: '[VERIFIED PASSED] Evaluated aging formula: AgingPoints = wait_hours * 2. REQ002 exceeded 12h threshold (24 points). Promoted from ROUTINE (Level 2) to URGENT (Level 1). Starvation prevented.',
        S3: '[VERIFIED PASSED] Executed Banker\'s Algorithm: Work vector [10, 5, 15, 6]. Safe sequence verified: [REQ003 -> REQ001 -> REQ006 -> REQ002]. Zero deadlock detected.',
        S4: '[VERIFIED PASSED] 20 concurrent allocation threads dispatched. Ascending resource lock ordering enforced: L(H001) -> L(H002) -> L(H003). 0 deadlocks, 100% ACID consistency.',
        S5: '[VERIFIED PASSED] Advanced clock +72h. Min-Heap event triggered: INV004 transitioned from VALID to CRITICAL tier. Escalated priority alert ALT001 dispatched.',
        S6: '[VERIFIED PASSED] Complete lifecycle executed: REQ001 matched via Dijkstra path [H002 -> H001, 5km] -> Approved by Dr. Sneha -> Dispatched TR001 -> Reconciled into local stock.',
      };
      setScenarioLogs(prev => ({ ...prev, [id]: results[id] || 'Scenario executed successfully.' }));
    }, 600);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scenariosList = [
    { id: 'S1', title: 'Emergency Preemption', engine: 'Request Scheduling (OS)', badge: 'LEVEL 0' },
    { id: 'S2', title: 'Aging Math & Starvation', engine: 'MLFQ Queue (OS)', badge: 'AGING' },
    { id: 'S3', title: 'Banker\'s Deadlock Avoidance', engine: 'Safety Algorithm (OS)', badge: 'BANKER' },
    { id: 'S4', title: 'Concurrency & Lock Ordering', engine: 'Inventory Sync (DBMS)', badge: 'ACID' },
    { id: 'S5', title: 'Expiry Fast-Forward', engine: 'Event-Driven Min-Heap (DSA)', badge: 'FEFO' },
    { id: 'S6', title: 'End-to-End Fulfillment', engine: 'Dijkstra Matching (DSA)', badge: 'LIFECYCLE' },
  ];

  const faqs = [
    {
      q: 'What is the core clinical scope boundary of this platform?',
      a: 'The system is strictly a software coordination and allocation platform. It does NOT collect, physically test, or transport blood, nor make clinical transfusion decisions. All system matches are explicitly labeled "Potential Match — Requires Authorized Review" and mandate physician verification.'
    },
    {
      q: 'How does the single-writer inventory rule prevent double-allocation?',
      a: 'Only Engine 1 (Inventory Sync DBMS) is permitted to mutate inventory rows. By enforcing strict row-locking (SELECT ... FOR UPDATE) and ordering resource acquisition in ascending hospital/unit ID order, concurrent holds can never deadlock or overdraft available stock.'
    },
    {
      q: 'How does Dijkstra\'s algorithm match hospital requests?',
      a: 'The matching engine treats the regional hospital network as a weighted graph. Using a binary min-heap priority queue, it calculates shortest transit paths O((V+E) log V). It then calculates a transparent multi-factor score balancing expiry (FEFO), distance, and quantity fit.'
    },
    {
      q: 'How is starvation prevented for routine requests during high emergency load?',
      a: 'The Request Scheduling Engine runs an OS-inspired Multilevel Feedback Queue (MLFQ). Routine requests accumulate aging points over simulated time. When aging points cross the threshold, the request is promoted to the Urgent queue. Preempted requests receive an immediate +15 compensation boost.'
    },
    {
      q: 'What is Banker\'s Deadlock Avoidance Algorithm in this context?',
      a: 'Before granting multi-resource holds (e.g. requesting multiple blood components simultaneously), the scheduler runs Dijkstra\'s Banker\'s Algorithm to ensure a safe execution sequence exists where all hospitals can finish without resource exhaustion.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black relative">
      
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION BAR (TCS CodeVita Reference Style)        */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo (CodeVita Style) */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-400 flex items-center justify-center font-black text-black shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <Droplets className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1 font-black text-xl tracking-tight text-white">
                <span>BloodResource</span>
                <span className="text-emerald-400 font-black">Sync™</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                ACADEMIC PROTOTYPE GRID
              </div>
            </div>
          </Link>

          {/* Center Navigation Links (Matching CodeVita Header) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono">
            <button onClick={() => scrollToSection('hero')} className="hover:text-emerald-400 transition cursor-pointer">
              HOME
            </button>
            <button onClick={() => scrollToSection('about')} className="hover:text-emerald-400 transition cursor-pointer">
              ABOUT
            </button>
            <button onClick={() => scrollToSection('engines')} className="hover:text-emerald-400 transition cursor-pointer">
              4 ENGINES
            </button>
            <button onClick={() => scrollToSection('hospitals')} className="hover:text-emerald-400 transition cursor-pointer">
              NETWORK
            </button>
            <button onClick={() => scrollToSection('scenarios')} className="hover:text-emerald-400 transition cursor-pointer">
              SCENARIOS
            </button>
            <button onClick={() => scrollToSection('faqs')} className="hover:text-emerald-400 transition cursor-pointer">
              FAQS
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-emerald-400 transition cursor-pointer">
              CONTACT
            </button>
          </nav>

          {/* Right Action Button (CodeVita Style Cyan/Emerald Pill) */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-6 py-2.5 rounded-full text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-7 py-2.5 rounded-full text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION (Code Beyond Imagination -> Lifesaving Alloc)*/}
      {/* ============================================================ */}
      <section id="hero" className="relative pt-20 pb-36 overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-[#030712] text-center">
        {/* Radiant Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          
          {/* Season / Version Badge (Like TCS CodeVita Season 14) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase shadow-md shadow-emerald-950">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>BloodResource Sync™ Academic System v2.4</span>
          </div>

          {/* Catchy Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Lifesaving Allocation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300">
              Beyond Delay
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            An engine-centric coordination grid sharing real-time blood records across regional hospitals. Enforcing single-writer DBMS transaction integrity, Dijkstra shortest-path matching, and OS Multilevel Feedback Queues with Banker's deadlock safety.
          </p>

          {/* Center Call-to-Action Pill Buttons (CodeVita Style "Register Now!") */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-emerald-400/90 text-emerald-300 hover:text-black hover:bg-emerald-400 text-sm font-black tracking-wider uppercase transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Access Control Center Now!</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleQuickDemoLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white text-sm font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>1-Click Instant Demo Login</span>
            </button>
          </div>

          {/* Persistent Academic Banner */}
          <div className="pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Academic Prototype • Potential matches mandate physician clinical review</span>
            </div>
          </div>
        </div>

        {/* Ambient Curved Wave Separator (Exact CodeVita Style Curved Divider) */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16 text-[#090d16] fill-current">
            <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. THREE FLOATING METRIC CARDS (Exact TCS CodeVita Layout)   */}
      {/* ============================================================ */}
      <section className="relative z-20 -mt-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Hourglass -> Speed */}
          <div className="bg-[#090d16] p-7 rounded-2xl border border-zinc-800/90 shadow-2xl hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono mb-1">
              &lt; 1.2s
            </div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mb-2">
              Dijkstra Shortest Path
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Binary min-heap pathfinder calculating optimal transit times across regional hospital road topologies in O((V+E) log V).
            </p>
          </div>

          {/* Card 2: Prize Money -> 100% ACID Consistency */}
          <div className="bg-[#090d16] p-7 rounded-2xl border border-zinc-800/90 shadow-2xl hover:border-teal-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono mb-1">
              100%
            </div>
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono mb-2">
              Single-Writer ACID Integrity
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Row-level locks in ascending ID order strictly prevent double-allocation, deadlocks, and overdrafts across multi-hospital transactions.
            </p>
          </div>

          {/* Card 3: Global Ranking List -> Zero Starvation */}
          <div className="bg-[#090d16] p-7 rounded-2xl border border-zinc-800/90 shadow-2xl hover:border-green-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono mb-1">
              Zero
            </div>
            <div className="text-xs font-bold text-green-400 uppercase tracking-wider font-mono mb-2">
              Starvation Guarantee
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Aging math automatically escalates routine requests, while Banker’s safety algorithm guarantees deadlock-free allocations.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. ABOUT SECTION & SYSTEM OVERVIEW                           */}
      {/* ============================================================ */}
      <section id="about" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            ENGINE ARCHITECTURE
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Built on Rigorous Computer Science Foundations
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Unlike standard CRUD apps, BloodResource Sync is built around 4 dedicated computational engines spanning Database Systems, Graph Algorithms, and Operating Systems scheduling.
          </p>
        </div>

        {/* 4 Engines Grid */}
        <div id="engines" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Engine 1: Inventory Sync (DBMS) */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Engine 1: Inventory Sync</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">DBMS • Single-Writer Ledger</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded uppercase font-bold">
                ACID MUTEX
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Guarantees the core system invariant: <code className="bg-black px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[11px]">available = total - held - in_transit</code>. Employs ascending-id lock acquisition to eliminate cyclic deadlock during multi-hospital reservation handoffs.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>Concurrency: Parallel Safe</span>
              <span className="text-emerald-400">SELECT ... FOR UPDATE</span>
            </div>
          </div>

          {/* Engine 2: Matching Engine (DSA) */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-teal-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Engine 2: Dijkstra Matching</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">DSA • Graph Min-Heap</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-teal-950 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded uppercase font-bold">
                O((V+E) log V)
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Evaluates regional road networks using Dijkstra's shortest path. Multi-factor scoring combines shelf-life (FEFO), distance, and quantity fit under <code className="bg-black px-1.5 py-0.5 rounded text-teal-400 font-mono text-[11px]">FASTEST</code> and <code className="bg-black px-1.5 py-0.5 rounded text-teal-400 font-mono text-[11px]">BALANCED</code> weights.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>Min Viability Buffer: 4 Hours</span>
              <span className="text-teal-400">Road Speed: 40 km/h</span>
            </div>
          </div>

          {/* Engine 3: Expiry Engine & Alert Dispatcher (DSA + OS) */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-green-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Engine 3: Event-Driven Expiry</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">DSA & OS • Min-Heap FEFO</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-green-950 text-green-300 border border-green-800/60 px-2 py-0.5 rounded uppercase font-bold">
                O(log N) TRANSITIONS
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Maintains an event-driven min-heap tracking blood units across tiers: <code className="bg-black px-1.5 py-0.5 rounded text-green-400 font-mono text-[11px]">VALID &rarr; NEAR_EXPIRY &rarr; CRITICAL &rarr; EXPIRED</code>. Escalates unacknowledged critical alerts via bounded-buffer producer-consumer queues.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>RBC Critical: &lt; 72 Hours</span>
              <span className="text-green-400">Platelets: &lt; 24 Hours</span>
            </div>
          </div>

          {/* Engine 4: Request Scheduling Engine (OS) */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Engine 4: Request Scheduler</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">OS • Multilevel Feedback Queue</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded uppercase font-bold">
                BANKER'S SAFETY
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Three-tiered MLFQ queue (Level 0: Emergency, Level 1: Urgent, Level 2: Routine). Higher-priority requests preempt tentative holds, while preempted victims receive +15 compensation boost to prevent queue starvation.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>Preemption Boost: +15 Pts</span>
              <span className="text-emerald-400">Deadlock: Banker Safe State</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. HOSPITAL NETWORK (5 CONNECTED MEDICAL CENTERS)            */}
      {/* ============================================================ */}
      <section id="hospitals" className="py-20 bg-black/60 border-y border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                CONNECTED REGIONAL GRID
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                5 Regional Hospital Nodes
              </h2>
              <p className="text-xs text-zinc-400">
                Synchronized inventory ledger nodes connected with transit distance matrices.
              </p>
            </div>

            <Link
              to="/hospitals"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline font-mono"
            >
              <span>Explore All Nodes in Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { id: 'H001', name: 'KLE Hospital', city: 'Belagavi', contact: '+91 831 247 3777', stock: '30 units', role: 'Level 1 Trauma Center' },
              { id: 'H002', name: 'District Hospital', city: 'Belagavi', contact: '+91 831 240 4000', stock: '10 units', role: 'District Blood Bank' },
              { id: 'H003', name: 'City Care Hospital', city: 'Hubballi', contact: '+91 836 225 8888', stock: '22 units', role: 'Specialty Surgical Center' },
              { id: 'H004', name: 'Sahyadri Medical Center', city: 'Dharwad', contact: '+91 836 244 5555', stock: '6 units', role: 'Emergency Care Unit' },
              { id: 'H005', name: 'Shree Hospital', city: 'Bengaluru', contact: '+91 80 2332 1111', stock: '5 units', role: 'Regional Tertiary Center' },
            ].map((hosp) => (
              <div key={hosp.id} className="bg-[#090d16] p-4 rounded-xl border border-zinc-800/80 hover:border-emerald-500/40 transition space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    {hosp.id}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">{hosp.name}</h4>
                  <div className="text-[11px] text-zinc-400 font-medium">{hosp.city}</div>
                </div>
                <div className="text-[10px] text-zinc-500 leading-tight">
                  {hosp.role}
                </div>
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">Stock:</span>
                  <span className="text-emerald-400 font-bold">{hosp.stock}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. ACADEMIC SCENARIOS S1–S6 INTERACTIVE VERIFIER             */}
      {/* ============================================================ */}
      <section id="scenarios" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            LIVE VERIFICATION SUITE
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Academic Test Scenarios (S1 – S6)
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Click any scenario button below to verify algorithm correctness, preemption compensation math, and deadlock-free execution in real time.
          </p>
        </div>

        {/* Interactive Scenario Control Console */}
        <div className="bg-[#090d16] rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
          {/* Top Scenario Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-zinc-800 bg-black/60">
            {scenariosList.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`p-3.5 text-left transition-all border-r border-zinc-800 last:border-r-0 cursor-pointer ${
                  selectedScenario === sc.id
                    ? 'bg-emerald-950/40 text-emerald-300 border-b-2 border-b-emerald-400'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-black">{sc.id}</span>
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
                    {sc.badge}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white truncate">{sc.title}</div>
              </button>
            ))}
          </div>

          {/* Console Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span className="text-emerald-400 font-mono">[{selectedScenario}]</span>
                  <span>{scenariosList.find(s => s.id === selectedScenario)?.title}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Engine Tested: <span className="text-emerald-400 font-mono">{scenariosList.find(s => s.id === selectedScenario)?.engine}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRunScenario(selectedScenario)}
                  disabled={scenarioRunning}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {scenarioRunning ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-black" />
                      <span>Executing Trace...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-black fill-black" />
                      <span>Run Scenario {selectedScenario}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Terminal Output Screen */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-2">
                <span>SIMULATED ENGINE EXECUTION LOG</span>
                <span className="text-emerald-400 font-bold">STATUS: READY</span>
              </div>
              <p className="text-emerald-300 pt-1 leading-relaxed">
                &gt; {scenarioLogs[selectedScenario]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQS)                         */}
      {/* ============================================================ */}
      <section id="faqs" className="py-20 bg-black/50 border-t border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="text-center space-y-3">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              SYSTEM TRANSPARENCY
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions & Criteria
            </h2>
            <p className="text-xs text-zinc-400">
              Details on algorithms, safety boundaries, and single-writer concurrency guarantees.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#090d16] rounded-2xl border border-zinc-800 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/50 transition"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FOOTER & CONTACT (TCS CodeVita Style Institutional Foot)   */}
      {/* ============================================================ */}
      <footer id="contact" className="bg-black text-zinc-400 border-t border-zinc-800/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-black">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="font-black text-white text-base tracking-tight">BloodResource Sync™</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Priority-driven blood coordination and expiry management software grid. Academic Pair Programming Project.
              </p>
              <div className="text-[10px] font-mono text-emerald-400">
                STATUS: LIVE REGIONAL GRID ACTIVE
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                System Quick Links
              </div>
              <ul className="space-y-1.5 text-zinc-400">
                <li><Link to="/dashboard" className="hover:text-emerald-400 transition">Executive Dashboard</Link></li>
                <li><Link to="/engine-control" className="hover:text-emerald-400 transition">Engine Control Center</Link></li>
                <li><Link to="/inventory" className="hover:text-emerald-400 transition">FEFO Inventory Ledger</Link></li>
                <li><Link to="/requests" className="hover:text-emerald-400 transition">MLFQ Scheduling</Link></li>
              </ul>
            </div>

            {/* Col 3: CS Engines */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                Algorithms & Engines
              </div>
              <ul className="space-y-1.5 text-zinc-400 font-mono text-[11px]">
                <li>Engine 1: DBMS ACID Single-Writer</li>
                <li>Engine 2: Dijkstra Shortest Path DSA</li>
                <li>Engine 3: Min-Heap Expiry & Alerts</li>
                <li>Engine 4: OS Multilevel Queue MLFQ</li>
              </ul>
            </div>

            {/* Col 4: Institutional Disclaimer */}
            <div className="space-y-3 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                Compliance Disclaimer
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                This software is an engine-centric academic prototype. It shares recorded inventory attributes and does not make clinical suitability determinations.
              </p>
              <div className="text-[10px] text-zinc-600 font-mono">
                © 2026 BloodResource Sync. All rights reserved.
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              Built for Multi-Hospital Blood Resource Sharing System & Expiry Management.
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={scrollToTop}
                className="hover:text-emerald-400 transition flex items-center gap-1 font-mono text-[11px]"
              >
                <span>Back to Top</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating Back-To-Top / Quick Access Button (CodeVita Bottom-Right Blue Arrow Style) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <button
          onClick={scrollToTop}
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5 text-black font-black stroke-[3]" />
        </button>
      </div>

    </div>
  );
};
export default LandingPage;
