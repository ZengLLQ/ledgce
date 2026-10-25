import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Plus,
  RefreshCw,
  Search,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { api } from '../api/client';
import type {
  AccountView,
  EntryView,
  LifecycleEvent,
  PostTransferRequest,
  TransactionDetail,
  TransactionSummary,
} from '../types/api';
import { useToast } from '../components/ui/Toast';

interface TransfersViewProps {
  initialSourceAccountId?: string;
  isTransferModalOpen?: boolean;
  onCloseTransferModal?: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  initialSourceAccountId,
  isTransferModalOpen = false,
  onCloseTransferModal,
}) => {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'transfer' | 'reversal' | 'opening_balance'>('all');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionDetail | null>(null);
  const [reversingTx, setReversingTx] = useState<TransactionSummary | null>(null);

  // Forms
  const [transferForm, setTransferForm] = useState<PostTransferRequest>({
    source_account_id: initialSourceAccountId || '',
    destination_account_id: '',
    amount: '',
    currency: 'USD',
    reference: '',
    description: '',
    idempotency_key: `idem-${Date.now()}`,
  });

  const [reverseReason, setReverseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, accRes] = await Promise.all([
        api.listTransactions({
          search: search || undefined,
          kind: activeTab === 'all' ? undefined : activeTab,
        }),
        api.listAccounts(),
      ]);
      setTransactions(txRes.items);
      setAccounts(accRes.items);
    } catch (err: unknown) {
      showToast('Error loading transfers', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (isTransferModalOpen) {
      setIsSubmitModalOpen(true);
    }
  }, [isTransferModalOpen]);

  useEffect(() => {
    if (initialSourceAccountId) {
      setTransferForm((prev: PostTransferRequest) => ({
        ...prev,
        source_account_id: initialSourceAccountId,
      }));
      setIsSubmitModalOpen(true);
    }
  }, [initialSourceAccountId]);

  const handlePostTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const outcome = await api.postTransfer(transferForm);
      showToast(
        outcome.replayed ? 'Idempotent Replay Acknowledged' : 'Transfer Posted Successfully',
        `Reference ${outcome.transaction.reference} (${outcome.transaction.amount} ${outcome.transaction.currency}) recorded with 2 journal entries.`,
        'success'
      );
      setIsSubmitModalOpen(false);
      if (onCloseTransferModal) onCloseTransferModal();
      setTransferForm({
        source_account_id: '',
        destination_account_id: '',
        amount: '',
        currency: 'USD',
        reference: '',
        description: '',
        idempotency_key: `idem-${Date.now()}`,
      });
      loadData();
    } catch (err: unknown) {
      showToast('Transfer failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReverseTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingTx) return;

    try {
      setSubmitting(true);
      const outcome = await api.reverseTransfer({
        transaction_id: reversingTx.id,
        reason: reverseReason,
        idempotency_key: `rev-idem-${Date.now()}`,
      });
      showToast(
        'Transaction Reversed',
        `Compensating transaction ${outcome.transaction.reference} created. Original balances restored.`,
        'success'
      );
      setIsReverseModalOpen(false);
      setReversingTx(null);
      setReverseReason('');
      loadData();
    } catch (err: unknown) {
      showToast('Reversal failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openTxDetail = async (id: string) => {
    try {
      const detail = await api.getTransaction(id);
      setSelectedTxDetail(detail);
      setIsDetailModalOpen(true);
    } catch (err: unknown) {
      showToast('Error loading transaction detail', err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const refreshIdempotencyKey = () => {
    setTransferForm((prev: PostTransferRequest) => ({
      ...prev,
      idempotency_key: `idem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: 'all', label: 'All Postings' },
            { id: 'transfer', label: 'Transfers' },
            { id: 'reversal', label: 'Reversals' },
            { id: 'opening_balance', label: 'Opening Balances' },
          ]}
          activeTab={activeTab}
          onChange={(id: string) =>
            setActiveTab(id as 'all' | 'transfer' | 'reversal' | 'opening_balance')
          }
        />

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="SEARCH REFERENCE / MEMO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="h-10 pl-9 pr-3 text-xs rounded bg-[#141414] border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-all w-48 sm:w-64 font-mono uppercase"
            />
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={() => {
              refreshIdempotencyKey();
              setIsSubmitModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Submit Transfer
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Committed Ledger Transactions</CardTitle>
            <CardDescription>
              Atomic multi-legged double-entry movements with strict idempotency and audit logs
            </CardDescription>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={loadData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-[#9BA5BC]">{tx.seq}</TableCell>
                  <TableCell className="font-mono font-medium text-[#F4F6FC]">
                    <div>{tx.reference}</div>
                    {tx.description && (
                      <div className="text-[10px] text-[#9BA5BC] truncate max-w-xs">
                        {tx.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.kind === 'transfer'
                          ? 'accent'
                          : tx.kind === 'reversal'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {tx.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#9BA5BC]">
                    {tx.source_account_code}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#F4F6FC]">
                    {tx.destination_account_code}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm text-[#F4F6FC] tabular-nums">
                    {parseFloat(tx.amount).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    <span className="text-[10px] text-[#9BA5BC] font-sans font-normal">
                      {tx.currency}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === 'posted'
                          ? 'positive'
                          : tx.status === 'reversed'
                          ? 'warning'
                          : 'error'
                      }
                      size="sm"
                      dot
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-[#9BA5BC]">
                    {new Date(tx.posted_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openTxDetail(tx.id)}
                        title="Inspect Double-Entry Journal"
                        icon={<Eye className="w-3.5 h-3.5" />}
                      />
                      {tx.status === 'posted' && tx.kind !== 'reversal' && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setReversingTx(tx);
                            setIsReverseModalOpen(true);
                          }}
                          title="Reverse Transaction"
                          icon={<RotateCcw className="w-3.5 h-3.5 text-[#F2B85C]" />}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-[#9BA5BC]">
                  No transactions recorded matching filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Submit Transfer Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          if (onCloseTransferModal) onCloseTransferModal();
        }}
        title="Post Atomic Double-Entry Transfer"
        description="Transfers funds atomically between two accounts with deterministic row ordering and idempotency protection."
        size="lg"
      >
        <form onSubmit={handlePostTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Source Account (Debit) *
              </label>
              <select
                required
                value={transferForm.source_account_id}
                onChange={(e) => {
                  const acc = accounts.find((a) => a.id === e.target.value);
                  setTransferForm({
                    ...transferForm,
                    source_account_id: e.target.value,
                    currency: acc ? acc.currency : transferForm.currency,
                  });
                }}
                className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white font-mono focus:border-white focus:outline-none transition-all"
              >
                <option value="">SELECT SOURCE ACCOUNT...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} ({a.currency}) — BAL: {a.balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Destination Account (Credit) *
              </label>
              <select
                required
                value={transferForm.destination_account_id}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, destination_account_id: e.target.value })
                }
                className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white font-mono focus:border-white focus:outline-none transition-all"
              >
                <option value="">SELECT DESTINATION ACCOUNT...</option>
                {accounts
                  .filter((a) => a.id !== transferForm.source_account_id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} ({a.currency}) — BAL: {a.balance}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Transfer Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="250.00"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white font-mono font-bold focus:border-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <input
                type="text"
                readOnly
                value={transferForm.currency}
                className="w-full h-10 px-3.5 rounded bg-[#161616] border border-white/10 text-xs text-white/50 font-mono select-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Custom Reference
              </label>
              <input
                type="text"
                placeholder="e.g. TX-SETTLE-4091"
                value={transferForm.reference || ''}
                onChange={(e) => setTransferForm({ ...transferForm, reference: e.target.value })}
                className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white font-mono focus:border-white focus:outline-none transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Description / Memo
              </label>
              <input
                type="text"
                placeholder="Wholesale payout..."
                value={transferForm.description || ''}
                onChange={(e) =>
                  setTransferForm({ ...transferForm, description: e.target.value })
                }
                className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white focus:border-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider">
                Idempotency Key (SHA-256 Validated) *
              </label>
              <button
                type="button"
                onClick={refreshIdempotencyKey}
                className="text-[11px] font-mono text-white hover:underline uppercase"
              >
                Regenerate Key
              </button>
            </div>
            <input
              type="text"
              required
              value={transferForm.idempotency_key || ''}
              onChange={(e) =>
                setTransferForm({ ...transferForm, idempotency_key: e.target.value })
              }
              className="w-full h-10 px-3.5 rounded bg-[#141414] border border-white/15 text-xs text-white font-mono focus:border-white focus:outline-none transition-all"
            />
          </div>

          {/* Mathematical Preview Box */}
          <div className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#FF453A]">Debit Leg:</span>
              <span className="font-bold">
                -{transferForm.amount || '0.00'} {transferForm.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#00D26A]">Credit Leg:</span>
              <span className="font-bold">
                +{transferForm.amount || '0.00'} {transferForm.currency}
              </span>
            </div>
            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono font-bold">
              <span className="text-white/50">Double-Entry Sum:</span>
              <span className="text-[#00D26A]">Σ = 0.00 (BALANCED)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsSubmitModalOpen(false);
                if (onCloseTransferModal) onCloseTransferModal();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Commit Double-Entry Transfer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reverse Transaction Modal */}
      <Modal
        isOpen={isReverseModalOpen}
        onClose={() => setIsReverseModalOpen(false)}
        title="Reverse Committed Transaction"
        description="Creates an atomic compensating transaction that mirrors original legs in reverse order."
      >
        {reversingTx && (
          <form onSubmit={handleReverseTransfer} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-[#171C2C] border border-white/[0.08] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Transaction Reference:</span>
                <span className="font-mono font-bold text-[#F4F6FC]">{reversingTx.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Transfer Amount:</span>
                <span className="font-mono text-[#F4F6FC]">
                  {reversingTx.amount} {reversingTx.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9BA5BC]">Source &rarr; Dest:</span>
                <span className="font-mono text-[11px]">
                  {reversingTx.source_account_code} &rarr; {reversingTx.destination_account_code}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
                Reason for Reversal *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Customer requested refund or error in original invoice"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="w-full p-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] focus:border-[#526CFF] focus:outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsReverseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={submitting}>
                Execute Reversal
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Transaction Deep Inspector Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Transaction & Journal Inspector"
        description="Full multi-legged audit trace showing individual journal entries, outbox stage, and lifecycle events."
        size="lg"
      >
        {selectedTxDetail ? (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-[#171C2C] border border-white/[0.08] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#9BA5BC] uppercase">TRANSACTION</span>
                <div className="text-base font-bold font-mono text-[#F4F6FC]">
                  {selectedTxDetail.reference}
                </div>
                <div className="text-xs text-[#9BA5BC] mt-0.5">
                  Seq #{selectedTxDetail.seq} · {selectedTxDetail.kind}
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={selectedTxDetail.status === 'posted' ? 'positive' : 'warning'}
                  size="md"
                  dot
                >
                  {selectedTxDetail.status}
                </Badge>
                <div className="text-base font-bold font-mono text-[#F4F6FC] mt-1 tabular-nums">
                  {selectedTxDetail.amount} {selectedTxDetail.currency}
                </div>
              </div>
            </div>

            {/* Entries Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-[#F4F6FC] uppercase tracking-wider">
                  Double-Entry Journal Legs ({selectedTxDetail.entries.length})
                </h4>
                <span className="text-[11px] font-mono text-[#35D6A0]">
                  Balanced: {selectedTxDetail.total_debit} = {selectedTxDetail.total_credit}
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seq</TableHead>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right text-[#FF6B78]">Debit</TableHead>
                    <TableHead className="text-right text-[#35D6A0]">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTxDetail.entries.map((entry: EntryView) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-[#9BA5BC]">{entry.seq}</TableCell>
                      <TableCell className="font-mono font-medium">{entry.account_code}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.currency}</TableCell>
                      <TableCell className="font-mono text-right tabular-nums text-[#FF6B78]">
                        {parseFloat(entry.debit) > 0 ? entry.debit : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-right tabular-nums text-[#35D6A0]">
                        {parseFloat(entry.credit) > 0 ? entry.credit : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Lifecycle Events */}
            <div>
              <h4 className="text-xs font-semibold text-[#F4F6FC] uppercase tracking-wider mb-2">
                Lifecycle Audit Timeline
              </h4>
              <div className="space-y-2">
                {selectedTxDetail.lifecycle.map((lc: LifecycleEvent) => (
                  <div
                    key={lc.id}
                    className="p-3 rounded bg-[#171C2C] border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#526CFF] uppercase font-mono mr-2">
                        [{lc.state}]
                      </span>
                      <span className="text-[#F4F6FC]">{lc.detail || 'Event registered'}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#9BA5BC]">
                      {new Date(lc.occurred_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#9BA5BC]">Loading transaction details...</div>
        )}
      </Modal>
    </div>
  );
};
