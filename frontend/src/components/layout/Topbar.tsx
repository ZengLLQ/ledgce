import React, { useState } from 'react';
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
  { id: 'landing', label: 'Architecture', group: 'FOUNDATION', icon: Layers },
  { id: 'overview', label: 'Overview', group: 'FOUNDATION', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', group: 'OPERATIONS', icon: Wallet },
  { id: 'transfers', label: 'Transfers', group: 'OPERATIONS', icon: ArrowLeftRight },
  { id: 'explorer', label: 'Journal', group: 'OPERATIONS', icon: BookOpen },
  { id: 'reconciliation', label: 'Reconciliation', group: 'RELIABILITY', icon: CheckCheck },
  { id: 'outbox', label: 'Outbox', group: 'RELIABILITY', icon: SendHorizontal },
  { id: 'system-health', label: 'Health', group: 'RELIABILITY', icon: Activity },
];

export const Topbar: React.FC<TopbarProps> = ({
  currentRoute,
  onRouteChange,
  isBalanced = true,
  onRefresh,
  isRefreshing = false,
  onQuickTransfer,
  onQuickReconcile: _onQuickReconcile,
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
      <header className="fixed top-0 inset-x-0 h-20 bg-black/85 backdrop-blur-md border-b border-white/[0.08] z-50 select-none transition-all">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
          {/* Starlink-inspired stark geometric typographic logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onRouteChange('landing');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-full group-hover:scale-125 transition-transform" />
              <span className="font-mono font-bold text-lg sm:text-xl tracking-[0.35em] text-[#FAFAFA] group-hover:text-white transition-colors">
                LEDGCE
              </span>
            </button>
            <span className="hidden lg:inline-block text-[9px] font-mono tracking-[0.2em] px-2 py-0.5 rounded border border-white/15 text-white/50">
              DISTRIBUTED LEDGER CORE
            </span>
          </div>

          {/* Desktop Horizontal Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              const isActive = currentRoute === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onRouteChange(link.id)}
                  className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-all py-1.5 relative ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Global Invariant Status */}
            <div className="hidden sm:block">
              <StatusPill isBalanced={isBalanced} />
            </div>

            {/* Role switch toggle */}
            <div className="hidden md:flex items-center border border-white/15 rounded p-0.5 bg-[#121212]">
              <button
                onClick={() => handleRoleToggle('admin')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
                  activeRole === 'admin'
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                ADMIN
              </button>
              <button
                onClick={() => handleRoleToggle('reader')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
                  activeRole === 'reader'
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white'
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
                className="hidden lg:inline-flex"
              >
                Transfer
              </Button>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded transition-all focus:outline-none"
                title="Refresh Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 text-white/80 hover:text-white border border-white/15 rounded focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer (Starlink style blur-backdrop drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Paper */}
          <div className="fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-[#121212]/95 backdrop-blur-xl border-l border-white/15 p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <span className="font-mono font-bold text-base tracking-[0.25em] text-white uppercase">
                  NAVIGATION
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-white/60 hover:text-white focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorized nav links */}
              {['FOUNDATION', 'OPERATIONS', 'RELIABILITY'].map((group) => (
                <div key={group} className="mt-6">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block mb-3 font-semibold">
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
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all text-left ${
                            isActive
                              ? 'bg-white text-black'
                              : 'text-white/70 hover:text-white hover:bg-white/5'
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

            {/* Drawer footer with role switcher */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 font-mono text-[11px]">ROLE:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRoleToggle('admin')}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                      activeRole === 'admin' ? 'bg-white text-black' : 'text-white/60 border border-white/15'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => handleRoleToggle('reader')}
                    className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                      activeRole === 'reader' ? 'bg-white text-black' : 'text-white/60 border border-white/15'
                    }`}
                  >
                    Reader
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <StatusPill isBalanced={isBalanced} className="w-full justify-center" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
