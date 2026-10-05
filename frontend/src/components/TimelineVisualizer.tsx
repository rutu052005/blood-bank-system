import React from 'react';
import { RequestStatus, TransferStatus } from '../types/index.js';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';

interface TimelineVisualizerProps {
  requestStatus: RequestStatus;
  transferStatus?: TransferStatus;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({ requestStatus, transferStatus }) => {
  const steps = [
    { key: 'PENDING', label: 'Request Registered', desc: 'Queued by priority' },
    { key: 'MATCHED', label: 'Matches Found', desc: 'Tentative holds placed' },
    { key: 'APPROVED', label: 'Human Approval', desc: 'Authorized personnel' },
    { key: 'IN_TRANSIT', label: 'In Transit', desc: 'Unit dispatched' },
    { key: 'FULFILLED', label: 'Receipt Confirmed', desc: 'Transaction complete' },
  ];

  const getStepStatus = (stepKey: string) => {
    if (requestStatus === 'CANCELLED' || requestStatus === 'REJECTED') {
      return 'CANCELLED';
    }

    const reqOrder = ['PENDING', 'MATCHED', 'APPROVED', 'IN_PROGRESS', 'FULFILLED'];
    const currentIndex = reqOrder.indexOf(requestStatus === 'IN_PROGRESS' ? 'IN_TRANSIT' : requestStatus);
    const stepIndex = reqOrder.indexOf(stepKey);

    if (requestStatus === 'FULFILLED' || transferStatus === 'RECEIVED') {
      return 'DONE';
    }

    if (stepIndex < currentIndex) return 'DONE';
    if (stepIndex === currentIndex) return 'CURRENT';
    return 'FUTURE';
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md my-4">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
        <span>Request & Transfer Life Cycle State Machine</span>
        <span className="text-crimson-400 font-mono text-[11px] lowercase">status: {requestStatus}</span>
      </div>

      <div className="grid grid-cols-5 gap-2 relative">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.key);

          let circleClass = 'bg-slate-800 border-slate-700 text-slate-500';
          if (status === 'DONE') circleClass = 'bg-emerald-600 border-emerald-500 text-white';
          if (status === 'CURRENT') circleClass = 'bg-crimson-600 border-crimson-500 text-white animate-pulse ring-4 ring-crimson-500/20';
          if (status === 'CANCELLED') circleClass = 'bg-rose-900 border-rose-700 text-rose-300';

          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold mb-2 transition ${circleClass}`}>
                {status === 'DONE' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : status === 'CURRENT' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <div className="text-xs font-semibold text-slate-200 mb-0.5">{step.label}</div>
              <div className="text-[10px] text-slate-400">{step.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
