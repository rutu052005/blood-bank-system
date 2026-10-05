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
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-crimson-600" /> Engine Weight & Hyperparameter Settings
        </h1>
        <p className="text-xs text-slate-500">
          Editable parameters for Matching scores, OS scheduler aging steps, hold TTL, and alert escalation times.
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
