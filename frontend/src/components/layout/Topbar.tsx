import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  RefreshCw,
  Zap,
  Menu,
  X,
  Layers,
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  BookOpen,
  CheckCheck,
  SendHorizontal,
  Activity,
  Cpu,
  Shield,
  FileCode2,
  Key,
  Settings,
  History,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusPill } from './StatusPill';
import { api } from '../../api/client';
import type { ViewRoute } from '../../types/api';

interface TopbarProps {
  currentRoute: ViewRoute;
  onRouteChange: (route: ViewRoute) => void;
  isBalanced?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onQuickTransfer?: () => void;
  onQuickReconcile?: () => void;
}

const NAV_LINKS: { id: ViewRoute; label: string; group: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'landing', label: 'Story', group: 'FOUNDATION', icon: Layers },
  { id: 'platform', label: 'Platform', group: 'FOUNDATION', icon: Cpu },
  { id: 'architecture', label: 'Architecture', group: 'FOUNDATION', icon: FileCode2 },
  { id: 'security', label: 'Security', group: 'FOUNDATION', icon: Shield },
  { id: 'docs', label: 'Docs', group: 'FOUNDATION', icon: BookOpen },
  { id: 'overview', label: 'Dashboard', group: 'OPERATIONS', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', group: 'OPERATIONS', icon: Wallet },
  { id: 'transfers', label: 'Transfers', group: 'OPERATIONS', icon: ArrowLeftRight },
  { id: 'transactions', label: 'Transactions', group: 'OPERATIONS', icon: History },
  { id: 'explorer', label: 'Journal', group: 'OPERATIONS', icon: BookOpen },
  { id: 'reconciliation', label: 'Reconciliation', group: 'RELIABILITY', icon: CheckCheck },
  { id: 'outbox', label: 'Outbox', group: 'RELIABILITY', icon: SendHorizontal },
  { id: 'system-health', label: 'Observability', group: 'RELIABILITY', icon: Activity },
  { id: 'settings', label: 'Settings', group: 'OPERATOR', icon: Settings },
  { id: 'login', label: 'Auth', group: 'OPERATOR', icon: Key },
];

export const Topbar: React.FC<TopbarProps> = ({
  currentRoute,
  onRouteChange,
  isBalanced = true,
  onRefresh,
  isRefreshing = false,
  onQuickTransfer,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<'admin' | 'reader'>('admin');

  const handleRoleToggle = (role: 'admin' | 'reader') => {
    setActiveRole(role);
    api.setToken(role === 'admin' ? 'dev_admin_token' : 'dev_reader_token');
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 h-20 bg-background/90 backdrop-blur-md border-b border-border z-40 select-none transition-all">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Stark Geometric Typographic Wordmark */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => {
                onRouteChange('landing');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-full group-hover:scale-125 transition-transform" />
              <span className="font-neodin font-extrabold text-xl sm:text-2xl tracking-[0.3em] text-white uppercase">
                LEDGCE
              </span>
            </button>
            <span className="hidden xl:inline-block text-[9px] font-mono tracking-[0.2em] px-2 py-0.5 rounded border border-border text-text-muted">
              FINANCIAL INFRASTRUCTURE
            </span>
          </div>

          {/* Desktop Horizontal Navigation Links */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-5 font-neodin">
            {NAV_LINKS.slice(0, 8).map((link) => {
              const isActive = currentRoute === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onRouteChange(link.id)}
                  className={`text-[12px] font-bold uppercase tracking-[0.14em] transition-all py-1.5 relative whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="topbar-active-indicator"
                      className="absolute bottom-0 inset-x-0 h-[2px] bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Global Invariant Status */}
            <div className="hidden sm:block">
              <StatusPill isBalanced={isBalanced} />
            </div>

            {/* Role switch toggle */}
            <div className="hidden md:flex items-center border border-border rounded p-0.5 bg-surface">
              <button
                onClick={() => handleRoleToggle('admin')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
                  activeRole === 'admin'
                    ? 'bg-white text-black'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                ADMIN
              </button>
              <button
                onClick={() => handleRoleToggle('reader')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
                  activeRole === 'reader'
                    ? 'bg-white text-black'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                READER
              </button>
            </div>

            {/* Quick action buttons */}
            {onQuickTransfer && (
              <Button
                variant="primary"
                size="sm"
                onClick={onQuickTransfer}
                icon={<Zap className="w-3.5 h-3.5" />}
                className="hidden sm:inline-flex"
              >
                Transfer
              </Button>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 text-text-muted hover:text-white border border-border hover:border-white rounded transition-all focus:outline-none"
                title="Refresh Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-text-secondary hover:text-white border border-border rounded focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer with Framer Motion */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Paper */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-surface border-l border-border p-6 flex flex-col justify-between overflow-y-auto shadow-2xl"
            >
              <div>
                {/* Drawer header */}
                <div className="flex items-center justify-between pb-6 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="font-display font-bold text-base tracking-[0.25em] text-white uppercase">
                      LEDGCE
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-text-muted hover:text-white focus:outline-none rounded hover:bg-surface-raised"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Categorized nav links */}
                {['FOUNDATION', 'OPERATIONS', 'RELIABILITY', 'OPERATOR'].map((group) => (
                  <div key={group} className="mt-6">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted block mb-3 font-semibold">
                      {group}
                    </span>
                    <div className="space-y-1">
                      {NAV_LINKS.filter((l) => l.group === group).map((link) => {
                        const Icon = link.icon;
                        const isActive = currentRoute === link.id;
                        return (
                          <button
                            key={link.id}
                            onClick={() => {
                              onRouteChange(link.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all text-left ${
                              isActive
                                ? 'bg-surface-raised text-white border border-border-strong'
                                : 'text-text-secondary hover:text-white hover:bg-surface-hover'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{link.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer footer */}
              <div className="pt-6 border-t border-border mt-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-text-muted">ACTIVE ROLE</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRoleToggle('admin')}
                      className={`px-2 py-1 text-[10px] font-mono rounded ${
                        activeRole === 'admin' ? 'bg-white text-black font-bold' : 'bg-background text-text-muted'
                      }`}
                    >
                      ADMIN
                    </button>
                    <button
                      onClick={() => handleRoleToggle('reader')}
                      className={`px-2 py-1 text-[10px] font-mono rounded ${
                        activeRole === 'reader' ? 'bg-white text-black font-bold' : 'bg-background text-text-muted'
                      }`}
                    >
                      READER
                    </button>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-text-muted text-center">
                  LEDGCE DISTRIBUTED FINANCIAL ENGINE
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
