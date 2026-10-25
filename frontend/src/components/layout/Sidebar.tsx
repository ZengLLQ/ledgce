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
  group?: 'explore' | 'operations' | 'platform';
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'landing',
    label: 'Architecture & Story',
    icon: Layers,
    group: 'explore',
  },
  {
    id: 'overview',
    label: 'Ledger Overview',
    icon: LayoutDashboard,
    group: 'explore',
  },
  {
    id: 'accounts',
    label: 'Accounts & Vaults',
    icon: Wallet,
    group: 'operations',
  },
  {
    id: 'transfers',
    label: 'Transfers & Postings',
    icon: ArrowLeftRight,
    group: 'operations',
  },
  {
    id: 'explorer',
    label: 'Journal Explorer',
    icon: BookOpen,
    group: 'operations',
  },
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
    label: 'System Health & Chaos',
    icon: Activity,
    group: 'platform',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
}) => {
  return (
    <aside className="w-64 bg-[#0B0E17] border-r border-white/[0.08] flex flex-col justify-between shrink-0 min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.08] bg-[#111522]/30">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#526CFF] to-[#7588FF] flex items-center justify-center shadow-accent">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-widest text-[#F4F6FC] uppercase font-mono">
                LEDGCE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[#9BA5BC]">
                v1.0
              </span>
            </div>
            <span className="text-[10px] text-[#9BA5BC] tracking-tight">
              Autonomous Double-Entry Core
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="py-4 px-3 space-y-6">
          {/* Group: Core */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#9BA5BC]/70 uppercase tracking-wider">
              Core Overview
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.filter((item) => item.group === 'explore').map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 text-left group',
                      isActive
                        ? 'bg-[#171C2C] text-[#F4F6FC] font-semibold border border-white/10 shadow-sm'
                        : 'text-[#9BA5BC] hover:text-[#F4F6FC] hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-[#526CFF]' : 'text-[#9BA5BC] group-hover:text-[#F4F6FC]'
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#526CFF] shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Group: Operations */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#9BA5BC]/70 uppercase tracking-wider">
              Ledger Operations
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.filter((item) => item.group === 'operations').map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 text-left group',
                      isActive
                        ? 'bg-[#171C2C] text-[#F4F6FC] font-semibold border border-white/10 shadow-sm'
                        : 'text-[#9BA5BC] hover:text-[#F4F6FC] hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-[#526CFF]' : 'text-[#9BA5BC] group-hover:text-[#F4F6FC]'
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#526CFF] shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Group: Platform & Integrity */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-[#9BA5BC]/70 uppercase tracking-wider">
              Reliability & Invariants
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.filter((item) => item.group === 'platform').map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onRouteChange(item.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 text-left group',
                      isActive
                        ? 'bg-[#171C2C] text-[#F4F6FC] font-semibold border border-white/10 shadow-sm'
                        : 'text-[#9BA5BC] hover:text-[#F4F6FC] hover:bg-white/[0.04]'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-[#526CFF]' : 'text-[#9BA5BC] group-hover:text-[#F4F6FC]'
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#526CFF] shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/[0.08] bg-[#111522]/40 text-xs text-[#9BA5BC]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#9BA5BC]">
            Ledger Core
          </span>
          <span className="text-[10px] font-mono text-[#35D6A0] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35D6A0]" />
            ONLINE
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#9BA5BC]/80">
          PostgreSQL 16 · Rust Backend
        </p>
        <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
          <span className="text-[#5D6882]">Atomic Invariants</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[#7588FF] hover:underline"
          >
            <FileCode2 className="w-3 h-3" />
            <span>Docs</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
