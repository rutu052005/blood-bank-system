import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { ArrowLeft, Clock, History, ShieldAlert, Droplets } from 'lucide-react';

export const InventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.getInventoryById(id)
        .then(res => {
          if (res) {
            setUnit({
              ...res,
              holds: Array.isArray(res.holds) ? res.holds : [],
              movements: Array.isArray(res.movements) ? res.movements : [],
            });
          }
        })
        .catch(err => {
          console.warn('[InventoryDetail Fetch Error]', err);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <span>Loading inventory unit #{id} details from database...</span>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/inventory" className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-extrabold text-white font-mono flex items-center gap-2">
            <Droplets className="w-5 h-5 text-emerald-400" /> Inventory Unit #{id}
          </h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 font-mono text-xs flex flex-col items-center justify-center gap-4 max-w-md mx-auto shadow-2xl">
          <ShieldAlert className="w-10 h-10 text-amber-400" />
          <div>
            <p className="font-bold text-sm text-slate-100">Unit #{id} Not Found</p>
            <p className="text-slate-400 text-xs mt-1">This unit was not found in the live Supabase database or local cache.</p>
          </div>
          <Link to="/inventory" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition text-xs">
            Return to Inventory
          </Link>
        </div>
      </div>
    );
  }

  const holds = Array.isArray(unit.holds) ? unit.holds : [];
  const movements = Array.isArray(unit.movements) ? unit.movements : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/inventory" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white font-mono flex items-center gap-2">
              <Droplets className="w-5 h-5 text-emerald-400" /> Inventory Unit {unit.id}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {unit.status || 'AVAILABLE'}
            </span>
          </div>
          <p className="text-xs text-zinc-400">{unit.hospital_name || 'Hospital'} — {unit.blood_group} {unit.component}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Unit Invariants</span>
            <span className="text-[10px] text-slate-500 font-mono">DBMS Single-Writer</span>
          </h2>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Quantity:</span>
              <span className="font-bold text-slate-900">{unit.quantity_total ?? 0} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Held Quantity:</span>
              <span className="font-bold text-amber-600">{unit.quantity_held ?? 0} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">In Transit:</span>
              <span className="font-bold text-blue-600">{unit.quantity_in_transit ?? 0} units</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-700 font-bold">Net Available:</span>
              <span className="font-black text-emerald-600">{unit.available_quantity ?? unit.quantity_total ?? 0} units</span>
            </div>
          </div>
        </div>

        {/* Expiry Tier Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Expiry Engine Tier</span>
            <span className="text-[10px] text-slate-500 font-mono">FEFO Dynamic</span>
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Collection Date:</span>
              <span className="font-mono text-slate-700">{unit.collection_date || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Expiry Date:</span>
              <span className="font-mono font-bold text-slate-900">{unit.expiry_date || 'N/A'}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-slate-500">Current Tier:</span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                {unit.tier || unit.expiry_tier || 'VALID'}
              </span>
            </div>
          </div>
        </div>

        {/* Holds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Active Holds</span>
            <span className="text-[10px] text-slate-500 font-mono">{holds.length} locks</span>
          </h2>
          {holds.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No active two-phase reservation locks on this unit.</p>
          ) : (
            holds.map((h: any) => (
              <div key={h.id} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span>{h.request_id}</span>
                  <span className="text-amber-600">Qty {h.quantity}</span>
                </div>
                <div className="text-[10px] text-slate-500">Expires: {h.expires_at ? new Date(h.expires_at).toLocaleString() : 'N/A'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Movement Ledger Audit History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600" /> Double-Entry Movement Ledger (Engine 1 Audit Trail)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Qty Change</th>
                <th className="p-3">Reference ID</th>
                <th className="p-3">Performed By</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                    No ledger transactions recorded for this unit yet.
                  </td>
                </tr>
              ) : (
                movements.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{m.movement_type}</td>
                    <td className="p-3 font-bold text-emerald-600">{m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}</td>
                    <td className="p-3 text-slate-600">{m.reference_id || 'N/A'}</td>
                    <td className="p-3 text-slate-600">{m.performed_by || 'SYSTEM'}</td>
                    <td className="p-3 text-slate-500">{m.notes || 'Routine transaction'}</td>
                    <td className="p-3 text-slate-500">{m.created_at ? new Date(m.created_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
