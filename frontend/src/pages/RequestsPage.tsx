import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BloodRequest } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { PriorityBadge } from '../components/PriorityBadge.js';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Plus, Search, ChevronRight } from 'lucide-react';

export const RequestsPage: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newReq, setNewReq] = useState({
    requesting_hospital_id: user?.hospital_id || 'H002',
    priority: 'URGENT' as const,
    blood_group: 'O+' as const,
    component: 'RBC' as const,
    quantity: 4,
  });

  const fetchRequests = () => {
    api.getRequests().then(res => setRequests(res)).catch(() => {});
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRequest({
        requesting_hospital_id: newReq.requesting_hospital_id,
        priority: newReq.priority,
        items: [{ blood_group: newReq.blood_group, component: newReq.component, quantity: newReq.quantity }],
      });
      setShowCreateModal(false);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" /> Patient Blood Requests & Dispatch
          </h1>
          <p className="text-xs text-zinc-400">
            Emergency triage queues (Emergency, Urgent, Routine) with fair waitlist management.
          </p>
        </div>

        {hasRole('SYSTEM_ADMIN', 'REQUEST_MANAGER', 'HOSPITAL_ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-crimson-600 hover:bg-crimson-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Issue Blood Request
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Req ID</th>
                <th className="p-3">Hospital</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Need</th>
                <th className="p-3">Effective Score</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{req.id}</td>
                  <td className="p-3 font-medium text-slate-700">{req.requesting_hospital_name}</td>
                  <td className="p-3">
                    <PriorityBadge priority={req.priority} />
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    {req.items[0]?.blood_group} {req.items[0]?.component} (Qty: {req.items[0]?.quantity})
                  </td>
                  <td className="p-3 font-mono font-bold text-crimson-600">{req.effective_score}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link to={`/requests/${req.id}`} className="text-crimson-600 font-bold hover:underline flex items-center gap-0.5">
                      Review <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Issue New Blood Request</h2>
            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Requesting Hospital</label>
                <select
                  value={newReq.requesting_hospital_id}
                  onChange={(e) => setNewReq({ ...newReq, requesting_hospital_id: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="H001">H001 KLE Hospital</option>
                  <option value="H002">H002 District Hospital</option>
                  <option value="H003">H003 City Care Hospital</option>
                  <option value="H004">H004 Sahyadri Medical Center</option>
                  <option value="H005">H005 Shree Hospital</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Priority Level</label>
                <select
                  value={newReq.priority}
                  onChange={(e) => setNewReq({ ...newReq, priority: e.target.value as any })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="EMERGENCY">EMERGENCY (Level 0 Queue)</option>
                  <option value="URGENT">URGENT (Level 1 Queue)</option>
                  <option value="ROUTINE">ROUTINE (Level 2 Queue)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Blood Group</label>
                  <select
                    value={newReq.blood_group}
                    onChange={(e) => setNewReq({ ...newReq, blood_group: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Component</label>
                  <select
                    value={newReq.component}
                    onChange={(e) => setNewReq({ ...newReq, component: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {['RBC', 'PLATELETS', 'PLASMA', 'WHOLE_BLOOD'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Quantity Needed (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={newReq.quantity}
                  onChange={(e) => setNewReq({ ...newReq, quantity: parseInt(e.target.value, 10) })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-extrabold bg-crimson-600 text-white hover:bg-crimson-700 rounded-lg shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
