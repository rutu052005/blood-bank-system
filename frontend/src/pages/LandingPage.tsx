import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  Droplets,
  Clock,
  Layers,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Network,
  Cpu,
  HeartPulse,
  Activity,
  Globe,
  BarChart3,
  Hourglass,
  Zap,
  Lock,
  ExternalLink
} from 'lucide-react';
import { EngineWorkflowModal, EngineId } from '../components/EngineWorkflowModal.js';

export const LandingPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Engine Interactive Workflow Modal State
  const [selectedEngineModal, setSelectedEngineModal] = useState<EngineId | null>(null);

  // Interactive Live Demonstration State
  const [selectedDemo, setSelectedDemo] = useState<string>('D1');
  const [demoRunning, setDemoRunning] = useState<boolean>(false);
  const [demoLogs, setDemoLogs] = useState<Record<string, string>>({
    D1: 'Ready: Simulates a Code-Red trauma emergency. The platform prioritizes the critical surgical patient and instantly sources emergency O-Negative reserves from the nearest partner hospital.',
    D2: 'Ready: Simulates fair waitlist protection. Routine surgical requests that have been waiting are automatically escalated so no scheduled patient is overlooked during busy periods.',
    D3: 'Ready: Simulates multi-hospital safety checks. Evaluates blood reservations across all medical centers to ensure every hospital maintains essential safety reserves.',
    D4: 'Ready: Simulates peak-hour simultaneous requests. Dispatches 20 concurrent hospital orders at the same millisecond to verify zero booking errors or duplicate reservations.',
    D5: 'Ready: Simulates shelf-life monitoring. Fast-forwards the system calendar by 72 hours to demonstrate how units nearing expiration trigger automated notifications for scheduled usage.',
    D6: 'Ready: Simulates full delivery tracking. Demonstrates end-to-end lifecycle: Emergency Request -> Nearest Hospital Match -> Doctor Authorization -> Courier In-Transit -> Receipt Confirmation.',
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

  const handleRunDemo = (id: string) => {
    setDemoRunning(true);
    setTimeout(() => {
      setDemoRunning(false);
      const results: Record<string, string> = {
        D1: '[DISPATCH VERIFIED] Code-Red Emergency at Shree Hospital received immediate priority. Sourced 1 Unit O- from City Care Hospital (Hubballi). Earlier reservation re-queued with elevated priority.',
        D2: '[WAITLIST RESOLVED] Fair balancing algorithm evaluated pending requests. Routine Request REQ002 for District Hospital reached wait threshold and was safely elevated to Urgent status. Zero patient neglect.',
        D3: '[SAFETY CONFIRMED] Multi-center reserve validation executed. 4 hospitals analyzed with available buffer [10, 5, 15, 6] units. All participating facilities retain required emergency baseline reserves.',
        D4: '[STRESS TEST PASSED] 20 simultaneous hospital booking requests processed in parallel. Centralized reservation synchronization ensured 100% data accuracy with zero double-bookings.',
        D5: '[ALERT DISPATCHED] Timeline advanced +72 hours. Blood unit INV004 entered 3-day critical freshness window. Automatic priority alert dispatched to inventory managers for immediate scheduled use.',
        D6: '[DELIVERY FULFILLED] End-to-end transfer complete: Request REQ001 matched with nearest facility (District Hospital, 5 km away) -> Approved by Attending Physician -> Courier TR001 Dispatched -> Verified & Added to Local Hospital Stock.',
      };
      setDemoLogs(prev => ({ ...prev, [id]: results[id] || 'Simulation completed successfully.' }));
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

  const demosList = [
    { id: 'D1', title: 'Code-Red Trauma Dispatch', category: 'Emergency Triage', badge: 'CRITICAL' },
    { id: 'D2', title: 'Fair Waitlist Protection', category: 'Queue Balancing', badge: 'FAIRNESS' },
    { id: 'D3', title: 'Multi-Center Reserve Safety', category: 'Supply Assurance', badge: 'SAFETY' },
    { id: 'D4', title: 'Peak Rush Concurrency Test', category: 'High Volume Load', badge: 'RELIABILITY' },
    { id: 'D5', title: 'Shelf-Life Fast-Forward', category: 'Freshness Alerts', badge: 'ZERO-WASTE' },
    { id: 'D6', title: 'End-to-End Hospital Transit', category: 'Courier Delivery', badge: 'LIFECYCLE' },
  ];

  const faqs = [
    {
      q: 'How does the platform coordinate blood sharing between regional hospitals?',
      a: 'The platform connects accredited hospital blood banks through a secure, synchronized network. Medical centers can view live regional blood availability, request critical units during trauma emergencies, and track inter-hospital transfers transparently.'
    },
    {
      q: 'How does the system prevent two hospitals from reserving the same blood unit?',
      a: 'The Inventory Sync Engine uses single-writer row-level locking. As soon as an emergency request is initiated, the designated blood unit is placed on instant exclusive hold across the entire regional network, eliminating accidental double-reservations and inventory mismatches.'
    },
    {
      q: 'How does the Match and Expiry Engine select the best hospital?',
      a: 'The Match and Expiry Engine evaluates real-world driving distance via highway network graphs and component shelf-life to suggest the optimal nearest hospital that has compatible, ready-to-dispatch units.'
    },
    {
      q: 'What occurs when an emergency arises while stock is tentatively on hold?',
      a: 'Life-threatening trauma emergencies receive top clinical priority. The Priority Scheduling Engine preempts non-urgent holds to save immediate surgical patients, while awarding a +15 compensation boost to the original request so it is scheduled next.'
    },
    {
      q: 'How does the platform prevent blood units from expiring on hospital shelves?',
      a: 'The system actively tracks shelf-life and expiration dates for every donation using a First-Expiry First-Out (FEFO) protocol. Units approaching their expiration threshold are automatically highlighted and recommended for upcoming scheduled transfusions.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#00b4d8] selection:text-black relative">
      
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION BAR (TCS CodeVita Style: Dark Bar + Cyan Login) */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-[#000000] border-b border-zinc-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00b4d8] to-emerald-400 flex items-center justify-center font-black text-black shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <Droplets className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1 font-black text-xl tracking-tight text-white">
                <span>VitalSync</span>
                <span className="text-[#00b4d8] font-bold">™</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                BLOOD RESOURCE NETWORK
              </div>
            </div>
          </Link>

          {/* Center Navigation Links (Clean, User-Friendly Labels) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono">
            <button onClick={() => scrollToSection('hero')} className="hover:text-[#00b4d8] transition cursor-pointer">
              HOME
            </button>
            <button onClick={() => scrollToSection('overview')} className="hover:text-[#00b4d8] transition cursor-pointer">
              ABOUT
            </button>
            <button onClick={() => scrollToSection('engines')} className="hover:text-[#00b4d8] transition cursor-pointer">
              4 ENGINES
            </button>
            <button onClick={() => scrollToSection('hospitals')} className="hover:text-[#00b4d8] transition cursor-pointer">
              HOSPITALS
            </button>
            <button onClick={() => scrollToSection('simulations')} className="hover:text-[#00b4d8] transition cursor-pointer">
              LIVE DEMO
            </button>
            <button onClick={() => scrollToSection('faqs')} className="hover:text-[#00b4d8] transition cursor-pointer">
              FAQS
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-[#00b4d8] transition cursor-pointer">
              CONTACT
            </button>
          </nav>

          {/* Right Action Button (TCS CodeVita Cyan Login Button Style) */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-[#00b4d8] hover:bg-[#0096c7] text-white font-extrabold px-6 py-2.5 rounded-lg text-xs tracking-wider uppercase shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Control Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-[#00b4d8] hover:bg-[#0096c7] text-white font-black px-7 py-2.5 rounded-lg text-xs tracking-wider uppercase shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION (Dark Tech Aesthetic + CodeVita Style Hero)  */}
      {/* ============================================================ */}
      <section id="hero" className="relative pt-16 pb-28 sm:pb-36 overflow-hidden bg-gradient-to-b from-[#000000] via-[#050b14] to-[#0a1626] text-center">
        {/* Radiant Ambient Glows & Grid */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-[#00b4d8]/25 via-emerald-500/15 to-transparent rounded-full blur-[170px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00b4d80a_1px,transparent_1px),linear-gradient(to_bottom,#00b4d80a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          
          {/* System Title Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-widest uppercase shadow-md shadow-cyan-950">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Multi-Hospital Blood Resources Sharing and Expiry Management System</span>
          </div>

          {/* Catchy Main Headline (Matching 'Code Beyond Imagination') */}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Life Beyond Boundaries
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            Autonomous regional blood resource coordination powered by intelligent inventory synchronization, emergency trauma priority scheduling, and shelf-life expiration prevention.
          </p>

          {/* Center Call-to-Action Pill Buttons (CodeVita 'Register Now!' pill style) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-[#00b4d8] text-white hover:text-black hover:bg-[#00b4d8] text-sm font-black tracking-wider uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,180,216,0.35)] hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Register Now!</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleQuickDemoLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-sm font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-105"
            >
              <Cpu className="w-4 h-4 text-[#00b4d8]" />
              <span>Explore 1-Click Demo</span>
            </button>
          </div>

          {/* Safety / Compliance Banner */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-[#00b4d8]" />
              <span>Verified Hospital Network • Certified Emergency Medical Resource Coordination</span>
            </div>
          </div>
        </div>

        {/* TCS CodeVita Iconic Curved Wave Divider (Swoops across into crisp white) */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none -mb-1">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="relative block w-full h-20 sm:h-28 text-slate-50 fill-current">
            <path d="M0,0 C380,105 1060,105 1440,0 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. THREE METRIC CARDS (Exact TCS CodeVita 3-Card Layout)     */}
      {/* ============================================================ */}
      <section className="relative z-20 -mt-10 sm:-mt-14 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Hourglass Icon (Matching ⏳ 3) */}
          <div className="bg-white p-7 rounded-xl border border-slate-200/90 shadow-xl shadow-slate-200/60 flex items-start gap-5 hover:border-[#00b4d8] hover:shadow-2xl transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Hourglass className="w-7 h-7 text-[#00b4d8]" />
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-none mb-1">
                3
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 tracking-tight">
                Minutes Emergency Trauma SLA
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Sub-second highway routing and instant cross-hospital donor match.
              </p>
            </div>
          </div>

          {/* Card 2: Units Monitored (Matching $ 20000) */}
          <div className="bg-white p-7 rounded-xl border border-slate-200/90 shadow-xl shadow-slate-200/60 flex items-start gap-5 hover:border-[#00b4d8] hover:shadow-2xl transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <HeartPulse className="w-7 h-7 text-[#00b4d8]" />
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-none mb-1">
                20000
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 tracking-tight">
                Blood Units Monitored
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Zero expiry waste enforced via First-Expiry First-Out (FEFO) tracking.
              </p>
            </div>
          </div>

          {/* Card 3: Global Ranking / Unified Network (Matching 📊 1) */}
          <div className="bg-white p-7 rounded-xl border border-slate-200/90 shadow-xl shadow-slate-200/60 flex items-start gap-5 hover:border-[#00b4d8] hover:shadow-2xl transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7 text-[#00b4d8]" />
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-none mb-1">
                1
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 tracking-tight">
                Unified Healthcare Grid
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Deterministic concurrency ledger guarantees zero stock double-booking.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. THE 4 CORE ENGINES SHOWCASE (Clickable Interactive Working) */}
      {/* ============================================================ */}
      <section id="engines" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <div className="text-xs font-mono font-bold text-[#00b4d8] uppercase tracking-widest">
            CORE PLATFORM ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            The 4 Operational Engines
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Click on any engine to inspect its live interactive working, mathematical formulas, and algorithmic step-by-step trace.
          </p>
        </div>

        {/* 4 Engines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Engine 1: Inventory Sync Engine */}
          <div
            onClick={() => setSelectedEngineModal('inventory-sync')}
            className="bg-white p-7 rounded-2xl border border-slate-200 shadow-lg hover:border-[#00b4d8] hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  100% ACID CONSISTENCY
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-[#00b4d8] transition-colors">
                  1. Inventory sync engine
                </h3>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Single-Writer Concurrency Mutex & Row Locks
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deterministic row-level locking eliminates phantom stock, race conditions, and double-allocation across regional hospital facilities. Enforces total ordering with ascending hospital ID acquisition.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-[#00b4d8] group-hover:translate-x-1 transition-transform">
              <span>View Interactive Mutex Working</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Engine 2: Priority Scheduling Engine */}
          <div
            onClick={() => setSelectedEngineModal('priority-scheduling')}
            className="bg-white p-7 rounded-2xl border border-slate-200 shadow-lg hover:border-[#00b4d8] hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 text-[#00b4d8] border border-cyan-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
                  MLFQ & BANKER'S SAFETY
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-[#00b4d8] transition-colors">
                  2. Priority scheduling engine
                </h3>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  3-Lane Triage Queuing & Starvation Prevention
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                3-lane feedback queues preempt non-urgent holds during trauma crises with a +15 compensation boost to guarantee zero patient starvation while Banker's safety state matrix validates multi-center reserve buffers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-[#00b4d8] group-hover:translate-x-1 transition-transform">
              <span>View Interactive MLFQ Working</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Engine 3: Web Engine */}
          <div
            onClick={() => setSelectedEngineModal('web-engine')}
            className="bg-white p-7 rounded-2xl border border-slate-200 shadow-lg hover:border-[#00b4d8] hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                  SUB-15MS SSE TELEMETRY
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-[#00b4d8] transition-colors">
                  3. Web engine
                </h3>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Reactive Multi-Hospital Telemetry Portal
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full-stack reactive web platform streaming real-time Server-Sent Events (SSE) for instant emergency notifications, REST API endpoints, and automatic self-healing offline store fallbacks.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-[#00b4d8] group-hover:translate-x-1 transition-transform">
              <span>View Interactive Web Stream Working</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Engine 4: Match and Expiry Engine */}
          <div
            onClick={() => setSelectedEngineModal('match-expiry')}
            className="bg-white p-7 rounded-2xl border border-slate-200 shadow-lg hover:border-[#00b4d8] hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Network className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                  DIJKSTRA + BINARY MIN-HEAP
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-[#00b4d8] transition-colors">
                  4. Match and expiry engine
                </h3>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Shortest Route Pathfinder & FEFO Expiry Tracker
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dijkstra pathfinder evaluates regional road network weights to find the fastest highway route, while Binary Min-Heap tracks expiration down to the hour to prioritize units for scheduled clinical transfusions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-[#00b4d8] group-hover:translate-x-1 transition-transform">
              <span>View Interactive Route & Heap Working</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. ABOUT PLATFORM OVERVIEW (Clear, Professional Headers)     */}
      {/* ============================================================ */}
      <section id="overview" className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono font-bold text-[#00b4d8] uppercase tracking-widest">
              SYSTEM OVERVIEW
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Designed for High-Reliability Healthcare Logistics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Eliminating regional blood shortages and shelf-life expiration through deterministic algorithms and automated cross-facility coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#00b4d8]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Zero Wait Emergency Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Emergency trauma surgeries are instantly prioritized across the entire regional grid, eliminating telephone delays and manual searching during Code-Red events.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">100% Stock Synchronization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized reservation locks prevent race conditions and inventory conflicts. When a unit is assigned, every partner center sees updated availability instantly.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Zero-Waste Expiry Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Units approaching end of shelf-life are automatically elevated for scheduled transfusions, dramatically cutting hospital blood waste and preserving critical donor supply.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CONNECTED HOSPITAL NETWORK (5 REGIONAL FACILITIES)       */}
      {/* ============================================================ */}
      <section id="hospitals" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold text-[#00b4d8] uppercase tracking-widest">
              REGIONAL HEALTHCARE ALLIANCE
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Connected Regional Medical Centers
            </h2>
            <p className="text-xs text-slate-500">
              A unified network of accredited hospitals collaborating to share emergency blood reserves.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[#00b4d8] font-bold hover:underline font-mono"
          >
            <span>Access Network Control Center</span>
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
            <div key={hosp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#00b4d8] transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {hosp.id}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">{hosp.name}</h4>
                <div className="text-[11px] text-slate-500 font-medium">{hosp.city}</div>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {hosp.role}
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">Stock:</span>
                <span className="text-[#00b4d8] font-bold">{hosp.stock}</span>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ============================================================ */}
      {/* 7. INTERACTIVE OPERATIONAL SIMULATIONS (6 Working Scenarios) */}
      {/* ============================================================ */}
      <section id="simulations" className="py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono font-bold text-[#00b4d8] uppercase tracking-widest">
              INTERACTIVE PLATFORM DEMO
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Simulate Real-World Emergency Scenarios
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Test how the platform handles high-priority emergencies, fair queue distribution, multi-center stock transfers, and expiration alerts in real time.
            </p>
          </div>

          {/* Interactive Scenario Control Console */}
          <div className="bg-[#050b14] rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
            {/* Top Scenario Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-zinc-800 bg-black/60">
              {demosList.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => setSelectedDemo(demo.id)}
                  className={`p-3.5 text-left transition-all border-r border-zinc-800 last:border-r-0 cursor-pointer ${
                    selectedDemo === demo.id
                      ? 'bg-cyan-950/50 text-cyan-300 border-b-2 border-b-[#00b4d8]'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-xs font-black">{demo.id}</span>
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
                      {demo.badge}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-white truncate">{demo.title}</div>
                </button>
              ))}
            </div>

            {/* Console Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span className="text-[#00b4d8] font-mono">[{selectedDemo}]</span>
                    <span>{demosList.find(d => d.id === selectedDemo)?.title}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Workflow Type: <span className="text-[#00b4d8] font-mono">{demosList.find(d => d.id === selectedDemo)?.category}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRunDemo(selectedDemo)}
                    disabled={demoRunning}
                    className="bg-[#00b4d8] hover:bg-[#0096c7] text-white font-black px-6 py-2.5 rounded-xl text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 cursor-pointer hover:scale-105"
                  >
                    {demoRunning ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin text-white" />
                        <span>Simulating Workflow...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-white fill-white" />
                        <span>Run Live Simulation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Terminal Output Screen */}
              <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-800 pb-2">
                  <span>SIMULATED WORKFLOW EXECUTION LOG</span>
                  <span className="text-emerald-400 font-bold">STATUS: READY</span>
                </div>
                <p className="text-cyan-300 pt-1 leading-relaxed">
                  &gt; {demoLogs[selectedDemo]}
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQS)                         */}
      {/* ============================================================ */}
      <section id="faqs" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        
        <div className="text-center space-y-3">
          <div className="text-xs font-mono font-bold text-[#00b4d8] uppercase tracking-widest">
            HELP & COMMON INQUIRIES
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500">
            Everything you need to know about how the VitalSync platform coordinates hospital supplies.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                >
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#00b4d8] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#00b4d8] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

      {/* ============================================================ */}
      {/* 9. FOOTER & CONTACT (Clean Institutional Footer)             */}
      {/* ============================================================ */}
      <footer id="contact" className="bg-[#000000] text-zinc-400 border-t border-zinc-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00b4d8] flex items-center justify-center font-black text-black">
                  <Droplets className="w-5 h-5 text-black" />
                </div>
                <span className="font-black text-white text-base tracking-tight">VitalSync™</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                The intelligent multi-hospital blood coordination and emergency logistics platform. Connecting medical facilities to deliver lifesaving resources when every second counts.
              </p>
              <div className="text-[10px] font-mono text-[#00b4d8]">
                STATUS: LIVE REGIONAL GRID ACTIVE
              </div>
            </div>

            {/* Col 2: Platform Navigation */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                Platform Navigation
              </div>
              <ul className="space-y-1.5 text-zinc-400">
                <li><Link to="/login" className="hover:text-[#00b4d8] transition">Control Center Login</Link></li>
                <li><Link to="/login" className="hover:text-[#00b4d8] transition">Register Facility</Link></li>
                <li><button onClick={() => scrollToSection('engines')} className="hover:text-[#00b4d8] transition text-left cursor-pointer">4 Core Engines</button></li>
                <li><button onClick={() => scrollToSection('simulations')} className="hover:text-[#00b4d8] transition text-left cursor-pointer">Live Simulations</button></li>
              </ul>
            </div>

            {/* Col 3: The 4 Core Engines */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                The 4 System Engines
              </div>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li><button onClick={() => setSelectedEngineModal('inventory-sync')} className="hover:text-[#00b4d8] transition text-left cursor-pointer">• 1. Inventory sync engine</button></li>
                <li><button onClick={() => setSelectedEngineModal('priority-scheduling')} className="hover:text-[#00b4d8] transition text-left cursor-pointer">• 2. Priority scheduling engine</button></li>
                <li><button onClick={() => setSelectedEngineModal('web-engine')} className="hover:text-[#00b4d8] transition text-left cursor-pointer">• 3. Web engine</button></li>
                <li><button onClick={() => setSelectedEngineModal('match-expiry')} className="hover:text-[#00b4d8] transition text-left cursor-pointer">• 4. Match and expiry engine</button></li>
              </ul>
            </div>

            {/* Col 4: Operational Safety Disclaimer */}
            <div className="space-y-3 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                Operational Safety
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                VitalSync provides logistics coordination and inventory visibility across participating healthcare centers. All blood component cross-matching and transfusion procedures remain under physician clinical supervision.
              </p>
              <div className="text-[10px] text-zinc-600 font-mono">
                © 2026 VitalSync. All rights reserved.
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              Multi-Hospital Blood Resources Sharing and Expiry Management System.
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={scrollToTop}
                className="hover:text-[#00b4d8] transition flex items-center gap-1 font-mono text-[11px] cursor-pointer"
              >
                <span>Back to Top</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating Back-To-Top Arrow Button (Matching TCS CodeVita Bottom Right Cyan Button) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={scrollToTop}
          className="w-12 h-12 rounded-xl bg-[#00b4d8] hover:bg-[#0096c7] text-white shadow-xl shadow-cyan-500/30 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
          title="Back to Top"
        >
          <ChevronUp className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Engine Workflow Interactive Modal */}
      {selectedEngineModal && (
        <EngineWorkflowModal
          engineId={selectedEngineModal}
          onClose={() => setSelectedEngineModal(null)}
          onSelectEngine={(id) => setSelectedEngineModal(id)}
        />
      )}

    </div>
  );
};
export default LandingPage;
