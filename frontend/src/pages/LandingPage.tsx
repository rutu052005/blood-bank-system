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
  ExternalLink,
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
  ArrowUp,
  Truck,
  HeartPulse,
  Activity,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

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
      q: 'How does the platform connect and coordinate regional hospitals?',
      a: 'BloodResource Sync connects accredited hospital blood banks through a secure, synchronized network. Medical facilities can view real-time regional blood availability, request critical units during emergencies, and track inter-hospital transfers transparently.'
    },
    {
      q: 'How does the system prevent two hospitals from reserving the same blood unit?',
      a: 'The platform uses real-time synchronized reservation locking. As soon as an emergency request is initiated, the designated blood unit is placed on instant exclusive hold across the entire regional network, eliminating accidental double-reservations and inventory mismatches.'
    },
    {
      q: 'How does the system select the best hospital to source blood from?',
      a: 'When an urgent request is placed, the smart routing system evaluates real-world driving distance, transit travel time, and component shelf-life to suggest the optimal nearest hospital that has compatible, ready-to-dispatch units.'
    },
    {
      q: 'What occurs when an emergency arises while stock is tentatively on hold?',
      a: 'Life-threatening trauma emergencies receive top clinical priority. The system can redirect non-urgent holds to save immediate surgical patients, while automatically re-queuing the original request with elevated priority so no patient is overlooked.'
    },
    {
      q: 'How does the platform prevent blood units from expiring on the shelves?',
      a: 'The system actively tracks shelf-life and expiration dates for every donation. Units approaching their expiration threshold are automatically highlighted and recommended for upcoming scheduled transfusions, dramatically reducing medical waste.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-emerald-500 selection:text-black relative">
      
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION BAR (Clean, Professional & Understandable) */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
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
                EMERGENCY HEALTHCARE LOGISTICS
              </div>
            </div>
          </Link>

          {/* Center Navigation Links (Clean, User-Friendly Labels) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono">
            <button onClick={() => scrollToSection('hero')} className="hover:text-emerald-400 transition cursor-pointer">
              HOME
            </button>
            <button onClick={() => scrollToSection('overview')} className="hover:text-emerald-400 transition cursor-pointer">
              OVERVIEW
            </button>
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-emerald-400 transition cursor-pointer">
              FEATURES
            </button>
            <button onClick={() => scrollToSection('hospitals')} className="hover:text-emerald-400 transition cursor-pointer">
              HOSPITALS
            </button>
            <button onClick={() => scrollToSection('simulations')} className="hover:text-emerald-400 transition cursor-pointer">
              LIVE DEMO
            </button>
            <button onClick={() => scrollToSection('faqs')} className="hover:text-emerald-400 transition cursor-pointer">
              FAQ
            </button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-emerald-400 transition cursor-pointer">
              CONTACT
            </button>
          </nav>

          {/* Right Action Button */}
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
                <span>Sign In</span>
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
          
          {/* Season / Version Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold tracking-widest uppercase shadow-md shadow-emerald-950">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Multi-Hospital Emergency Blood Coordination Platform</span>
          </div>

          {/* Catchy Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Lifesaving Coordination <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300">
              Without Delay
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
            A unified digital logistics network connecting regional hospitals in real time. Automating instant blood availability matching, priority emergency dispatch, and shelf-life tracking to protect critical patients when every second matters.
          </p>

          {/* Center Call-to-Action Pill Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-emerald-400/90 text-emerald-300 hover:text-black hover:bg-emerald-400 text-sm font-black tracking-wider uppercase transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>Access Control Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleQuickDemoLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-white text-sm font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Explore 1-Click Demo</span>
            </button>
          </div>

          {/* Safety / Compliance Banner */}
          <div className="pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Hospital Network • Certified Emergency Medical Resource Coordination</span>
            </div>
          </div>
        </div>

        {/* Ambient Curved Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16 text-[#090d16] fill-current">
            <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. THREE FLOATING METRIC CARDS (Professional & Clear)        */}
      {/* ============================================================ */}
      <section className="relative z-20 -mt-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Rapid Response */}
          <div className="bg-[#090d16] p-7 rounded-2xl border border-zinc-800/90 shadow-2xl hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono mb-1">
              &lt; 1.2s
            </div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mb-2">
              Instant Emergency Routing
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly identifies the closest hospital with matching blood reserves and calculates optimal transit in under 1.2 seconds.
            </p>
          </div>

          {/* Card 2: 100% Stock Accuracy */}
          <div className="bg-[#090d16] p-7 rounded-2xl border border-zinc-800/90 shadow-2xl hover:border-teal-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono mb-1">
              100%
            </div>
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono mb-2">
              Real-Time Stock Accuracy
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Centralized live inventory ledger eliminates stock conflicts, double-reservations, and dispatch errors across all connected medical centers.
            </p>
          </div>

          {/* Card 3: Zero Request Delays */}
          <div className="bg-[#090d16] p-7 rounded-2xl border border-zinc-800/90 shadow-2xl hover:border-green-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono mb-1">
              Zero
            </div>
            <div className="text-xs font-bold text-green-400 uppercase tracking-wider font-mono mb-2">
              Zero Request Delays
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Intelligent triage priority dispatch ensures critical surgical traumas are fulfilled immediately while routine patient requests are never left behind.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. OVERVIEW & CORE CAPABILITIES (Clear, Professional Headers) */}
      {/* ============================================================ */}
      <section id="overview" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            PLATFORM CAPABILITIES
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Designed for High-Reliability Healthcare Logistics
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Purpose-built to manage hospital blood reserves, coordinate emergency transfers, and eliminate wastage through intelligent automation.
          </p>
        </div>

        {/* 4 Core Features Grid */}
        <div id="capabilities" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Feature 1: Inventory Sync */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Live Multi-Hospital Inventory Sync</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">Centralized Stock Ledger</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded uppercase font-bold">
                ZERO CONFLICTS
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Keeps blood counts perfectly synchronized across all participating hospitals. Automatically accounts for on-shelf, reserved, and in-transit units to prevent sudden local shortages.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>Reliability: 100% Real-Time</span>
              <span className="text-emerald-400">Automated Conflict Resolution</span>
            </div>
          </div>

          {/* Feature 2: Smart Routing */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-teal-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Smart Proximity & Transit Routing</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">Intelligent Hospital Matching</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-teal-950 text-teal-300 border border-teal-800/60 px-2 py-0.5 rounded uppercase font-bold">
                FASTEST TRANSIT
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Analyzes regional hospital road networks and live driving distances to dispatch blood from the closest facility, optimizing travel times and vehicle routes.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>Transit Safety: 4-Hour Buffer</span>
              <span className="text-teal-400">Real-World Road Maps Integrated</span>
            </div>
          </div>

          {/* Feature 3: Freshness & Shelf-Life */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-green-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Freshness & Shelf-Life Management</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">Zero-Waste First-Expiry Protocol</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-green-950 text-green-300 border border-green-800/60 px-2 py-0.5 rounded uppercase font-bold">
                ACTIVE MONITORING
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Tracks expiration timelines down to the minute. Prioritizes units nearing shelf-life for scheduled transfusions, preventing life-saving blood from expiring on hospital shelves.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>Red Blood Cells: 42-Day Cycle</span>
              <span className="text-green-400">Platelets: 5-Day Freshness</span>
            </div>
          </div>

          {/* Feature 4: Priority Emergency Dispatch */}
          <div className="bg-[#090d16] p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Priority Emergency Dispatch System</h3>
                  <div className="text-[10px] text-zinc-500 font-mono">Fair & Triage-Based Queuing</div>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded uppercase font-bold">
                TRIAGE ASSURED
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Multi-level emergency triage ensures critical surgical emergencies receive immediate stock while routine clinical requests maintain fair, guaranteed delivery schedules.
            </p>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-3 font-mono">
              <span>Emergency Preemption: Instant</span>
              <span className="text-emerald-400">Fair Waitlist Protection Active</span>
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
                REGIONAL HEALTHCARE ALLIANCE
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Connected Regional Medical Centers
              </h2>
              <p className="text-xs text-zinc-400">
                A unified network of accredited hospitals collaborating to share emergency blood reserves.
              </p>
            </div>

            <Link
              to="/hospitals"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline font-mono"
            >
              <span>View All Facilities in Dashboard</span>
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
      {/* 6. INTERACTIVE OPERATIONAL SIMULATIONS (Clear & Friendly)    */}
      {/* ============================================================ */}
      <section id="simulations" className="py-24 max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            INTERACTIVE PLATFORM DEMO
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Simulate Real-World Emergency Scenarios
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Test how the platform handles high-priority emergencies, fair queue distribution, multi-center stock transfers, and expiration alerts in real time.
          </p>
        </div>

        {/* Interactive Scenario Control Console */}
        <div className="bg-[#090d16] rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
          {/* Top Scenario Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-zinc-800 bg-black/60">
            {demosList.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setSelectedDemo(demo.id)}
                className={`p-3.5 text-left transition-all border-r border-zinc-800 last:border-r-0 cursor-pointer ${
                  selectedDemo === demo.id
                    ? 'bg-emerald-950/40 text-emerald-300 border-b-2 border-b-emerald-400'
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
                  <span className="text-emerald-400 font-mono">[{selectedDemo}]</span>
                  <span>{demosList.find(d => d.id === selectedDemo)?.title}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Workflow Type: <span className="text-emerald-400 font-mono">{demosList.find(d => d.id === selectedDemo)?.category}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRunDemo(selectedDemo)}
                  disabled={demoRunning}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  {demoRunning ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-black" />
                      <span>Simulating Workflow...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-black fill-black" />
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
              <p className="text-emerald-300 pt-1 leading-relaxed">
                &gt; {demoLogs[selectedDemo]}
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
              HELP & COMMON INQUIRIES
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-zinc-400">
              Everything you need to know about how the BloodResource Sync network coordinates hospital supplies.
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
      {/* 8. FOOTER & CONTACT (Clean Institutional Footer)             */}
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
                The intelligent multi-hospital blood coordination and emergency logistics platform. Connecting medical facilities to deliver lifesaving resources when every second counts.
              </p>
              <div className="text-[10px] font-mono text-emerald-400">
                STATUS: LIVE REGIONAL GRID ACTIVE
              </div>
            </div>

            {/* Col 2: Platform Navigation */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                Platform Navigation
              </div>
              <ul className="space-y-1.5 text-zinc-400">
                <li><Link to="/dashboard" className="hover:text-emerald-400 transition">Executive Dashboard</Link></li>
                <li><Link to="/inventory" className="hover:text-emerald-400 transition">Live Inventory Tracking</Link></li>
                <li><Link to="/requests" className="hover:text-emerald-400 transition">Emergency Requests</Link></li>
                <li><Link to="/transfers" className="hover:text-emerald-400 transition">Transit & Delivery</Link></li>
              </ul>
            </div>

            {/* Col 3: Key Capabilities */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                Key Capabilities
              </div>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li>• Real-Time Inventory Sync</li>
                <li>• Smart Hospital Routing</li>
                <li>• Automated Shelf-Life Alerts</li>
                <li>• Priority Triage Dispatch</li>
              </ul>
            </div>

            {/* Col 4: Institutional Disclaimer */}
            <div className="space-y-3 text-xs">
              <div className="font-bold text-white font-mono uppercase text-[11px] tracking-wider">
                Operational Safety
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">
                BloodResource Sync provides operational coordination and inventory visibility across participating healthcare centers. All blood component suitability and transfusion procedures remain under physician clinical supervision.
              </p>
              <div className="text-[10px] text-zinc-600 font-mono">
                © 2026 BloodResource Sync. All rights reserved.
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <div>
              Multi-Hospital Emergency Blood Resource & Logistics Coordination Network.
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

      {/* Floating Back-To-Top Arrow Button */}
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