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
  Globe,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/', label: 'Home Portal', icon: Globe },
    { to: '/engine-control', label: 'Operations Center', icon: Cpu, badge: 'CORE', highlight: true },
    { to: '/inventory', label: 'Live Inventory', icon: Droplets },
    { to: '/requests', label: 'Requests & Dispatch', icon: FileSpreadsheet },
    { to: '/transfers', label: 'Transfers & Delivery', icon: ArrowLeftRight },
    { to: '/expiry', label: 'Expiry & Shelf-Life', icon: Clock },
    { to: '/alerts', label: 'Alerts & Notifications', icon: Bell },
    { to: '/reports', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/audit-logs', label: 'Compliance & Audit Logs', icon: ShieldCheck },
    { to: '/hospitals', label: 'Partner Hospitals', icon: Building2 },
    { to: '/users', label: 'Users & Staff', icon: UsersIcon, roles: ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN'] },
    { to: '/database-viewer', label: 'Records Inspector', icon: Database, roles: ['SYSTEM_ADMIN'] },
    { to: '/settings', label: 'System Settings', icon: Settings, roles: ['SYSTEM_ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-black/95 text-zinc-300 border-r border-zinc-800/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
          OPERATIONAL MODULES
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
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black shadow-lg shadow-emerald-500/25'
                    : link.highlight
                    ? 'bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/30'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${link.highlight ? 'text-emerald-400' : ''}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="bg-black/60 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-zinc-900 bg-zinc-950/60">
        <div className="bg-black rounded-xl p-3 border border-zinc-800/80 shadow-sm">
          <div className="text-[11px] font-bold text-zinc-200 mb-1 flex items-center justify-between font-mono">
            <span>NETWORK STATUS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            All 5 Partner Hospital Nodes Online & Synchronized.
          </p>
        </div>
      </div>
    </aside>
  );
};
