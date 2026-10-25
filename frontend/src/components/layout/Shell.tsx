import React, { useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  const isPublicRoute = [
    'landing',
    'platform',
    'architecture',
    'security',
    'docs',
    'login',
  ].includes(currentRoute);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen text-text-primary font-neodin antialiased relative selection:bg-white selection:text-black flex flex-col bg-background">
      {/* Topbar Navigation */}
      <Topbar
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        isBalanced={isBalanced}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onQuickTransfer={onQuickTransfer}
        onQuickReconcile={onQuickReconcile}
      />

      {isPublicRoute ? (
        /* Full-width / container public layout */
        <main className={`flex-1 ${currentRoute === 'landing' ? 'pt-20 w-full' : 'pt-28 pb-16 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8'}`}>
          {children}
        </main>
      ) : (
        /* Operational Workspace Layout with Collapsible Sidebar */
        <div className="pt-20 flex-1 flex w-full">
          {/* Desktop Collapsible Sidebar */}
          <div
            className={`hidden lg:block transition-all duration-200 shrink-0 ${
              sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'
            }`}
          >
            <Sidebar
              currentRoute={currentRoute}
              onRouteChange={onRouteChange}
              isCollapsed={sidebarCollapsed}
            />
          </div>

          {/* Main Operational Stage */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Operational Utility Bar with Collapse Toggle & Breadcrumbs */}
            <div className="h-12 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-text-muted">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex items-center gap-1.5 p-1 rounded hover:bg-surface-raised hover:text-white transition-colors text-text-muted"
                  title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                  {sidebarCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-text-muted">WORKSPACE</span>
                  <span>/</span>
                  <span className="text-white uppercase font-bold tracking-wider font-sans">
                    {currentRoute.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px]">
                <span className="hidden sm:inline">DATABASE: 127.0.0.1:5433</span>
                <span>·</span>
                <span className="text-white font-bold">DOUBLE-ENTRY INVARIANT: OK</span>
              </div>
            </div>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
              {children}
            </main>
          </div>
        </div>
      )}

      {/* Minimal Monochromatic Footer */}
      <footer className="border-t border-border bg-surface py-8 px-4 sm:px-8 select-none font-mono text-xs text-text-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-sans font-bold text-sm tracking-widest text-white uppercase">
              LEDGCE
            </span>
            <span>·</span>
            <span>Financial infrastructure, engineered for trust.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] uppercase text-text-secondary">
            <button type="button" onClick={() => onRouteChange('platform')} className="hover:text-white transition-colors">
              Platform
            </button>
            <button type="button" onClick={() => onRouteChange('architecture')} className="hover:text-white transition-colors">
              Architecture
            </button>
            <button type="button" onClick={() => onRouteChange('security')} className="hover:text-white transition-colors">
              Security
            </button>
            <button type="button" onClick={() => onRouteChange('docs')} className="hover:text-white transition-colors">
              Docs
            </button>
            <button type="button" onClick={() => onRouteChange('overview')} className="hover:text-white transition-colors">
              Dashboard
            </button>
          </div>

          <div>
            © 2026 Ledgce. Open source financial ledger.
          </div>
        </div>
      </footer>
    </div>
  );
};
