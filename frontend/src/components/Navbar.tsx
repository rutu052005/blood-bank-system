import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useSimClock } from '../context/SimClockContext.js';
import { Bell, Clock, User as UserIcon, LogOut, Activity, FastForward, RotateCcw } from 'lucide-react';
import { api } from '../services/api.js';
import { Alert } from '../types/index.js';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { simTime, offsetHours, sseConnected, advanceTime, resetTime } = useSimClock();
  const [criticalCount, setCriticalCount] = useState<number>(0);

  useEffect(() => {
    const fetchAlerts = () => {
      api.getAlerts()
        .then(alerts => {
          const unackCritical = alerts.filter((a: Alert) => a.severity === 'CRITICAL' && !a.is_acknowledged);
          setCriticalCount(unackCritical.length);
        })
        .catch(() => {});
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = new Date(simTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-crimson-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-crimson-600/30">
            B
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight leading-none text-white">
              BloodResource <span className="text-crimson-500 font-semibold">Sync</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Multi-Hospital Priority Sharing System</div>
          </div>
        </div>

        {/* Simulated Time Banner Controls */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
          <Clock className="w-4 h-4 text-crimson-400 shrink-0" />
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-300">Simulated:</span>
            <span className="text-amber-400 font-bold">{formattedTime}</span>
            {offsetHours > 0 && (
              <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold">
                +{offsetHours}h
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Time Advance Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => advanceTime(1)}
              className="hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded transition text-[11px] font-medium flex items-center gap-0.5"
              title="Advance 1 Hour"
            >
              <FastForward className="w-3 h-3 text-crimson-400" /> +1h
            </button>
            <button
              onClick={() => advanceTime(24)}
              className="hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded transition text-[11px] font-medium"
              title="Advance 1 Day"
            >
              +1d
            </button>
            <button
              onClick={() => advanceTime(72)}
              className="hover:bg-slate-700 text-slate-300 hover:text-white px-1.5 py-0.5 rounded transition text-[11px] font-medium"
              title="Advance 3 Days"
            >
              +3d
            </button>
            <button
              onClick={resetTime}
              className="hover:bg-rose-900/50 text-rose-300 px-1.5 py-0.5 rounded transition text-[11px] flex items-center gap-1 ml-1"
              title="Reset Simulated Clock"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* SSE & User Section */}
        <div className="flex items-center gap-4">
          {/* SSE Live Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50">
            <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="hidden lg:inline text-[11px] font-medium">
              {sseConnected ? 'SSE Live Sync' : 'Connecting SSE...'}
            </span>
          </div>

          {/* Notifications Badge */}
          <Link to="/alerts" className="relative p-2 text-slate-300 hover:text-white transition">
            <Bell className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-md">
                {criticalCount}
              </span>
            )}
          </Link>

          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-crimson-400 font-medium">{user.role.replace('_', ' ')}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
