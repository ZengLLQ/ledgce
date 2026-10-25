import React, { useEffect, useState } from 'react';
import {
  Activity,
  Database,
  Cpu,
  Flame,
  ShieldCheck,
  RefreshCw,
  Radio,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, MetricTile } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { api } from '../api/client';
import type { ArmFaultRequest, FaultInjectionView, SystemHealthView as ISystemHealthView, WorkerHeartbeatView } from '../types/api';
import { useToast } from '../components/ui/Toast';

export const SystemHealthView: React.FC = () => {
  const [health, setHealth] = useState<ISystemHealthView | null>(null);
  const [loading, setLoading] = useState(true);
  const [arming, setArming] = useState(false);
  const [disarming, setDisarming] = useState(false);

  // Fault arming form
  const [faultPoint, setFaultPoint] = useState<string>('post_transfer_before_commit');
  const [faultCount, setFaultCount] = useState<number>(1);

  const { showToast } = useToast();

  const loadHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemHealth();
      setHealth(res);
    } catch (err: unknown) {
      showToast('Error loading system health', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleArmFault = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setArming(true);
      const req: ArmFaultRequest = {
        point: faultPoint,
        count: faultCount,
      };
      const armed = await api.armFault(req);
      showToast(
        'Fault Injection Armed',
        `Chaos target [${armed.point}] armed for the next ${armed.remaining} execution(s). Invariants will test automatic rollback.`,
        'warning'
      );
      loadHealth();
    } catch (err: unknown) {
      showToast('Failed to arm fault', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setArming(false);
    }
  };

  const handleDisarmAll = async () => {
    try {
      setDisarming(true);
      await api.disarmFaults();
      showToast('Chaos Disarmed', 'All fault injection points disarmed. Normal operations resumed.', 'info');
      loadHealth();
    } catch (err: unknown) {
      showToast('Disarm failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setDisarming(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Health Header */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#111522] via-[#171C2C] to-[#111522] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#35D6A0]/10 border border-[#35D6A0]/30 flex items-center justify-center text-[#35D6A0] shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#F4F6FC]">
                Ledger Node Status: {health?.status.toUpperCase() || 'ONLINE'}
              </span>
              <Badge variant="positive" dot size="md">
                Continuous Telemetry
              </Badge>
            </div>
            <p className="text-xs text-[#9BA5BC] mt-0.5 max-w-xl">
              Real-time monitoring of database connection pools, mathematical invariant checks,
              worker leases, and chaos simulation harnesses.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadHealth}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Health
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Database Connection"
          value={health?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
          unit="POSTGRES 16"
          change="Pool Active"
          changeType={health?.database_connected ? 'positive' : 'negative'}
          icon={<Database className="w-4 h-4" />}
        />

        <MetricTile
          label="Ledger Invariants"
          value={health?.ledger_invariants_pass ? 'VALIDATED' : 'DISCREPANCY'}
          unit="Σ = 0.00"
          change="Zero Drift"
          changeType={health?.ledger_invariants_pass ? 'positive' : 'negative'}
          icon={<ShieldCheck className="w-4 h-4 text-[#35D6A0]" />}
        />

        <MetricTile
          label="Outbox Backlog"
          value={health ? health.outbox_backlog : '—'}
          unit="EVENTS"
          change="Queue Depth"
          changeType="neutral"
          icon={<Activity className="w-4 h-4" />}
        />

        <MetricTile
          label="Active Chaos Faults"
          value={health ? health.active_faults.length : '0'}
          unit="ARMED"
          change={health && health.active_faults.length > 0 ? 'Fault Simulation Active' : 'Normal Operations'}
          changeType={health && health.active_faults.length > 0 ? 'warning' : 'positive'}
          icon={<Flame className="w-4 h-4 text-[#F2B85C]" />}
        />
      </div>

      {/* Workers Telemetry Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Autonomous Worker Fleet Heartbeats</CardTitle>
            <CardDescription>
              Distributed worker processes handling outbox event delivery and background reconciliation audits
            </CardDescription>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Node ID</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Last Heartbeat</TableHead>
              <TableHead className="text-right">Processed Count</TableHead>
              <TableHead className="text-right">Failed Count</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {health?.workers && health.workers.length > 0 ? (
              health.workers.map((w: WorkerHeartbeatView) => (
                <TableRow key={w.worker_id}>
                  <TableCell className="font-mono font-semibold text-[#F4F6FC]">
                    <span className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-[#526CFF]" />
                      {w.worker_id}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-[#9BA5BC]">
                    {new Date(w.started_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-[#9BA5BC]">
                    {new Date(w.last_seen_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="font-mono text-right tabular-nums text-[#35D6A0]">
                    {w.processed_count}
                  </TableCell>
                  <TableCell className="font-mono text-right tabular-nums text-[#FF6B78]">
                    {w.failed_count}
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.is_healthy ? 'positive' : 'error'} size="sm" dot>
                      {w.is_healthy ? 'HEALTHY' : 'UNRESPONSIVE'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[#9BA5BC]">
                  No active worker heartbeats detected.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Chaos Engineering & Fault Injection Arming */}
      <Card className="border-[#F2B85C]/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#F2B85C]/15 border border-[#F2B85C]/30 flex items-center justify-center text-[#F2B85C]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Chaos Invariant Testing (Fault Injection)</CardTitle>
              <CardDescription>
                Arm simulated system failures to prove that Ledgce atomically aborts and rolls back
                without corrupting double-entry balances.
              </CardDescription>
            </div>
          </div>
          {health?.active_faults && health.active_faults.length > 0 && (
            <Button
              size="xs"
              variant="outline"
              onClick={handleDisarmAll}
              loading={disarming}
              icon={<Trash2 className="w-3 h-3 text-[#FF6B78]" />}
            >
              Disarm All Faults
            </Button>
          )}
        </CardHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Arm Fault Form */}
          <form onSubmit={handleArmFault} className="space-y-4 p-5 rounded-xl bg-[#161616] border border-white/10">
            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Target Fault Point *
              </label>
              <select
                value={faultPoint}
                onChange={(e) => setFaultPoint(e.target.value)}
                className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white focus:border-white focus:outline-none font-mono transition-all"
              >
                <option value="post_transfer_before_commit">
                  post_transfer_before_commit (Simulate crash before journal commit)
                </option>
                <option value="outbox_delivery_network_partition">
                  outbox_delivery_network_partition (Simulate downstream network timeout)
                </option>
                <option value="idempotency_race_condition">
                  idempotency_race_condition (Simulate concurrent duplicate key collision)
                </option>
                <option value="reconciliation_drift_simulation">
                  reconciliation_drift_simulation (Inject memory verification alarm)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Trigger Count (Remaining Executions) *
              </label>
              <select
                value={faultCount}
                onChange={(e) => setFaultCount(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white focus:border-white focus:outline-none font-mono transition-all"
              >
                <option value={1}>1 execution (One-shot failure)</option>
                <option value={3}>3 executions</option>
                <option value={5}>5 executions (Sustained fault)</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="outline"
              loading={arming}
              className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black font-bold uppercase tracking-wider"
              icon={<Flame className="w-4 h-4" />}
            >
              Arm Chaos Fault Point
            </Button>
          </form>

          {/* Active Faults List */}
          <div className="p-4 rounded-lg bg-[#171C2C]/50 border border-white/[0.06] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#F4F6FC] uppercase tracking-wider">
                  Currently Armed Faults ({health?.active_faults.length || 0})
                </span>
                <span className="text-[10px] text-[#9BA5BC] font-mono">Real-time Hook</span>
              </div>

              {health?.active_faults && health.active_faults.length > 0 ? (
                <div className="space-y-2">
                  {health.active_faults.map((f: FaultInjectionView, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded bg-[#111522] border border-[#F2B85C]/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-semibold text-[#F2B85C]">{f.point}</div>
                        <div className="text-[10px] text-[#9BA5BC] mt-0.5">
                          Armed at {new Date(f.armed_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant="warning" size="sm">
                        {f.remaining} left
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#9BA5BC]">
                  No active chaos faults armed. All operations execute normally.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] text-[11px] text-[#9BA5BC] leading-relaxed">
              When an armed operation executes, Ledgce raises a simulated fault at that exact hook.
              Inspect the <strong>Reconciliation</strong> view afterwards to prove that invariants remain intact!
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
