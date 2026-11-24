import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Transfer } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { PriorityBadge } from '../components/PriorityBadge.js';
import { ArrowLeftRight, CheckCircle2, Truck, Clock } from 'lucide-react';

export const TransfersPage: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchTransfers = () => {
    api.getTransfers().then(res => setTransfers(res)).catch(() => {});
  };

  useEffect(() => {
    fetchTransfers();
    const interval = setInterval(fetchTransfers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmReceipt = async (transferId: string) => {
    try {
      setConfirmingId(transferId);
      // Optimistic update for instant UI feedback
      setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'RECEIVED', received_at: new Date().toISOString() } : t));

      const res = await api.confirmTransferReceipt(transferId);
      setNotification(`Transfer #${transferId} receipt confirmed successfully! Stock allocated to destination hospital.`);
      setTimeout(() => setNotification(null), 5000);
      fetchTransfers();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm receipt');
      fetchTransfers();
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-400" /> Multi-Hospital Transfer & Delivery
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time courier transit tracking with verified dual-hospital receipt confirmation.
          </p>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Transfer ID</th>
                <th className="p-3">Source Hospital</th>
                <th className="p-3">Destination Hospital</th>
                <th className="p-3">Resource</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                    No active or historical transfers found.
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{tr.id}</td>
                    <td className="p-3 font-medium text-slate-700">{tr.source_hospital_name}</td>
                    <td className="p-3 font-medium text-slate-700">{tr.destination_hospital_name}</td>
                    <td className="p-3 font-bold text-slate-900">{tr.blood_group} {tr.component}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{tr.quantity} units</td>
                    <td className="p-3">
                      <PriorityBadge priority={tr.priority} />
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        tr.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {tr.status === 'IN_TRANSIT' ? (
                        <button
                          disabled={confirmingId === tr.id}
                          onClick={() => handleConfirmReceipt(tr.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          {confirmingId === tr.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Receipt
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </td>
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
