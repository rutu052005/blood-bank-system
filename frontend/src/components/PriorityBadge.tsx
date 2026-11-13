import React from 'react';
import { PriorityLevel } from '../types/index.js';
import { Flame, AlertCircle, Clock } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  switch (priority) {
    case 'EMERGENCY':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-950/80 text-rose-300 border border-rose-700/60 shadow-sm animate-pulse ${className}`}>
          <Flame className="w-3.5 h-3.5 fill-rose-400 text-rose-300" />
          EMERGENCY
        </span>
      );
    case 'URGENT':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 shadow-sm ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          URGENT
        </span>
      );
    case 'ROUTINE':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          ROUTINE
        </span>
      );
  }
};
