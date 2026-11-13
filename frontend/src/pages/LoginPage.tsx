import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  ShieldCheck,
  Activity,
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Network,
  Clock,
  Layers,
  Building2,
  CheckCircle2,
  KeyRound,
  Shield,
  HeartPulse,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState('admin@demo.local');

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      let msg = err.message || 'Login failed';
      if (msg.includes('500') || msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch')) {
        msg = 'Unable to connect to backend server. Operating in offline demo fallback.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setActiveRole(userEmail);
    setEmail(userEmail);
    setPassword('demo123');
    setError('');
    setLoading(true);
    try {
      await login({ email: userEmail, password: 'demo123' });
      navigate('/');
    } catch (err: any) {
      let msg = err.message || 'Login failed';
      if (msg.includes('500') || msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch')) {
        msg = 'Unable to connect to backend server. Operating in offline demo fallback.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    {
      id: 'admin@demo.local',
      title: 'System Admin',
      name: 'Dr. Suresh Admin',
      hospital: 'Metro City Hospital',
      tag: 'FULL ROOT ACCESS',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: ShieldCheck,
      description: 'Control Center, Engine pause/resume & Scenarios S1-S6',
    },
    {
      id: 'priya@demo.local',
      title: 'Request Manager',
      name: 'Priya Shah',
      hospital: 'District Hospital',
      tag: 'MLFQ QUEUES',
      tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: Network,
      description: 'Issue blood requests, monitor Dijkstra matches',
    },
    {
      id: 'anil@demo.local',
      title: 'Inventory Manager',
      name: 'Anil Kumar',
      hospital: 'KLE Hospital',
      tag: 'FEFO LEDGER',
      tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: Droplets,
      description: 'Single-writer stock entries & transfer verification',
    },
    {
      id: 'sneha@demo.local',
      title: 'Hospital Admin',
      name: 'Dr. Sneha Joshi',
      hospital: 'Sahyadri Medical Center',
      tag: 'AUTHORIZATION',
      tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: Building2,
      description: 'Authorize inter-hospital transfers & safety signoffs',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden font-sans selection:bg-crimson-600 selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-crimson-600/15 via-rose-600/10 to-transparent rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-crimson-700/20 via-amber-600/5 to-transparent rounded-full blur-[130px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-black/80">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: HERO SHOWCASE & HOSPITAL BRANDING (5 Cols)     */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900/90 to-crimson-950/40 border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-crimson-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-crimson-600 to-rose-500 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-crimson-600/40 ring-2 ring-crimson-400/30">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-crimson-500 ring-2 ring-slate-950"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xl tracking-tight text-white">
                    <span>BloodResource</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-400 to-rose-400 font-black">Sync</span>
                  </div>
                  <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    Multi-Hospital Engine System
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-crimson-950/60 border border-crimson-600/30 text-crimson-300 text-xs font-semibold">
                <HeartPulse className="w-3.5 h-3.5 text-crimson-400 animate-pulse" />
                <span>Regional Blood Bank Grid Active</span>
              </div>

              {/* Hero Headline */}
              <div className="space-y-3">
                <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight">
                  Priority-Driven Blood Coordination & <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-crimson-400 to-amber-300">Expiry Prevention</span>
                </h2>
                <p className="text-xs text-slate-300/90 leading-relaxed font-normal">
                  Real-time algorithmic dispatch connecting district hospitals, trauma units, and specialty clinics with single-writer ledger integrity.
                </p>
              </div>

              {/* 3 Core Engines Feature Pills */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 hover:border-crimson-500/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-crimson-500/15 border border-crimson-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      Dijkstra Shortest-Path Matching
                      <span className="text-[9px] font-mono text-crimson-400 bg-crimson-950 px-1.5 py-0.2 rounded border border-crimson-800/50">DSA</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Sub-second route evaluation over regional transit matrices with transparent suitability scores.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 hover:border-crimson-500/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      Min-Heap Expiry Tracking (FEFO)
                      <span className="text-[9px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-800/50">Heap</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Event-driven shelf-life monitoring preventing critical RBC and Platelet wastage.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 hover:border-crimson-500/40 transition">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      OS Multilevel Feedback Queue (MLFQ)
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/50">OS</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Aging math and Banker’s deadlock avoidance guaranteeing starvation-free allocation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proof Badges */}
            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 5 Hospitals Active
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero Wastage Protocol
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-crimson-400" /> Secured
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: POLISHED GLASS AUTHENTICATION PORTAL (7 Cols)  */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-between bg-slate-900/40">
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-crimson-400" />
                    Authorized Access Portal
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a verified role or sign in with institutional credentials
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold self-start sm:self-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  System Online
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-rose-950/70 border border-rose-800/80 text-rose-200 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-shake">
                  <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Personnel Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@hospital.local"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-xs font-medium placeholder-slate-600 focus:outline-none focus:border-crimson-500 focus:ring-1 focus:ring-crimson-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      Security Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white text-xs font-medium placeholder-slate-600 focus:outline-none focus:border-crimson-500 focus:ring-1 focus:ring-crimson-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-crimson-600 via-rose-600 to-crimson-700 hover:from-crimson-500 hover:to-rose-500 text-white font-black py-3 px-4 rounded-xl text-xs tracking-wide shadow-xl shadow-crimson-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Authenticating System Token...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Control Center</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </form>

              {/* 1-Click Interactive Presets */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-crimson-400" />
                    <span>Instant 1-Click Institutional Profiles</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Password: demo123</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {demoRoles.map((role) => {
                    const RoleIcon = role.icon;
                    const isSelected = activeRole === role.id;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleQuickLogin(role.id)}
                        className={`p-3 rounded-2xl text-left border transition-all duration-200 relative group overflow-hidden ${
                          isSelected
                            ? 'bg-crimson-950/40 border-crimson-500/80 shadow-lg shadow-crimson-900/30 ring-1 ring-crimson-500/40'
                            : 'bg-slate-950/50 hover:bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-crimson-500 text-white' : 'bg-slate-800 text-slate-300 group-hover:text-white group-hover:bg-slate-700'
                            } transition`}>
                              <RoleIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-xs tracking-tight">
                                {role.title}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {role.name}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-full border ${role.tagColor}`}>
                            {role.tag}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-1">
                          {role.description}
                        </p>

                        <div className="mt-2 text-[9px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-800/40 pt-1.5">
                          <span className="text-slate-400 font-sans">{role.hospital}</span>
                          <span className="text-crimson-400 font-semibold group-hover:underline">Login →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-6 mt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
              <span className="text-slate-400">
                Persistent Disclaimer: <span className="text-slate-300">Potential matches require authorized clinical review.</span>
              </span>
              <span className="font-mono text-slate-400">
                v2.4 Academic Prototype
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
