import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './components/layout/Shell';
import { ToastProvider, useToast } from './components/ui/Toast';
import { LandingView } from './views/LandingView';
import { PlatformView } from './views/PlatformView';
import { ArchitectureView } from './views/ArchitectureView';
import { SecurityView } from './views/SecurityView';
import { DocsView } from './views/DocsView';
import { LoginView } from './views/LoginView';
import { OverviewView } from './views/OverviewView';
import { AccountsView } from './views/AccountsView';
import { TransfersView } from './views/TransfersView';
import { TransactionsView } from './views/TransactionsView';
import { ExplorerView } from './views/ExplorerView';
import { ReconciliationView } from './views/ReconciliationView';
import { OutboxView } from './views/OutboxView';
import { SystemHealthView } from './views/SystemHealthView';
import { SettingsView } from './views/SettingsView';
import { api } from './api/client';
import type { ViewRoute } from './types/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

// Path to Route mapper
export function pathToRoute(path: string): ViewRoute {
  const clean = path.replace(/\/$/, '') || '/';
  switch (clean) {
    case '/':
    case '/landing':
      return 'landing';
    case '/platform':
      return 'platform';
    case '/architecture':
      return 'architecture';
    case '/security':
      return 'security';
    case '/docs':
      return 'docs';
    case '/login':
      return 'login';
    case '/app':
    case '/app/overview':
      return 'overview';
    case '/app/accounts':
      return 'accounts';
    case '/app/transfers':
      return 'transfers';
    case '/app/transactions':
      return 'transactions';
    case '/app/ledger':
      return 'explorer';
    case '/app/events':
      return 'outbox';
    case '/app/reconciliation':
      return 'reconciliation';
    case '/app/observability':
      return 'system-health';
    case '/app/settings':
      return 'settings';
    default:
      return 'landing';
  }
}

// Route to Path mapper
export function routeToPath(route: ViewRoute): string {
  switch (route) {
    case 'landing':
      return '/';
    case 'platform':
      return '/platform';
    case 'architecture':
      return '/architecture';
    case 'security':
      return '/security';
    case 'docs':
      return '/docs';
    case 'login':
      return '/login';
    case 'overview':
      return '/app';
    case 'accounts':
      return '/app/accounts';
    case 'transfers':
      return '/app/transfers';
    case 'transactions':
      return '/app/transactions';
    case 'explorer':
      return '/app/ledger';
    case 'outbox':
      return '/app/events';
    case 'reconciliation':
      return '/app/reconciliation';
    case 'system-health':
      return '/app/observability';
    case 'settings':
      return '/app/settings';
  }
}

const LedgceAppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRoute = pathToRoute(location.pathname);

  const [isBalanced, setIsBalanced] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferSourceAccountId, setTransferSourceAccountId] = useState<string | undefined>(undefined);
  const { showToast } = useToast();

  const handleNavigate = (route: ViewRoute) => {
    const targetPath = routeToPath(route);
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkInvariants = async () => {
    try {
      const health = await api.getSystemHealth();
      setIsBalanced(health.ledger_invariants_pass);
    } catch {
      // In standalone dev, keep default balanced
    }
  };

  useEffect(() => {
    checkInvariants();
    const interval = setInterval(checkInvariants, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await checkInvariants();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Ledger Telemetry Synced', 'Live balances and invariants updated.', 'info');
    }, 400);
  };

  const handleQuickReconcile = async () => {
    try {
      const res = await api.triggerReconciliation();
      showToast(
        'Quick Invariant Audit Completed',
        `Checked ${res.summary.accounts_checked} accounts and ${res.summary.entries_checked} journal legs. Status: ${res.summary.status.toUpperCase()}`,
        res.summary.violation_count === 0 ? 'success' : 'error'
      );
      checkInvariants();
    } catch (err: unknown) {
      showToast('Reconciliation failed', err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const handleInitiateTransferFrom = (accountId: string) => {
    setTransferSourceAccountId(accountId);
    handleNavigate('transfers');
    setIsTransferModalOpen(true);
  };

  return (
    <Shell
      currentRoute={currentRoute}
      onRouteChange={handleNavigate}
      isBalanced={isBalanced}
      onRefresh={handleGlobalRefresh}
      isRefreshing={isRefreshing}
      onQuickTransfer={() => {
        setTransferSourceAccountId(undefined);
        handleNavigate('transfers');
        setIsTransferModalOpen(true);
      }}
      onQuickReconcile={handleQuickReconcile}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full"
        >
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/" element={<LandingView onNavigate={handleNavigate} />} />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route path="/platform" element={<PlatformView onNavigate={handleNavigate} />} />
            <Route path="/architecture" element={<ArchitectureView onNavigate={handleNavigate} />} />
            <Route path="/security" element={<SecurityView onNavigate={handleNavigate} />} />
            <Route path="/docs" element={<DocsView onNavigate={handleNavigate} />} />
            <Route path="/login" element={<LoginView onNavigate={handleNavigate} />} />

            {/* Operational Workspace Routes */}
            <Route
              path="/app"
              element={
                <OverviewView
                  onNavigate={handleNavigate}
                  onOpenTransferModal={() => {
                    setTransferSourceAccountId(undefined);
                    handleNavigate('transfers');
                    setIsTransferModalOpen(true);
                  }}
                />
              }
            />
            <Route path="/app/overview" element={<Navigate to="/app" replace />} />
            <Route
              path="/app/accounts"
              element={<AccountsView onInitiateTransferFrom={handleInitiateTransferFrom} />}
            />
            <Route
              path="/app/transfers"
              element={
                <TransfersView
                  initialSourceAccountId={transferSourceAccountId}
                  isTransferModalOpen={isTransferModalOpen}
                  onCloseTransferModal={() => setIsTransferModalOpen(false)}
                />
              }
            />
            <Route path="/app/transactions" element={<TransactionsView />} />
            <Route path="/app/ledger" element={<ExplorerView />} />
            <Route path="/app/events" element={<OutboxView />} />
            <Route path="/app/reconciliation" element={<ReconciliationView />} />
            <Route path="/app/observability" element={<SystemHealthView />} />
            <Route path="/app/settings" element={<SettingsView />} />

            {/* Fallback to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <LedgceAppContent />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
