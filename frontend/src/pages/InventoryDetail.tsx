import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { ArrowLeft, Clock, History, ShieldAlert } from 'lucide-react';

export const InventoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<any>(null);

  useEffect(() => {
    if (id) {
      api.getInventoryById(id)
        .then(res => setUnit(res))
        .catch(() => {});
    }
  }, [id]);

  if (!unit) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading unit details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/inventory" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-mono">Inventory Unit {unit.id}</h1>
          <p className="text-xs text-slate-500">{unit.hospital_name} — {unit.blood_group} {unit.component}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">Unit Invariants</h2>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Quantity:</span>
              <span className="font-bold text-slate-900">{unit.quantity_total} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Held Quantity:</span>
              <span className="font-bold text-amber-600">{unit.quantity_held} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">In Transit:</span>
              <span className="font-bold text-blue-600">{unit.quantity_in_transit} units</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-700 font-bold">Net Available:</span>
              <span className="font-black text-emerald-600">{unit.available_quantity} units</span>
            </div>
          </div>
        </div>

        {/* Expiry Tier Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">Expiry Engine Tier State</h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Collection Date:</span>
              <span className="font-mono text-slate-700">{unit.collection_date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Expiry Date:</span>
              <span className="font-mono font-bold text-slate-900">{unit.expiry_date}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-slate-500">Current Tier:</span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                {unit.tier || 'VALID'}
              </span>
            </div>
          </div>
        </div>

        {/* Holds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">Active Holds</h2>
          {unit.holds.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No active holds placed on this unit.</p>
          ) : (
            unit.holds.map((h: any) => (
              <div key={h.id} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span>{h.request_id}</span>
                  <span className="text-amber-600">Qty {h.quantity}</span>
                </div>
                <div className="text-[10px] text-slate-500">Expires: {new Date(h.expires_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Movement Ledger Audit History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-crimson-600" /> Movement Ledger Audit Trail
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
              {unit.movements.map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{m.movement_type}</td>
                  <td className="p-3 font-bold">{m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}</td>
                  <td className="p-3 text-slate-600">{m.reference_id || 'N/A'}</td>
                  <td className="p-3 text-slate-600">{m.performed_by || 'SYSTEM'}</td>
                  <td className="p-3 text-slate-500">{m.notes}</td>
                  <td className="p-3 text-slate-500">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
