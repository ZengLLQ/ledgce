import React from 'react';
import {
  RefreshCw,
  Zap,
  Terminal,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusPill } from './StatusPill';
import type { ViewRoute } from '../../types/api';

interface TopbarProps {
  currentRoute: ViewRoute;
  isBalanced?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onQuickTransfer?: () => void;
  onQuickReconcile?: () => void;
}

const ROUTE_NAMES: Record<ViewRoute, { title: string; subtitle: string }> = {
  landing: {
    title: 'Architecture & Story',
    subtitle: 'SpaceX-grade precision and immutable double-entry fundamentals',
  },
  overview: {
    title: 'Ledger Overview',
    subtitle: 'System-wide balance verification, multi-currency volume, and runtime stats',
  },
  accounts: {
    title: 'Accounts & Vaults',
    subtitle: 'Customer and system clearing accounts with projection synchronization',
  },
  transfers: {
    title: 'Transfers & Postings',
    subtitle: 'Atomic double-entry transfer engine with idempotency protection and compensation',
  },
  explorer: {
    title: 'Journal Explorer',
    subtitle: 'Append-only ledger journal entries with immutable sequence numbers',
  },
  reconciliation: {
    title: 'Reconciliation Audit',
    subtitle: 'Rigorous invariant audit: double-entry zero sum, balance consistency, and bounds',
  },
  outbox: {
    title: 'Transactional Outbox',
    subtitle: 'Exactly-once dual-write mitigation, lease processing, and dead-letter queues',
  },
  'system-health': {
    title: 'System Health & Invariants',
    subtitle: 'Real-time database connectivity, worker heartbeats, and chaos fault injection',
  },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentRoute,
  isBalanced = true,
  onRefresh,
  isRefreshing = false,
  onQuickTransfer,
  onQuickReconcile,
}) => {
  const routeMeta = ROUTE_NAMES[currentRoute] || {
    title: 'Ledgce Platform',
    subtitle: 'Autonomous Double-Entry Accounting Core',
  };

  return (
    <header className="h-16 px-6 bg-[#090B12]/90 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Route Title & Breadcrumb */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-[#F4F6FC]">
              {routeMeta.title}
            </h1>
            <span className="text-[11px] text-[#9BA5BC]/50">/</span>
            <span className="text-[11px] font-mono text-[#9BA5BC] uppercase tracking-wider">
              {currentRoute}
            </span>
          </div>
          <p className="text-[11px] text-[#9BA5BC] truncate hidden sm:block">
            {routeMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-3">
        {/* Environment badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-[#171C2C] text-[10px] font-mono text-[#9BA5BC]">
          <Terminal className="w-3 h-3 text-[#526CFF]" />
          <span>LOCAL DEV</span>
        </div>

        {/* Global invariant status pill */}
        <StatusPill isBalanced={isBalanced} />

        {/* Quick action buttons */}
        {onQuickReconcile && (
          <Button
            size="sm"
            variant="outline"
            onClick={onQuickReconcile}
            className="hidden lg:inline-flex"
            icon={<Zap className="w-3.5 h-3.5 text-[#F2B85C]" />}
          >
            Run Audit
          </Button>
        )}

        {onQuickTransfer && (
          <Button
            size="sm"
            variant="primary"
            onClick={onQuickTransfer}
            className="hidden sm:inline-flex"
          >
            New Transfer
          </Button>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Ledger View"
            className="p-2 rounded-md border border-white/10 bg-[#171C2C] text-[#9BA5BC] hover:text-[#F4F6FC] hover:bg-[#20263A] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#526CFF]' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
