import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Hospital } from '../types/index.js';
import { Building2 } from 'lucide-react';

export const HospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    api.getHospitals().then(res => setHospitals(res)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-crimson-600" /> Participating Hospital Nodes
        </h1>
        <p className="text-xs text-slate-500">Registered blood bank network nodes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map((h) => (
          <div key={h.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-slate-400">{h.id}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {h.status}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900">{h.name}</h3>
            <p className="text-xs text-slate-500">{h.address}</p>
            <div className="text-xs font-mono font-bold text-crimson-600 pt-2 border-t border-slate-100">
              📞 {h.contact_number}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
