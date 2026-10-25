import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  BookOpen,
  CheckCheck,
  SendHorizontal,
  Activity,
  Layers,
  FileCode2,
  Cpu,
  Shield,
  Key,
  Settings,
  History,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ViewRoute } from '../../types/api';

interface SidebarProps {
  currentRoute: ViewRoute;
  onRouteChange: (route: ViewRoute) => void;
  isCollapsed?: boolean;
}

interface NavItem {
  id: ViewRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  group?: 'public' | 'operations' | 'platform';
}

const NAV_ITEMS: NavItem[] = [
  // Public & Architecture
  {
    id: 'landing',
    label: 'Overview & Story',
    icon: Layers,
    group: 'public',
  },
  {
    id: 'platform',
    label: 'Platform Engine',
    icon: Cpu,
    group: 'public',
  },
  {
    id: 'architecture',
    label: 'Architecture & C4',
    icon: FileCode2,
    group: 'public',
  },
  {
    id: 'security',
    label: 'Security & Threats',
    icon: Shield,
    group: 'public',
  },
  {
    id: 'docs',
    label: 'API Contracts',
    icon: BookOpen,
    group: 'public',
  },
  // Operational Workspace
  {
    id: 'overview',
    label: 'Ledger Dashboard',
    icon: LayoutDashboard,
    group: 'operations',
  },
  {
    id: 'accounts',
    label: 'Accounts & Vaults',
    icon: Wallet,
    group: 'operations',
  },
  {
    id: 'transfers',
    label: 'Transfer Postings',
    icon: ArrowLeftRight,
    group: 'operations',
  },
  {
    id: 'transactions',
    label: 'Transactions History',
    icon: History,
    group: 'operations',
  },
  {
    id: 'explorer',
    label: 'Journal Explorer',
    icon: BookOpen,
    group: 'operations',
  },
  // Platform & Invariants
  {
    id: 'reconciliation',
    label: 'Reconciliation Audit',
    icon: CheckCheck,
    group: 'platform',
  },
  {
    id: 'outbox',
    label: 'Transactional Outbox',
    icon: SendHorizontal,
    group: 'platform',
  },
  {
    id: 'system-health',
    label: 'Observability & Chaos',
    icon: Activity,
    group: 'platform',
  },
  {
    id: 'settings',
    label: 'Settings & Config',
    icon: Settings,
    group: 'platform',
  },
  {
    id: 'login',
    label: 'Authorization Portal',
    icon: Key,
    group: 'platform',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
}) => {
  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 min-h-screen select-none font-neodin">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border bg-background">
          <div className="w-7 h-7 rounded bg-white flex items-center justify-center text-black font-bold font-sans text-xs">
            L
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-widest text-white uppercase font-sans">
                LEDGCE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-raised border border-border text-text-muted">
                v1.0
              </span>
            </div>
            <span className="text-[10px] text-text-muted tracking-tight font-mono">
              Double-Entry Financial Core
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="py-4 px-3 space-y-6">
          {/* Group: Public & Architecture */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
              Public &amp; Architecture
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.group === 'public').map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all duration-150 text-left group',
                      isActive
                        ? 'bg-surface-raised text-white font-semibold border border-border-strong'
                        : 'text-text-secondary hover:text-white hover:bg-surface-hover'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-3.5 h-3.5 transition-colors',
                        isActive ? 'text-white' : 'text-text-muted group-hover:text-white'
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Group: Operations */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
              Ledger Operations
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.group === 'operations').map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all duration-150 text-left group',
                      isActive
                        ? 'bg-surface-raised text-white font-semibold border border-border-strong'
                        : 'text-text-secondary hover:text-white hover:bg-surface-hover'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-3.5 h-3.5 transition-colors',
                        isActive ? 'text-white' : 'text-text-muted group-hover:text-white'
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Group: Platform & Integrity */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
              Reliability &amp; Infrastructure
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.group === 'platform').map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all duration-150 text-left group',
                      isActive
                        ? 'bg-surface-raised text-white font-semibold border border-border-strong'
                        : 'text-text-secondary hover:text-white hover:bg-surface-hover'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-3.5 h-3.5 transition-colors',
                        isActive ? 'text-white' : 'text-text-muted group-hover:text-white'
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-background text-xs font-mono text-text-muted">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold text-text-muted">
            Ledger Core
          </span>
          <span className="text-[10px] text-white flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            SYNCHRONIZED
          </span>
        </div>
        <p className="text-[11px] text-text-secondary">
          PostgreSQL 17 · Rust 1.85+
        </p>
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px]">
          <span className="text-text-muted">Σ debits = Σ credits</span>
          <span className="text-white font-bold">0.00 DRIFT</span>
        </div>
      </div>
    </aside>
  );
};
