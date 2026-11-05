import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const DatabaseViewer: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('hospitals');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTables = () => {
    api.getDatabaseTables()
      .then(res => setTables(res.tables || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleEraseData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to erase existing data?\n\nThis will wipe all blood inventory, requests, holds, movements, and alerts. Only the System Admin user and hospital nodes will remain.'
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage('');
    try {
      const res = await api.eraseDatabase(true);
      setMessage(res.message || 'Database successfully wiped clean!');
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

  const activeTable = tables.find(t => t.name === selectedTable);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-crimson-600" /> Database Inspector (Supabase & Engine Store)
          </h1>
          <p className="text-xs text-slate-500">
            Admin tool showing raw schema tables and record counts. Secrets are never exposed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEraseData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Erase Existing Data
          </button>
          <button
            onClick={handleResetDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Reload Demo Seed
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* 10 Merged Tables Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <span className="font-bold text-slate-700 uppercase tracking-wider">
            Consolidated Database Schema (Exact 10 Merged Tables)
          </span>
          <span className="bg-crimson-50 text-crimson-700 px-2 py-0.5 rounded-full font-extrabold text-[10px]">
            {tables.length} / 10 Tables Active
          </span>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto font-mono text-xs">
          {tables.map(t => {
            const isSelected = selectedTable === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`px-3 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 border ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>{t.name}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTable && (
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
                {activeTable.name === 'blood_inventory' && '⚡ Merged Table: Holds physical stock units + dynamic FEFO expiry tier state (eliminates 1:1 joins).'}
                {activeTable.name === 'blood_requests' && '⚡ Merged Table: Consolidates demand orders + line items + match explanation scores + state history JSON.'}
                {activeTable.name === 'alerts' && '⚡ Merged Table: Combines critical escalation alerts + outbound notification delivery channels.'}
                {activeTable.name === 'audit_logs' && '⚡ Merged Table: Consolidated master compliance trail, engine loops, and scheduler runs.'}
                {activeTable.name === 'hospitals' && 'Healthcare facility master nodes and regional network locations.'}
                {activeTable.name === 'users' && 'Staff accounts, bcrypt passwords, and Role-Based Access Control (RBAC).'}
                {activeTable.name === 'hospital_distances' && 'Weighted road network graph distance matrix for Dijkstra shortest path computation.'}
                {activeTable.name === 'inventory_holds' && 'Tentative two-phase reservation locks (2PL) with hold expiration TTL.'}
                {activeTable.name === 'inventory_movements' && 'Immutable double-entry transaction ledger tracking all physical stock modifications.'}
                {activeTable.name === 'transfers' && 'Inter-hospital logistics transit tracking from dispatch to recipient confirmation.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <pre className="text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono max-h-96 overflow-y-auto">
              {JSON.stringify(activeTable.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
