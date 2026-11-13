import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BarChart3, Download, FileText } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('inventory-summary');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getReport(reportType).then(res => setData(res)).catch(() => {});
  }, [reportType]);

  const handleExportCSV = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportType}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" /> Operational Analytics & Reports
          </h1>
          <p className="text-xs text-zinc-400">Comprehensive inventory analytics and supply summaries across all hospital facilities.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4" /> Export Report Data
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'inventory-summary', label: 'Hospital Stock Summary' },
          { id: 'expiry-forecast', label: 'Expiry Forecast Report' },
          { id: 'request-fulfillment', label: 'Request Fulfillment Stats' },
          { id: 'transfer-ledger', label: 'Inter-Hospital Transfers' },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setReportType(r.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              reportType === r.id ? 'bg-crimson-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs overflow-x-auto">
        <pre className="text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};
