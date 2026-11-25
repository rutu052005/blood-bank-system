import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  KeyRound,
  Globe,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import {
  testSupabaseConnection,
  updateSupabaseCredentials,
  defaultSupabaseUrl,
  defaultSupabaseAnonKey,
} from '../services/supabase.js';
import { mockStore } from '../services/mockStore.js';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataPurged?: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onDataPurged,
}) => {
  const [url, setUrl] = useState<string>('');
  const [anonKey, setAnonKey] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPurged, setIsPurged] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const savedUrl = localStorage.getItem('supabase_url') || defaultSupabaseUrl;
      const savedKey = localStorage.getItem('supabase_anon_key') || defaultSupabaseAnonKey;
      setUrl(savedUrl);
      setAnonKey(savedKey);
      setIsPurged(mockStore.hasPurgedData());
      handleTest(savedUrl, savedKey);
    }
  }, [isOpen]);

  const handleTest = async (testUrl?: string, testKey?: string) => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(testUrl || url, testKey || anonKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = () => {
    updateSupabaseCredentials(url, anonKey);
    handleTest(url, anonKey);
  };

  const handlePurgeFakeData = () => {
    if (confirm('Are you sure you want to remove all fake/demo data? The website will only show real user-entered records from Supabase.')) {
      mockStore.purgeFakeData();
      setIsPurged(true);
      if (onDataPurged) onDataPurged();
      window.location.reload();
    }
  };

  const handleRestoreFakeData = () => {
    mockStore.restoreDefaultData();
    setIsPurged(false);
    if (onDataPurged) onDataPurged();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#090d16] border border-zinc-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3 relative z-10 sticky top-0 bg-[#090d16]/95 backdrop-blur-sm -mt-1 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                LIVE DATABASE SYNC
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Supabase PostgreSQL Connection & Data Manager
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Connect your actual Supabase project and sync real user-created records to your database tables.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white transition cursor-pointer shrink-0 ml-3"
            title="Close (or press Esc / click outside)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Badge */}
        <div
          className={`p-3.5 rounded-2xl border text-xs font-mono flex items-start gap-3 ${
            testResult?.ok
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/60 text-amber-300'
          }`}
        >
          {testResult?.ok ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider text-[11px]">
              {isTesting
                ? 'Testing connection to Supabase...'
                : testResult?.ok
                ? 'Connected to Supabase'
                : 'Connection Alert'}
            </div>
            <p className="text-zinc-300 text-[11px] font-sans">
              {testResult?.message || 'Validating Supabase URL and Anon Key...'}
            </p>
          </div>
        </div>

        {/* Form Inputs for Custom Supabase Credentials */}
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-zinc-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Project URL:</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Anon / Public API Key:</span>
            </label>
            <textarea
              rows={2}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              className="w-full px-3.5 py-2 bg-black border border-zinc-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleSave}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Save & Test Live Connection'}</span>
            </button>

            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition"
            >
              <span>Open Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Fake Data Remover Card */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-xs text-white">Fake / Demo Data Removal</span>
            </div>
            <span
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                isPurged
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {isPurged ? 'Clean Mode Active (Fake Data Removed)' : 'Demo Data Present'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Click below to purge all hardcoded mock blood units, requests, and transfers. The website will only show real records inserted into your Supabase database or added through the web forms.
          </p>

          <div className="flex items-center gap-3 pt-1">
            {isPurged ? (
              <button
                onClick={handleRestoreFakeData}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 transition cursor-pointer"
              >
                Restore Demo Seed Data
              </button>
            ) : (
              <button
                onClick={handlePurgeFakeData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/25 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove All Fake Data (Start Clean)</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions: Explicit Close Button */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Click outside anywhere or press Esc to close
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSyncModal;
