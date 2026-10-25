import React from 'react';
import { Topbar } from './Topbar';
import type { ViewRoute } from '../../types/api';

interface ShellProps {
  currentRoute: ViewRoute;
  onRouteChange: (route: ViewRoute) => void;
  isBalanced?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onQuickTransfer?: () => void;
  onQuickReconcile?: () => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentRoute,
  onRouteChange,
  isBalanced = true,
  onRefresh,
  isRefreshing = false,
  onQuickTransfer,
  onQuickReconcile,
  children,
}) => {
  const isLanding = currentRoute === 'landing';

  return (
    <div className="min-h-screen bg-black text-[#FAFAFA] font-sans antialiased relative selection:bg-white selection:text-black flex flex-col">
      {/* Starlink floating transparent navigation bar */}
      <Topbar
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        isBalanced={isBalanced}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onQuickTransfer={onQuickTransfer}
        onQuickReconcile={onQuickReconcile}
      />

      {/* Main Content: Full-bleed for landing hero, padded container for operations */}
      <main className={`flex-1 pt-20 ${isLanding ? 'w-full' : 'max-w-7xl mx-auto w-full px-4 sm:px-8 py-8'}`}>
        {children}
      </main>

      {/* Starlink-inspired Minimal Technical Footer */}
      <footer className="border-t border-white/[0.08] bg-black py-10 px-4 sm:px-8 mt-16 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/50">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm tracking-[0.25em] text-white">
              LEDGCE
            </span>
            <span className="text-white/30">/</span>
            <span className="font-mono text-[11px] text-white/40">
              © 2026 MISSION-CRITICAL FINANCIAL ENGINE
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-wider text-white/60">
            <button
              onClick={() => onRouteChange('landing')}
              className="hover:text-white transition-colors"
            >
              Architecture
            </button>
            <button
              onClick={() => onRouteChange('overview')}
              className="hover:text-white transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => onRouteChange('reconciliation')}
              className="hover:text-white transition-colors"
            >
              Invariant Audit
            </button>
            <a
              href="http://127.0.0.1:8080/swagger-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Swagger Docs
            </a>
            <a
              href="http://127.0.0.1:8080/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Prometheus Metrics
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
