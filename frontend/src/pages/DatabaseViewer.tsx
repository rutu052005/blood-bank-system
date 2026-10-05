import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Database } from 'lucide-react';

export const DatabaseViewer: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('hospitals');

  useEffect(() => {
    api.getDatabaseTables()
      .then(res => setTables(res.tables || []))
      .catch(() => {});
  }, []);

  const activeTable = tables.find(t => t.name === selectedTable);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Database className="w-6 h-6 text-crimson-600" /> Database Inspector (Supabase & Engine Store)
        </h1>
        <p className="text-xs text-slate-500">
          Admin inspect tool showing raw schema tables and record counts. Secrets are never exposed.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto font-mono text-xs">
        {tables.map(t => (
          <button
            key={t.name}
            onClick={() => setSelectedTable(t.name)}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              selectedTable === t.name ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.name} ({t.count})
          </button>
        ))}
      </div>

      {activeTable && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="font-extrabold text-slate-900">Table: {activeTable.name}</span>
            <span className="text-slate-500">Record Count: {activeTable.count}</span>
          </div>

          <div className="overflow-x-auto">
            <pre className="text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono">
              {JSON.stringify(activeTable.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
