import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useSimClock } from '../context/SimClockContext.js';
import { Bell, Clock, LogOut, FastForward, RotateCcw, Droplets } from 'lucide-react';
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
    <header className="bg-black/95 backdrop-blur-xl text-white border-b border-zinc-800/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Brand */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center font-black text-lg text-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Droplets className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight leading-none text-white flex items-center gap-1">
              <span>BloodResource</span>
              <span className="text-emerald-400 font-black">Sync</span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono tracking-wider">OBSIDIAN HEALTH GRID</div>
          </div>
        </Link>

        {/* Simulated Time Banner Controls */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-900/90 px-3.5 py-1.5 rounded-xl border border-zinc-800 text-xs shadow-inner">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-zinc-400">Sim:</span>
            <span className="text-emerald-300 font-bold">{formattedTime}</span>
            {offsetHours > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md font-sans font-bold border border-emerald-500/30">
                +{offsetHours}h
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Time Advance Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => advanceTime(1)}
              className="hover:bg-emerald-950/80 hover:text-emerald-300 text-zinc-300 px-2 py-0.5 rounded-lg transition text-[11px] font-semibold flex items-center gap-0.5"
              title="Advance 1 Hour"
            >
              <FastForward className="w-3 h-3 text-emerald-400" /> +1h
            </button>
            <button
              onClick={() => advanceTime(24)}
              className="hover:bg-emerald-950/80 hover:text-emerald-300 text-zinc-300 px-2 py-0.5 rounded-lg transition text-[11px] font-semibold"
              title="Advance 1 Day"
            >
              +1d
            </button>
            <button
              onClick={() => advanceTime(72)}
              className="hover:bg-emerald-950/80 hover:text-emerald-300 text-zinc-300 px-2 py-0.5 rounded-lg transition text-[11px] font-semibold"
              title="Advance 3 Days"
            >
              +3d
            </button>
            <button
              onClick={resetTime}
              className="hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-lg transition text-[11px] flex items-center gap-1 ml-1"
              title="Reset Simulated Clock"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* SSE & User Section */}
        <div className="flex items-center gap-4">
          {/* SSE Live Status Indicator */}
          <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900/90 px-3 py-1 rounded-full border border-zinc-800">
            <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="hidden lg:inline text-[11px] font-mono text-emerald-400">
              {sseConnected ? 'STREAM ACTIVE' : 'LIVE GRID READY'}
            </span>
          </div>

          {/* Notifications Badge */}
          <Link to="/alerts" className="relative p-2 text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900 rounded-xl transition">
            <Bell className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-black text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-md shadow-emerald-500/50">
                {criticalCount}
              </span>
            )}
          </Link>

          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-emerald-400 font-mono font-medium">{user.role.replace('_', ' ')}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-xl transition"
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
