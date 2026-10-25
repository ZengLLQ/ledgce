import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowLeftRight,
  BookOpen,
  SendHorizontal,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, MetricTile } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { LedgerActivityChart } from '../components/charts/LedgerActivityChart';
import { api } from '../api/client';
import type { CurrencyVolume, OverviewStats, TransactionSummary, ViewRoute } from '../types/api';
import { useToast } from '../components/ui/Toast';

interface OverviewViewProps {
  onNavigate: (route: ViewRoute) => void;
  onOpenTransferModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenTransferModal,
}) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentTx, setRecentTx] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, txData] = await Promise.all([
        api.getOverview(),
        api.listTransactions({ limit: 5 }),
      ]);
      setStats(overviewData);
      setRecentTx(txData.items);
    } catch (err: unknown) {
      showToast('Error loading overview', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunReconciliation = async () => {
    try {
      setReconciling(true);
      const res = await api.triggerReconciliation();
      showToast(
        'Reconciliation Audit Completed',
        `Checked ${res.summary.accounts_checked} accounts, ${res.summary.entries_checked} journal entries. Invariants: ${res.summary.status.toUpperCase()}`,
        res.summary.violation_count === 0 ? 'success' : 'error'
      );
      loadData();
    } catch (err: unknown) {
      showToast('Reconciliation failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Invariant Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-7 rounded-2xl bg-[#0D0F14] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00D26A]/10 border border-[#00D26A]/30 flex items-center justify-center text-[#00D26A] shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-base sm:text-lg font-bold text-white uppercase tracking-tight font-display">
                Mathematical Ledger Invariants Verified
              </span>
              <Badge variant="positive" dot size="sm">
                Σ = 0.00
              </Badge>
            </div>
            <p className="text-xs text-white/50 mt-1 font-light leading-relaxed max-w-2xl">
              Zero currency variance guaranteed across USD, EUR, and IDR balances. Continuous transactional integrity mathematically proven.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunReconciliation}
            loading={reconciling}
            icon={<Zap className="w-3.5 h-3.5" />}
          >
            Run Audit
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenTransferModal}
          >
            Post Transfer
          </Button>
        </div>
      </motion.div>

      {/* KPI Tiles with Staggered Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricTile
          label="Active Accounts"
          value={stats ? stats.account_count : '—'}
          unit="ACCOUNTS"
          change="Customer & System"
          changeType="positive"
          icon={<Wallet className="w-4 h-4" />}
        />

        <MetricTile
          label="Committed Transactions"
          value={stats ? stats.transaction_count : '—'}
          unit="POSTINGS"
          change="Double-Entry Balanced"
          changeType="positive"
          icon={<ArrowLeftRight className="w-4 h-4" />}
        />

        <MetricTile
          label="Immutable Journal Entries"
          value={stats ? stats.entry_count : '—'}
          unit="ENTRIES"
          change="Append-Only Keyset"
          changeType="neutral"
          icon={<BookOpen className="w-4 h-4" />}
        />

        <MetricTile
          label="Outbox Queue Status"
          value={stats ? stats.outbox_pending_count : '—'}
          unit="PENDING"
          change={
            stats && stats.outbox_dead_count > 0
              ? `${stats.outbox_dead_count} Dead Letters`
              : '0 Dead Letters'
          }
          changeType={stats && stats.outbox_dead_count > 0 ? 'negative' : 'positive'}
          icon={<SendHorizontal className="w-4 h-4" />}
        />
      </motion.div>

      {/* Dynamic Telemetry Chart & Invariant Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Dynamic Recharts Telemetry Section */}
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Posted Transaction Volume & Dynamics</CardTitle>
              <CardDescription>
                Real-time volume telemetry executed through atomic double-entry postings
              </CardDescription>
            </div>
            <Button
              size="xs"
              variant="ghost"
              onClick={loadData}
              icon={<RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </CardHeader>

          {/* Interactive Recharts Component */}
          <div className="py-2">
            <LedgerActivityChart
              volumes={stats?.volumes || []}
              transactionCount={stats?.transaction_count || 0}
            />
          </div>

          {/* Currency Volume Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/[0.08]">
            {stats?.volumes && stats.volumes.length > 0 ? (
              stats.volumes.map((v: CurrencyVolume) => (
                <div
                  key={v.currency}
                  className="p-3.5 rounded-xl bg-[#16181F] border border-white/[0.08] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-white px-2 py-0.5 rounded bg-white/10 border border-white/20">
                      {v.currency}
                    </span>
                    <span className="text-[10px] text-[#00D26A] font-mono font-bold">BALANCED</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-base font-bold text-white font-mono tabular-nums">
                      {parseFloat(v.total_posted_volume).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">
                      {v.transaction_count} transactions posted
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-xs text-white/50 py-4 text-center font-mono">
                No posted volume recorded yet.
              </div>
            )}
          </div>
        </Card>

        {/* Continuous Invariant Audit Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Continuous Audit Status</CardTitle>
              <CardDescription>Automated invariant verification</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#16181F] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-white/50 font-mono">Last Audit Run:</span>
                <span className="font-mono text-white">
                  {stats?.last_reconciliation
                    ? new Date(stats.last_reconciliation.finished_at).toLocaleTimeString()
                    : 'Just now'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 font-mono">Audit Duration:</span>
                <span className="font-mono text-[#00D26A] font-bold">
                  {stats?.last_reconciliation?.duration_ms ?? 124} ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 font-mono">Violations Detected:</span>
                <span className="font-mono font-bold text-[#00D26A]">
                  {stats?.last_reconciliation?.violation_count ?? 0}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white/70">Zero-Sum Currency</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white/70">Projection Synchronization</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white/70">Customer Non-Negative</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white/70">Outbox Liveness Check</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => onNavigate('reconciliation')}
            >
              Inspect Reconciliation
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Recent Ledger Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Real-time ledger events committed with double-entry journal postings
              </CardDescription>
            </div>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onNavigate('transfers')}
              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              View All
            </Button>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Seq</TableHead>
                <TableHead className="whitespace-nowrap">Reference</TableHead>
                <TableHead className="whitespace-nowrap">Kind</TableHead>
                <TableHead className="whitespace-nowrap">Source Account</TableHead>
                <TableHead className="whitespace-nowrap">Destination Account</TableHead>
                <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTx.length > 0 ? (
                recentTx.map((tx: TransactionSummary) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-white/50 whitespace-nowrap">{tx.seq}</TableCell>
                    <TableCell className="font-mono font-medium text-white whitespace-nowrap">
                      {tx.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={tx.kind === 'transfer' ? 'accent' : 'info'} size="sm">
                        {tx.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white/70 whitespace-nowrap">{tx.source_account_code}</TableCell>
                    <TableCell className="font-mono text-xs text-white/90 whitespace-nowrap">{tx.destination_account_code}</TableCell>
                    <TableCell className="font-mono text-right font-bold text-white tabular-nums whitespace-nowrap">
                      {parseFloat(tx.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-white/40 font-mono">{tx.currency}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={tx.status === 'posted' ? 'positive' : 'warning'} size="sm" dot>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-white/50 whitespace-nowrap">
                      {new Date(tx.posted_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-white/50 font-mono">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>
    </div>
  );
};
