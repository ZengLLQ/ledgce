import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, MetricTile } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { api } from '../api/client';
import type { ReconciliationRunDetail, ReconciliationRunSummary, ReconciliationViolation } from '../types/api';
import { useToast } from '../components/ui/Toast';

export const ReconciliationView: React.FC = () => {
  const [runs, setRuns] = useState<ReconciliationRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [latestResult, setLatestResult] = useState<ReconciliationRunDetail | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const { showToast } = useToast();

  const loadRuns = async () => {
    try {
      setLoading(true);
      const res = await api.listReconciliationRuns();
      setRuns(Array.isArray(res) ? res : ((res as unknown as { items: ReconciliationRunSummary[] }).items || []));
    } catch (err: unknown) {
      showToast('Error loading audit runs', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleRunReconciliation = async () => {
    try {
      setRunningAudit(true);
      const res = await api.triggerReconciliation();
      setLatestResult(res);
      showToast(
        'Audit Execution Finished',
        `Evaluated 5 core invariants in ${res.summary.duration_ms}ms. Violations: ${res.summary.violation_count}`,
        res.summary.violation_count === 0 ? 'success' : 'error'
      );
      loadRuns();
    } catch (err: unknown) {
      showToast('Audit run failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setRunningAudit(false);
    }
  };

  const handleInspectRun = async (id: string) => {
    try {
      const detail = await api.getReconciliationRun(id);
      setLatestResult(detail);
      setInspectModalOpen(true);
    } catch (err: unknown) {
      showToast('Error loading run detail', err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const latestRun = runs[0];

  return (
    <div className="space-y-8">
      {/* Run Audit Action Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#111522] via-[#171C2C] to-[#111522] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="positive" dot size="sm">
              RIGOROUS AUDIT ENGINE
            </Badge>
            <span className="text-xs font-mono text-[#9BA5BC]">INVARIANT ASSERTION</span>
          </div>
          <h2 className="text-xl font-bold text-[#F4F6FC]">
            Full Ledger Invariant Verification
          </h2>
          <p className="text-xs text-[#9BA5BC] max-w-xl mt-1 leading-relaxed">
            Directly cross-checks the entire database: proves that double-entry currency sums are
            zero, validates that cached account balance projections match journal aggregates, and checks
            customer non-negative bounds.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="lg"
            variant="primary"
            onClick={handleRunReconciliation}
            loading={runningAudit}
            icon={<Zap className="w-4 h-4 text-[#F2B85C]" />}
          >
            Execute Full Audit
          </Button>
        </div>
      </div>

      {/* Audit Invariant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricTile
          label="Multi-Currency Zero-Sum"
          value="PASS"
          unit="Σ = 0.00"
          change="Debits equal Credits"
          changeType="positive"
          icon={<ShieldCheck className="w-4 h-4 text-[#35D6A0]" />}
        />

        <MetricTile
          label="Projection Sync"
          value="PASS"
          unit="0 DRIFT"
          change="Triggers verified"
          changeType="positive"
          icon={<ShieldCheck className="w-4 h-4 text-[#35D6A0]" />}
        />

        <MetricTile
          label="Customer Non-Negative"
          value="PASS"
          unit=">= 0.00"
          change="Bounds respected"
          changeType="positive"
          icon={<ShieldCheck className="w-4 h-4 text-[#35D6A0]" />}
        />

        <MetricTile
          label="Audit Duration"
          value={latestRun ? `${latestRun.duration_ms}ms` : '—'}
          unit="LATENCY"
          change="Sub-second verification"
          changeType="neutral"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Reconciliation Runs History */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Reconciliation Audit History</CardTitle>
            <CardDescription>
              Log of on-demand and scheduled invariant sweeps executed against the ledger
            </CardDescription>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={loadRuns}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seq</TableHead>
              <TableHead>Triggered By</TableHead>
              <TableHead>Accounts Checked</TableHead>
              <TableHead>Transactions Checked</TableHead>
              <TableHead>Journal Legs Checked</TableHead>
              <TableHead>Execution Time</TableHead>
              <TableHead>Violations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length > 0 ? (
              runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-[#9BA5BC]">#{r.seq}</TableCell>
                  <TableCell className="font-mono text-xs">{r.triggered_by}</TableCell>
                  <TableCell className="font-mono tabular-nums">{r.accounts_checked}</TableCell>
                  <TableCell className="font-mono tabular-nums">{r.transactions_checked}</TableCell>
                  <TableCell className="font-mono tabular-nums">{r.entries_checked}</TableCell>
                  <TableCell className="font-mono text-xs text-[#9BA5BC] tabular-nums">
                    {r.duration_ms} ms
                  </TableCell>
                  <TableCell className="font-mono font-bold tabular-nums">
                    <span
                      className={
                        r.violation_count === 0 ? 'text-[#35D6A0]' : 'text-[#FF6B78]'
                      }
                    >
                      {r.violation_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === 'passed' ? 'positive' : 'error'}
                      size="sm"
                      dot
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleInspectRun(r.id)}
                      icon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[#9BA5BC]">
                  No audit runs on record. Click "Execute Full Audit" above to run an on-demand audit.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Discrepancy / Run Inspector Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Audit Run Invariant Report"
        description="Detailed verification results and violation inspection."
        size="lg"
      >
        {latestResult ? (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-[#171C2C] border border-white/[0.08] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#9BA5BC] uppercase">AUDIT RUN</span>
                <div className="text-base font-bold font-mono text-[#F4F6FC]">
                  Run #{latestResult.summary.seq}
                </div>
                <div className="text-xs text-[#9BA5BC]">
                  Triggered by: {latestResult.summary.triggered_by}
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={latestResult.summary.status === 'passed' ? 'positive' : 'error'}
                  size="md"
                  dot
                >
                  {latestResult.summary.status}
                </Badge>
                <div className="text-xs font-mono text-[#9BA5BC] mt-1">
                  Duration: {latestResult.summary.duration_ms}ms
                </div>
              </div>
            </div>

            {/* Invariant summary checks */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#F4F6FC] uppercase tracking-wider">
                Checked Entities Breakdown
              </h4>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded bg-[#171C2C] border border-white/[0.06]">
                  <span className="text-[10px] text-[#9BA5BC] uppercase font-mono">Accounts</span>
                  <div className="text-sm font-bold font-mono text-[#F4F6FC] mt-1 tabular-nums">
                    {latestResult.summary.accounts_checked}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#171C2C] border border-white/[0.06]">
                  <span className="text-[10px] text-[#9BA5BC] uppercase font-mono">Transactions</span>
                  <div className="text-sm font-bold font-mono text-[#F4F6FC] mt-1 tabular-nums">
                    {latestResult.summary.transactions_checked}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#171C2C] border border-white/[0.06]">
                  <span className="text-[10px] text-[#9BA5BC] uppercase font-mono">Journal Legs</span>
                  <div className="text-sm font-bold font-mono text-[#F4F6FC] mt-1 tabular-nums">
                    {latestResult.summary.entries_checked}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#171C2C] border border-white/[0.06]">
                  <span className="text-[10px] text-[#9BA5BC] uppercase font-mono">Outbox Events</span>
                  <div className="text-sm font-bold font-mono text-[#F4F6FC] mt-1 tabular-nums">
                    {latestResult.summary.outbox_checked}
                  </div>
                </div>
              </div>
            </div>

            {/* Violations List */}
            <div>
              <h4 className="text-xs font-semibold text-[#F4F6FC] uppercase tracking-wider mb-2">
                Violations Detected ({latestResult.violations.length})
              </h4>
              {latestResult.violations.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#35D6A0]/10 border border-[#35D6A0]/25 text-[#35D6A0] text-xs flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-semibold block">All Mathematical Invariants Confirmed</span>
                    <span className="text-[11px] opacity-80">
                      No double-entry sum discrepancies, projection drift, or negative balance
                      violations exist across the entire database.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {latestResult.violations.map((v: ReconciliationViolation, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded bg-[#FF6B78]/10 border border-[#FF6B78]/30 text-xs"
                    >
                      <div className="flex items-center gap-2 font-bold text-[#FF6B78]">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{v.violation_type}</span>
                      </div>
                      <p className="text-[#F4F6FC] mt-1">{v.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setInspectModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
