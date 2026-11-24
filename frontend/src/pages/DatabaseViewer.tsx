import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const DatabaseViewer: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('hospitals');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTables = () => {
    setLoading(true);
    api.getDatabaseTables()
      .then(res => {
        const tbls = res?.tables || [];
        setTables(tbls);
        if (tbls.length > 0 && !tbls.some((t: any) => t.name === selectedTable)) {
          setSelectedTable(tbls[0].name);
        }
      })
      .catch(err => {
        console.warn('[DatabaseViewer Fetch Error]', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleEraseData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to erase operational records?\n\nThis will wipe all blood inventory, requests, holds, movements, and alerts in Supabase. Only the System Admin user and reference hospital nodes will remain.'
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await api.eraseDatabase(true);
      setMessage(res.message || 'Database successfully wiped clean in Supabase!');
      fetchTables();
    } catch (err: any) {
      setMessage(`Error erasing database: ${err.message || 'Failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database back to standard academic demo state?')) return;
    setLoading(true);
    setMessage('');
    try {
      await api.resetSim();
      setMessage('Demo seed dataset reloaded successfully.');
      fetchTables();
    } catch (err: any) {
      setMessage(`Error resetting demo: ${err.message || 'Failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const activeTable = tables.find(t => t.name === selectedTable) || tables[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" /> System Records Inspector (Supabase Live)
          </h1>
          <p className="text-xs text-zinc-400">
            Secure administrative inspection of 10 consolidated Supabase tables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEraseData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Erase Existing Data
          </button>
          <button
            onClick={fetchTables}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Records
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* 10 Merged Tables Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="font-bold text-zinc-300 uppercase tracking-wider">
            Consolidated Database Schema (Exact 10 Tables)
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-extrabold text-[10px]">
            {tables.length} / 10 Tables Synchronized
          </span>
        </div>

        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto font-mono text-xs">
          {tables.map(t => {
            const isSelected = selectedTable === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                  isSelected 
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md font-black' 
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800'
                }`}
              >
                <span>{t.name}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  isSelected ? 'bg-black text-emerald-300' : 'bg-black/40 text-zinc-400 border border-zinc-800'
                }`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && tables.length === 0 ? (
        <div className="bg-zinc-900/60 p-12 rounded-2xl border border-zinc-800 text-center text-zinc-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <span>Querying Supabase PostgreSQL tables...</span>
        </div>
      ) : activeTable ? (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="font-extrabold text-slate-900 text-sm font-mono flex items-center gap-2">
                <span>Table: {activeTable.name}</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {activeTable.count} records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTable.name === 'blood_inventory' && '⚡ Holds physical stock units + dynamic FEFO expiry tier state (Engine 1 & 3).'}
                {activeTable.name === 'blood_requests' && '⚡ Consolidates demand orders + line items JSONB + match scores (Engine 2).'}
                {activeTable.name === 'alerts' && '⚡ Combines critical escalation alerts + outbound notification delivery (Engine 3).'}
                {activeTable.name === 'audit_logs' && '⚡ Consolidated master compliance trail, engine loops, and scheduler runs.'}
                {activeTable.name === 'hospitals' && 'Healthcare facility master nodes and regional network locations.'}
                {activeTable.name === 'users' && 'Staff accounts, bcrypt passwords, and Role-Based Access Control (RBAC).'}
                {activeTable.name === 'hospital_distances' && 'Weighted road network graph distance matrix for Dijkstra shortest path (Engine 4).'}
                {activeTable.name === 'inventory_holds' && 'Tentative two-phase reservation locks (2PL) with hold expiration TTL (Engine 1).'}
                {activeTable.name === 'inventory_movements' && 'Immutable double-entry transaction ledger tracking all physical stock modifications (Engine 1).'}
                {activeTable.name === 'transfers' && 'Inter-hospital logistics transit tracking from dispatch to recipient confirmation (Engine 4).'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <pre className="text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono max-h-96 overflow-y-auto">
              {JSON.stringify(activeTable.data, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 p-8 rounded-2xl border border-zinc-800 text-center text-zinc-400 font-mono text-xs">
          Select a table above to view records.
        </div>
      )}
    </div>
  );
};
