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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm animate-pulse ${className}`}>
          <Flame className="w-3.5 h-3.5 fill-white text-rose-200" />
          EMERGENCY
        </span>
      );
    case 'URGENT':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-sm ${className}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          URGENT
        </span>
      );
    case 'ROUTINE':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700 ${className}`}>
          <Clock className="w-3.5 h-3.5" />
          ROUTINE
        </span>
      );
  }
};
