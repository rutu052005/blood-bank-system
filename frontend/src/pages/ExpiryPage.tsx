import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BloodUnit } from '../types/index.js';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ExpiryPage: React.FC = () => {
  const [fefoUnits, setFefoUnits] = useState<BloodUnit[]>([]);

  const fetchFEFO = () => {
    api.getFEFOInventory().then(res => setFefoUnits(res)).catch(() => {});
  };

  useEffect(() => {
    fetchFEFO();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" /> Expiry & Shelf-Life Management
          </h1>
          <p className="text-xs text-zinc-400">
            Automated freshness tracking prioritizing units nearing expiration for immediate scheduled use.
          </p>
        </div>

        <button
          onClick={() => api.triggerExpiryTick().then(fetchFEFO)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3.5 py-2 rounded-xl text-xs transition"
        >
          Check Expiry Status
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Unit ID</th>
                <th className="p-3">Hospital</th>
                <th className="p-3">Blood Group / Component</th>
                <th className="p-3">Available Qty</th>
                <th className="p-3">Collection Date</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {fefoUnits.map((unit) => {
                let badge = 'bg-emerald-100 text-emerald-800';
                if (unit.tier === 'NEAR_EXPIRY') badge = 'bg-amber-100 text-amber-800';
                if (unit.tier === 'CRITICAL') badge = 'bg-rose-100 text-rose-800 font-bold animate-pulse';

                return (
                  <tr key={unit.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{unit.id}</td>
                    <td className="p-3">{unit.hospital_name}</td>
                    <td className="p-3 font-bold text-slate-900">{unit.blood_group} {unit.component}</td>
                    <td className="p-3 font-mono font-bold">{unit.available_quantity} units</td>
                    <td className="p-3 text-slate-500 font-mono">{unit.collection_date}</td>
                    <td className="p-3 text-slate-900 font-mono font-bold">{unit.expiry_date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black ${badge}`}>
                        {unit.tier || 'VALID'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
