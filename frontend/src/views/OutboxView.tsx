import React, { useEffect, useState } from 'react';
import {
  SendHorizontal,
  RotateCw,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, MetricTile } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { api } from '../api/client';
import type { OutboxView as IOutboxView } from '../types/api';
import { useToast } from '../components/ui/Toast';

export const OutboxView: React.FC = () => {
  const [events, setEvents] = useState<IOutboxView[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<IOutboxView | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.listOutbox({
        status: activeTab === 'all' ? undefined : activeTab,
        limit: 50,
      });
      setEvents(res.items);
    } catch (err: unknown) {
      showToast('Error loading outbox events', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  const handleRetry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setRetryingId(id);
      const updated = await api.retryOutboxEvent(id);
      showToast(
        'Event Requeued',
        `Event #${updated.seq} (${updated.event_type}) reset to pending with retry backoff cleared.`,
        'success'
      );
      loadEvents();
    } catch (err: unknown) {
      showToast('Retry failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setRetryingId(null);
    }
  };

  const pendingCount = events.filter((e) => e.status === 'pending').length;
  const deadCount = events.filter((e) => e.status === 'dead').length;
  const publishedCount = events.filter((e) => e.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Top Banner explaining Transactional Outbox guarantee */}
      <div className="p-6 rounded-2xl bg-[#121212] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <SendHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-white uppercase tracking-tight font-mono">
                Transactional Outbox Pattern Active
              </span>
              <Badge variant="info" size="sm">
                Dual-Write Mitigation
              </Badge>
            </div>
            <p className="text-xs text-white/50 mt-1 font-light">
              Every balance movement stages an event atomically into PostgreSQL before publication.
              Lease locks prevent split-brain delivery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={loadEvents}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Outbox Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          label="Pending Queue"
          value={pendingCount}
          unit="EVENTS"
          change="Available for Worker Lease"
          changeType="neutral"
          icon={<Clock className="w-4 h-4 text-[#F2B85C]" />}
        />

        <MetricTile
          label="Published Successfully"
          value={publishedCount}
          unit="DELIVERED"
          change="Downstream ACK Received"
          changeType="positive"
          icon={<CheckCircle2 className="w-4 h-4 text-[#35D6A0]" />}
        />

        <MetricTile
          label="Dead-Letter Queue"
          value={deadCount}
          unit="EXHAUSTED"
          change={deadCount > 0 ? 'Requires Operator Action' : 'Zero Poison Messages'}
          changeType={deadCount > 0 ? 'negative' : 'positive'}
          icon={<AlertOctagon className="w-4 h-4 text-[#FF6B78]" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Events' },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'published', label: 'Published' },
            { id: 'dead', label: 'Dead Letter', count: deadCount },
          ]}
          activeTab={activeTab}
          onChange={(id: string) => setActiveTab(id)}
        />
      </div>

      {/* Outbox Events Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Transactional Outbox Events</CardTitle>
            <CardDescription>
              Guaranteed message queue staged in the same ACID transaction as double-entry ledger postings
            </CardDescription>
          </div>
          <Badge variant="neutral" size="sm">
            SKIP LOCKED Lease Concurrency
          </Badge>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seq</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Aggregate ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Worker Lease</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length > 0 ? (
              events.map((ev) => (
                <TableRow
                  key={ev.id}
                  onClick={() => {
                    setSelectedEvent(ev);
                    setIsDetailOpen(true);
                  }}
                >
                  <TableCell className="font-mono text-[#9BA5BC]">#{ev.seq}</TableCell>
                  <TableCell className="font-mono font-semibold text-[#F4F6FC]">
                    {ev.event_type}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#9BA5BC]">
                    {ev.aggregate_id.slice(0, 16)}...
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ev.status === 'published'
                          ? 'positive'
                          : ev.status === 'pending'
                          ? 'warning'
                          : ev.status === 'processing'
                          ? 'info'
                          : 'error'
                      }
                      size="sm"
                      dot
                    >
                      {ev.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">{ev.attempts} / 5</TableCell>
                  <TableCell className="font-mono text-[11px] text-[#9BA5BC]">
                    {ev.locked_by ? (
                      <span className="flex items-center gap-1 text-[#7588FF]">
                        <Lock className="w-3 h-3" />
                        {ev.locked_by.slice(0, 12)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-[#9BA5BC]">
                    {ev.age_seconds.toFixed(2)}s
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-[#9BA5BC]">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(ev.status === 'dead' || ev.status === 'failed') && (
                      <Button
                        size="xs"
                        variant="secondary"
                        loading={retryingId === ev.id}
                        onClick={(e: React.MouseEvent) => handleRetry(e, ev.id)}
                        icon={<RotateCw className="w-3 h-3 text-[#526CFF]" />}
                      >
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[#9BA5BC]">
                  No outbox events matching the selected status.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Outbox Event Inspector Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Outbox Event Specification"
        description="Detailed delivery and lease tracking for downstream subscriber propagation."
      >
        {selectedEvent ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded bg-[#171C2C] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Event Sequence:</span>
                <span className="font-mono font-bold text-[#F4F6FC]">#{selectedEvent.seq}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Event Type:</span>
                <span className="font-mono font-bold text-[#526CFF]">
                  {selectedEvent.event_type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Aggregate Target ID:</span>
                <span className="font-mono text-[#F4F6FC]">{selectedEvent.aggregate_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Current Status:</span>
                <Badge
                  variant={selectedEvent.status === 'published' ? 'positive' : 'warning'}
                  size="sm"
                >
                  {selectedEvent.status}
                </Badge>
              </div>
            </div>

            {selectedEvent.last_error && (
              <div className="p-3 rounded bg-[#FF6B78]/10 border border-[#FF6B78]/30">
                <span className="font-bold text-[#FF6B78] block mb-1">Last Delivery Error:</span>
                <p className="font-mono text-[11px] text-[#F4F6FC]">{selectedEvent.last_error}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              {(selectedEvent.status === 'dead' || selectedEvent.status === 'failed') && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(e: React.MouseEvent) => {
                    handleRetry(e, selectedEvent.id);
                    setIsDetailOpen(false);
                  }}
                  icon={<RotateCw className="w-3.5 h-3.5" />}
                >
                  Requeue Event
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="ml-auto"
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
