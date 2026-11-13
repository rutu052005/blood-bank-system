import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SimClockProvider } from './context/SimClockContext.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { PersistentBanner } from './components/PersistentBanner.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { Dashboard } from './pages/Dashboard.js';
import { EngineControlCenter } from './pages/EngineControlCenter.js';
import { InventoryPage } from './pages/InventoryPage.js';
import { InventoryDetail } from './pages/InventoryDetail.js';
import { RequestsPage } from './pages/RequestsPage.js';
import { RequestDetail } from './pages/RequestDetail.js';
import { TransfersPage } from './pages/TransfersPage.js';
import { ExpiryPage } from './pages/ExpiryPage.js';
import { AlertsPage } from './pages/AlertsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { HospitalsPage } from './pages/HospitalsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { DatabaseViewer } from './pages/DatabaseViewer.js';
import { SettingsPage } from './pages/SettingsPage.js';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-emerald-400 flex flex-col items-center justify-center font-mono gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-xs tracking-wider uppercase">Initializing Obsidian Grid...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SimClockProvider>
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
        <PersistentBanner />
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full bg-[#030712]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/engine-control" element={<EngineControlCenter />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/inventory/:id" element={<InventoryDetail />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/requests/:id" element={<RequestDetail />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/expiry" element={<ExpiryPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/database-viewer" element={<DatabaseViewer />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SimClockProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
