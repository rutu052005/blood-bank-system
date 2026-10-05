import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { AuditLog } from '../types/index.js';
import { ShieldCheck, Search } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.getAuditLogs().then(res => setLogs(res)).catch(() => {});
  }, []);

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(filter.toLowerCase()) ||
    l.entity_id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-crimson-600" /> Immutable Security Audit Ledger
          </h1>
          <p className="text-xs text-slate-500">Every inventory mutation and engine decision writes a ledger entry.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit actions (e.g. CREATED_REQUEST, PLACED_HOLD, PREEMPTED)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-mono text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3">Details</th>
                <th className="p-3">User</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-crimson-600">{log.action}</td>
                  <td className="p-3 font-bold text-slate-700">{log.entity_type}</td>
                  <td className="p-3 font-bold text-slate-900">{log.entity_id}</td>
                  <td className="p-3 text-slate-600 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                  <td className="p-3 text-slate-500">{log.user_id || 'SYSTEM'}</td>
                  <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
