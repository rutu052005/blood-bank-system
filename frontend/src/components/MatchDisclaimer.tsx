import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const MatchDisclaimer: React.FC = () => {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 my-3 text-xs text-rose-900 flex items-start gap-2.5">
      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      <div>
        <div className="font-bold text-rose-800 uppercase tracking-wide text-[11px] mb-0.5">
          Potential Match — Requires Authorized Review
        </div>
        <p className="leading-relaxed">
          Potential match identified from recorded inventory attributes. Final authorization and clinical suitability remain with qualified personnel.
        </p>
      </div>
    </div>
  );
};
