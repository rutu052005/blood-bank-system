import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { BloodRequest, MatchExplanation } from '../types/index.js';
import { PriorityBadge } from '../components/PriorityBadge.js';
import { TimelineVisualizer } from '../components/TimelineVisualizer.js';
import { MatchDisclaimer } from '../components/MatchDisclaimer.js';
import { useAuth } from '../context/AuthContext.js';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Truck, ShieldAlert } from 'lucide-react';

export const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [matches, setMatches] = useState<MatchExplanation[]>([]);
  const [actionNotes, setActionNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

  const fetchRequestDetail = () => {
    if (id) {
      api.getRequestById(id)
        .then(res => {
          setRequest(res);
          if (res.matches) setMatches(res.matches);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const handleUpdateStatus = async (targetStatus: string) => {
    if (!id) return;
    try {
      await api.updateRequestStatus(id, targetStatus, actionNotes);
      setShowConfirmModal(null);
      setActionNotes('');
      fetchRequestDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateTransfer = async (match: MatchExplanation) => {
    if (!id) return;
    try {
      // First approve if not approved
      if (request?.status !== 'APPROVED') {
        await api.updateRequestStatus(id, 'APPROVED', 'Authorized human approval for transfer dispatch');
      }
      await api.createTransfer({
        request_id: id,
        inventory_id: match.inventory_id,
        quantity: match.allocated_quantity,
      });
      navigate('/transfers');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!request) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading request details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/requests" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 font-mono">Request {request.id}</h1>
              <PriorityBadge priority={request.priority} />
            </div>
            <p className="text-xs text-slate-500">
              Requesting Hospital: <span className="font-bold text-slate-700">{request.requesting_hospital_name}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons for Authorized Review */}
        {hasRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'REQUEST_MANAGER') && request.status !== 'FULFILLED' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmModal('APPROVED')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve Request
            </button>
            <button
              onClick={() => setShowConfirmModal('RETURNED_FOR_REVIEW')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return for Review
            </button>
            <button
              onClick={() => setShowConfirmModal('REJECTED')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
      </div>

      {/* State Machine Timeline */}
      <TimelineVisualizer requestStatus={request.status} />

      {/* Request Item Overview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Required Resource</span>
          <span className="font-black text-slate-900 text-sm">{request.items[0]?.blood_group} {request.items[0]?.component}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Quantity Needed</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{request.items[0]?.quantity} units</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Effective Queue Score</span>
          <span className="font-mono font-black text-crimson-600 text-sm">{request.effective_score} pts</span>
        </div>
      </div>

      {/* Matches Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Ranked Matching Engine Results</h2>

        <MatchDisclaimer />

        {matches.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No potential matches found in inventory for this request.</p>
        ) : (
          matches.map((match, idx) => (
            <div key={match.inventory_id} className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <span className="font-extrabold text-sm text-slate-900">#{idx + 1} {match.hospital_name}</span>
                  <span className="text-xs text-slate-500 font-mono ml-2">(Unit: {match.inventory_id})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded">
                    Score: {match.total_score} / 100
                  </span>
                  {hasRole('SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'INVENTORY_MANAGER') && (
                    <button
                      onClick={() => handleCreateTransfer(match)}
                      className="bg-crimson-600 hover:bg-crimson-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" /> Initiate Transfer
                    </button>
                  )}
                </div>
              </div>

              {/* Match Factors */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-slate-50 p-2 rounded">FEFO Expiry: {match.expiry_score} pts ({match.days_to_expiry}d left)</div>
                <div className="bg-slate-50 p-2 rounded">Dijkstra Dist: {match.distance_score} pts ({match.distance_km} km)</div>
                <div className="bg-slate-50 p-2 rounded">Qty Fit: {match.fit_score} pts ({match.allocated_quantity} units)</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Confirm Decision: {showConfirmModal}
            </h2>
            <p className="text-xs text-slate-600">
              Human decision required. Please enter notes or authorization details:
            </p>
            <textarea
              rows={3}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Authorization notes..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(showConfirmModal)}
                className="px-4 py-1.5 text-xs font-extrabold bg-crimson-600 text-white hover:bg-crimson-700 rounded-lg shadow-md"
              >
                Confirm {showConfirmModal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
