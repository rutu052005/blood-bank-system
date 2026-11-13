import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.getSettings().then(res => setSettings(res)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" /> Platform Configuration & Settings
        </h1>
        <p className="text-xs text-zinc-400">
          Configurable parameters for matching priorities, queue aging intervals, reservation hold timeouts, and alert thresholds.
        </p>
      </div>

      {settings && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs overflow-x-auto">
          <pre className="text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
