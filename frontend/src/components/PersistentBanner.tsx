import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const PersistentBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm border-b border-amber-600">
      <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce text-slate-950" />
      <span>DEMO DATA ONLY — NOT FOR CLINICAL OR OPERATIONAL USE. System decisions require human authorization.</span>
    </div>
  );
};
