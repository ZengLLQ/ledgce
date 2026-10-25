import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    <div className="space-y-8 select-none font-sans">
      {/* 1. Top Health Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="p-6 sm:p-7 rounded-2xl bg-[#0D0F14] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00D26A]/10 border border-[#00D26A]/30 flex items-center justify-center text-[#00D26A] shrink-0 mt-0.5 sm:mt-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-base sm:text-lg font-bold text-white uppercase tracking-tight font-display">
                Ledger Node Status: {health?.status.toUpperCase() || 'ONLINE'}
              </span>
              <Badge variant="positive" dot size="md">
                Continuous Telemetry
              </Badge>
            </div>
            <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-xl font-light">
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
      </motion.div>

      {/* 2. Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricTile
          label="Database Connection"
          value={health?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
          unit="POSTGRES 17"
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
          icon={<ShieldCheck className="w-4 h-4 text-[#00D26A]" />}
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
          icon={<Flame className="w-4 h-4 text-[#FFAA00]" />}
        />
      </motion.div>

      {/* 3. Workers Telemetry Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
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
                <TableHead className="whitespace-nowrap">Worker Node ID</TableHead>
                <TableHead className="whitespace-nowrap">Started At</TableHead>
                <TableHead className="whitespace-nowrap">Last Heartbeat</TableHead>
                <TableHead className="text-right whitespace-nowrap">Processed Count</TableHead>
                <TableHead className="text-right whitespace-nowrap">Failed Count</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {health?.workers && health.workers.length > 0 ? (
                health.workers.map((w: WorkerHeartbeatView) => (
                  <TableRow key={w.worker_id}>
                    <TableCell className="font-mono font-bold text-white whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-white/60" />
                        {w.worker_id}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-white/50 whitespace-nowrap">
                      {new Date(w.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-white/50 whitespace-nowrap">
                      {new Date(w.last_seen_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-mono text-right tabular-nums text-[#00D26A] font-bold whitespace-nowrap">
                      {w.processed_count}
                    </TableCell>
                    <TableCell className="font-mono text-right tabular-nums text-[#FF453A] font-bold whitespace-nowrap">
                      {w.failed_count}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={w.is_healthy ? 'positive' : 'error'} size="sm" dot>
                        {w.is_healthy ? 'HEALTHY' : 'UNRESPONSIVE'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-white/50 font-mono">
                    No active worker heartbeats detected.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* 4. Chaos Engineering & Fault Injection Arming */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="border-white/15">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFAA00]/15 border border-[#FFAA00]/30 flex items-center justify-center text-[#FFAA00] shrink-0">
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
                icon={<Trash2 className="w-3 h-3 text-[#FF453A]" />}
              >
                Disarm All Faults
              </Button>
            )}
          </CardHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 font-sans">
            {/* Arm Fault Form */}
            <form onSubmit={handleArmFault} className="space-y-4 p-5 rounded-xl bg-[#16181F] border border-white/10">
              <div>
                <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                  Target Fault Point *
                </label>
                <select
                  value={faultPoint}
                  onChange={(e) => setFaultPoint(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#0D0F14] border border-white/15 text-base sm:text-xs text-white focus:border-white focus:outline-none font-mono transition-colors truncate"
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
                  className="w-full h-10 px-3.5 rounded-lg bg-[#0D0F14] border border-white/15 text-base sm:text-xs text-white focus:border-white focus:outline-none font-mono transition-colors"
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
                className="w-full border-[#FFAA00]/40 text-[#FFAA00] hover:bg-[#FFAA00] hover:text-black font-bold uppercase tracking-wider"
                icon={<Flame className="w-4 h-4" />}
              >
                Arm Chaos Fault Point
              </Button>
            </form>

            {/* Active Faults List */}
            <div className="p-5 rounded-xl bg-[#16181F] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Currently Armed Faults ({health?.active_faults.length || 0})
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Real-time Hook</span>
                </div>

                {health?.active_faults && health.active_faults.length > 0 ? (
                  <div className="space-y-2">
                    {health.active_faults.map((f: FaultInjectionView, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-[#0D0F14] border border-[#FFAA00]/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-semibold text-[#FFAA00]">{f.point}</div>
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">
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
                  <div className="py-8 text-center text-xs text-white/40 font-mono">
                    No active chaos faults armed. All operations execute normally.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.08] text-[11px] text-white/50 leading-relaxed font-light">
                When an armed operation executes, Ledgce raises a simulated fault at that exact hook.
                Inspect the <strong>Reconciliation</strong> view afterwards to prove that invariants remain intact!
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
