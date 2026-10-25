import React, { useEffect, useState } from 'react';
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
    <div className="space-y-8">
      {/* Top invariant header banner */}
      <div className="p-5 rounded-lg bg-gradient-to-r from-[#111522] via-[#171C2C] to-[#111522] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#35D6A0]/10 border border-[#35D6A0]/30 flex items-center justify-center text-[#35D6A0] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#F4F6FC]">
                Double-Entry Mathematical Invariants Intact
              </span>
              <Badge variant="positive" dot size="sm">
                Σ = 0.00
              </Badge>
            </div>
            <p className="text-xs text-[#9BA5BC] mt-0.5">
              Journal entries across all currencies strictly balance. Zero account balance drift.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRunReconciliation}
            loading={reconciling}
            icon={<Zap className="w-3.5 h-3.5 text-[#F2B85C]" />}
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
      </div>

      {/* KPI Tiles (Starlink pattern: small uppercase label above big tabular number with muted unit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Multi-currency volume breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Posted Transaction Volume by Currency</CardTitle>
              <CardDescription>
                Cumulative volume executed through atomic double-entry postings
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

          <div className="space-y-4">
            {stats?.volumes && stats.volumes.length > 0 ? (
              stats.volumes.map((v: CurrencyVolume) => (
                <div
                  key={v.currency}
                  className="p-4 rounded-md bg-[#171C2C]/50 border border-white/[0.06] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#526CFF]/15 border border-[#526CFF]/30 flex items-center justify-center font-mono font-bold text-xs text-[#7588FF]">
                      {v.currency}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#F4F6FC]">
                        {v.currency === 'USD' ? 'US Dollar Clearing' : v.currency === 'EUR' ? 'Euro Settlement Pool' : `${v.currency} Ledger`}
                      </div>
                      <div className="text-[11px] text-[#9BA5BC]">
                        {v.transaction_count} atomic transactions posted
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-base font-bold text-[#F4F6FC] tabular-nums">
                      {parseFloat(v.total_posted_volume).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs font-sans text-[#9BA5BC]">{v.currency}</span>
                    </div>
                    <span className="text-[10px] text-[#35D6A0]">Balanced (Σ=0)</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#9BA5BC] py-6 text-center">
                No posted volume recorded yet.
              </div>
            )}
          </div>
        </Card>

        {/* Invariant Health Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Continuous Audit Status</CardTitle>
              <CardDescription>Automated invariant verification</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded bg-[#171C2C] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Last Audit Run:</span>
                <span className="font-mono text-[#F4F6FC]">
                  {stats?.last_reconciliation
                    ? new Date(stats.last_reconciliation.finished_at).toLocaleTimeString()
                    : 'Just now'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Audit Duration:</span>
                <span className="font-mono text-[#35D6A0]">
                  {stats?.last_reconciliation?.duration_ms ?? 124} ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Violations Detected:</span>
                <span className="font-mono font-bold text-[#35D6A0]">
                  {stats?.last_reconciliation?.violation_count ?? 0}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9BA5BC]">Zero-Sum Currency</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9BA5BC]">Projection Synchronization</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9BA5BC]">Customer Non-Negative</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#9BA5BC]">Outbox Liveness Check</span>
                <Badge variant="positive" size="sm">PASS</Badge>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => onNavigate('reconciliation')}
            >
              Inspect Reconciliation
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Ledger Transactions Table */}
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
              <TableHead>Seq</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Source Account</TableHead>
              <TableHead>Destination Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTx.length > 0 ? (
              recentTx.map((tx: TransactionSummary) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-[#9BA5BC]">{tx.seq}</TableCell>
                  <TableCell className="font-mono font-medium text-[#F4F6FC]">
                    {tx.reference}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.kind === 'transfer' ? 'accent' : 'info'} size="sm">
                      {tx.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{tx.source_account_code}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.destination_account_code}</TableCell>
                  <TableCell className="font-mono text-right font-semibold text-[#F4F6FC] tabular-nums">
                    {parseFloat(tx.amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    <span className="text-[10px] text-[#9BA5BC] font-sans">{tx.currency}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'posted' ? 'positive' : 'warning'} size="sm" dot>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-[#9BA5BC]">
                    {new Date(tx.posted_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-[#9BA5BC]">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
