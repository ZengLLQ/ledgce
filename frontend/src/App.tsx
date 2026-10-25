import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './components/layout/Shell';
import { ToastProvider, useToast } from './components/ui/Toast';
import { LandingView } from './views/LandingView';
import { OverviewView } from './views/OverviewView';
import { AccountsView } from './views/AccountsView';
import { TransfersView } from './views/TransfersView';
import { ExplorerView } from './views/ExplorerView';
import { ReconciliationView } from './views/ReconciliationView';
import { OutboxView } from './views/OutboxView';
import { SystemHealthView } from './views/SystemHealthView';
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

const LedgceApp: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<ViewRoute>('landing');
  const [isBalanced, setIsBalanced] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferSourceAccountId, setTransferSourceAccountId] = useState<string | undefined>(undefined);
  const { showToast } = useToast();

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
    setCurrentRoute('transfers');
    setIsTransferModalOpen(true);
  };

  return (
    <Shell
      currentRoute={currentRoute}
      onRouteChange={(route) => {
        setCurrentRoute(route);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      isBalanced={isBalanced}
      onRefresh={handleGlobalRefresh}
      isRefreshing={isRefreshing}
      onQuickTransfer={() => {
        setTransferSourceAccountId(undefined);
        setCurrentRoute('transfers');
        setIsTransferModalOpen(true);
      }}
      onQuickReconcile={handleQuickReconcile}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRoute}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full"
        >
          {currentRoute === 'landing' && <LandingView onNavigate={setCurrentRoute} />}
          {currentRoute === 'overview' && (
            <OverviewView
              onNavigate={setCurrentRoute}
              onOpenTransferModal={() => {
                setTransferSourceAccountId(undefined);
                setCurrentRoute('transfers');
                setIsTransferModalOpen(true);
              }}
            />
          )}
          {currentRoute === 'accounts' && (
            <AccountsView onInitiateTransferFrom={handleInitiateTransferFrom} />
          )}
          {currentRoute === 'transfers' && (
            <TransfersView
              initialSourceAccountId={transferSourceAccountId}
              isTransferModalOpen={isTransferModalOpen}
              onCloseTransferModal={() => setIsTransferModalOpen(false)}
            />
          )}
          {currentRoute === 'explorer' && <ExplorerView />}
          {currentRoute === 'reconciliation' && <ReconciliationView />}
          {currentRoute === 'outbox' && <OutboxView />}
          {currentRoute === 'system-health' && <SystemHealthView />}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <LedgceApp />
      </ToastProvider>
    </QueryClientProvider>
  );
}
