import React from 'react';
import { Sidebar } from './Sidebar';
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
  return (
    <div className="min-h-screen flex bg-[#090B12] text-[#F4F6FC] font-sans antialiased relative selection:bg-[#526CFF]/30 selection:text-white">
      {/* Subtle background mesh gradient */}
      <div className="fixed inset-0 pointer-events-none bg-ledgce-mesh opacity-60 z-0" />
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern opacity-40 z-0" />

      {/* Persistent Sidebar */}
      <div className="relative z-10">
        <Sidebar currentRoute={currentRoute} onRouteChange={onRouteChange} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-x-hidden">
        <Topbar
          currentRoute={currentRoute}
          isBalanced={isBalanced}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onQuickTransfer={onQuickTransfer}
          onQuickReconcile={onQuickReconcile}
        />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
