import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Cpu,
  Building2,
  Users as UsersIcon,
  Droplets,
  FileSpreadsheet,
  ArrowLeftRight,
  Clock,
  Bell,
  BarChart3,
  ShieldCheck,
  Database,
  Settings,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/engine-control', label: 'Engine Control Center', icon: Cpu, badge: 'CORE', highlight: true },
    { to: '/inventory', label: 'Inventory FEFO', icon: Droplets },
    { to: '/requests', label: 'Requests & Scheduling', icon: FileSpreadsheet },
    { to: '/transfers', label: 'Transfers & Timeline', icon: ArrowLeftRight },
    { to: '/expiry', label: 'Expiry & Min-Heap', icon: Clock },
    { to: '/alerts', label: 'Alerts & Escalation', icon: Bell },
    { to: '/reports', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Audit Ledger', icon: ShieldCheck },
    { to: '/hospitals', label: 'Hospitals', icon: Building2 },
    { to: '/users', label: 'Users & Roles', icon: UsersIcon, roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'] },
    { to: '/database-viewer', label: 'Database Inspector', icon: Database, roles: ['SYSTEM_ADMIN'] },
    { to: '/settings', label: 'Engine Settings', icon: Settings, roles: ['SYSTEM_ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          System Modules & Engines
        </div>

        {links.map((link) => {
          if (link.roles && !hasRole(...link.roles)) {
            return null;
          }

          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-crimson-600 text-white font-semibold shadow-md shadow-crimson-600/20'
                    : link.highlight
                    ? 'bg-slate-800/80 text-white hover:bg-slate-800 border border-crimson-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${link.highlight ? 'text-crimson-400' : ''}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-crimson-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-800">
          <div className="text-[11px] font-bold text-slate-300 mb-1 flex items-center justify-between">
            <span>Supabase / DB Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Ready for Supabase PostgreSQL & Memory Transaction DB Engine.
          </p>
        </div>
      </div>
    </aside>
  );
};
