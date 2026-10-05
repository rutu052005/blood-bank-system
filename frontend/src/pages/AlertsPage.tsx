import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Alert } from '../types/index.js';
import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = () => {
    api.getAlerts().then(res => setAlerts(res)).catch(() => {});
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-crimson-600" /> Prioritized Alerts & Escalation Log
          </h1>
          <p className="text-xs text-slate-500">
            Alerts sorted by severity (CRITICAL first). Unacknowledged CRITICAL alerts escalate over simulated time.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          let borderClass = 'border-slate-200 bg-white';
          let icon = <Info className="w-4 h-4 text-blue-500 shrink-0" />;
          let sevBadge = 'bg-blue-100 text-blue-800';

          if (alert.severity === 'WARNING') {
            borderClass = 'border-amber-200 bg-amber-50/30';
            icon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
            sevBadge = 'bg-amber-100 text-amber-900';
          } else if (alert.severity === 'CRITICAL') {
            borderClass = 'border-rose-300 bg-rose-50/40';
            icon = <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
            sevBadge = 'bg-rose-600 text-white font-black animate-pulse';
          }

          return (
            <div key={alert.id} className={`p-4 rounded-xl border ${borderClass} shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div className="flex items-start gap-3">
                {icon}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${sevBadge}`}>
                      {alert.severity}
                    </span>
                    <h3 className="font-extrabold text-xs text-slate-900">{alert.title}</h3>
                    {alert.escalation_level > 0 && (
                      <span className="bg-purple-100 text-purple-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        Escalation L{alert.escalation_level}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{alert.message}</p>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Created: {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                {!alert.is_acknowledged ? (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
