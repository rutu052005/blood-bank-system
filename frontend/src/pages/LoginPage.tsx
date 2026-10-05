import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import { Droplets, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.local');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        msg = 'Unable to connect to backend server. Please make sure backend is running on port 5000.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
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
        msg = 'Unable to connect to backend server. Please make sure backend is running on port 5000.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-crimson-600/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-crimson-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl mx-auto shadow-lg shadow-crimson-600/30">
            B
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">BloodResource Sync</h1>
          <p className="text-xs text-slate-400">Multi-Hospital Priority Resource System</p>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-crimson-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-crimson-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-crimson-600 hover:bg-crimson-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-crimson-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Control System'}
          </button>
        </form>

        {/* Quick Demo Login Presets */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Click any account below for 1-Click Instant Login:
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@demo.local')}
              className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 rounded-xl text-left transition"
            >
              <div className="font-bold text-white text-xs">👑 System Admin</div>
              <div className="text-[10px] text-slate-400">Full control & settings</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('priya@demo.local')}
              className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 rounded-xl text-left transition"
            >
              <div className="font-bold text-white text-xs">📋 Request Manager</div>
              <div className="text-[10px] text-slate-400">Issue blood requests</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('anil@demo.local')}
              className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 rounded-xl text-left transition"
            >
              <div className="font-bold text-white text-xs">🩸 Inventory Mgr</div>
              <div className="text-[10px] text-slate-400">Stock & transfer receipt</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sneha@demo.local')}
              className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 rounded-xl text-left transition"
            >
              <div className="font-bold text-white text-xs">🏥 Hospital Admin</div>
              <div className="text-[10px] text-slate-400">Approve requests</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
