import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const PersistentBanner: React.FC = () => {
  return (
    <div className="bg-[#030712] border-b border-emerald-500/30 text-emerald-300 px-4 py-1.5 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 tracking-wide shadow-sm">
      <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
      <span>MULTI-HOSPITAL EMERGENCY LOGISTICS PORTAL — All clinical transfusion orders require verified physician signoff.</span>
    </div>
  );
};
