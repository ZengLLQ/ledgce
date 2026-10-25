import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Plus,
  RefreshCw,
  Search,
  Eye,
  ArrowLeftRight,
  X,
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
  const [transferForm, setTransferForm] = useState<PostTransferRequest>(() => ({
    source_account_id: initialSourceAccountId || '',
    destination_account_id: '',
    amount: '',
    currency: 'USD',
    reference: '',
    description: '',
    idempotency_key: `idem-${Date.now()}`,
  }));

  const [reverseReason, setReverseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const activeSearch = query !== undefined ? query : search;
      const [txRes, accRes] = await Promise.all([
        api.listTransactions({
          search: activeSearch || undefined,
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
  }, [activeTab, search, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    <div className="space-y-6 select-none">
      {/* 1. Header Toolbar with Title and Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-white" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">
              Transfers & Postings
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1 font-light">
            Atomic multi-legged movements executed with row-level locks and strict idempotency assurance.
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => {
            refreshIdempotencyKey();
            setIsSubmitModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Submit Transfer
        </Button>
      </motion.div>

      {/* 2. Responsive Structured Filter & Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="p-3 bg-[#0D0F14] border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="overflow-x-auto no-scrollbar max-w-full">
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
        </div>

        <form onSubmit={(e) => { e.preventDefault(); loadData(); }} className="relative w-full md:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="SEARCH REFERENCE / MEMO..."
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              if (val === '') {
                loadData('');
              }
            }}
            className="w-full h-9 pl-9 pr-8 text-base sm:text-xs rounded-lg bg-[#16181F] border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-all font-mono uppercase"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadData('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </motion.div>

      {/* 3. Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
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
              onClick={() => loadData()}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
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
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-white/50 whitespace-nowrap">{tx.seq}</TableCell>
                    <TableCell className="font-mono font-medium text-white whitespace-nowrap">
                      <div>{tx.reference}</div>
                      {tx.description && (
                        <div className="text-[10px] text-white/40 truncate max-w-xs font-sans">
                          {tx.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
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
                    <TableCell className="font-mono text-xs text-white/60 whitespace-nowrap">
                      {tx.source_account_code}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white/90 whitespace-nowrap">
                      {tx.destination_account_code}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-white tabular-nums whitespace-nowrap">
                      {parseFloat(tx.amount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-white/40 font-mono font-normal">
                        {tx.currency}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
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
                    <TableCell className="font-mono text-[11px] text-white/50 whitespace-nowrap">
                      {new Date(tx.posted_at).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
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
                            icon={<RotateCcw className="w-3.5 h-3.5 text-[#FFAA00]" />}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-white/50 font-mono">
                    No transactions recorded matching filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

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
        <form onSubmit={handlePostTransfer} className="space-y-4 font-sans">
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
                className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
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
                className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono font-bold focus:border-white focus:outline-none transition-colors"
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
                className="w-full h-10 px-3.5 rounded-lg bg-[#16181F]/50 border border-white/10 text-base sm:text-xs text-white/50 font-mono select-none"
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
                className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors uppercase"
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
                className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white focus:border-white focus:outline-none transition-colors"
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
              className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
            />
          </div>

          {/* Mathematical Preview Box */}
          <div className="p-4 rounded-xl bg-[#16181F] border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#FF453A]">Debit Leg:</span>
              <span className="font-bold text-white">
                -{transferForm.amount || '0.00'} {transferForm.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#00D26A]">Credit Leg:</span>
              <span className="font-bold text-white">
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
          <form onSubmit={handleReverseTransfer} className="space-y-4 font-sans">
            <div className="p-4 rounded-xl bg-[#16181F] border border-white/[0.08] text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-white/50 font-mono">Transaction Reference:</span>
                <span className="font-mono font-bold text-white">{reversingTx.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 font-mono">Transfer Amount:</span>
                <span className="font-mono text-white">
                  {reversingTx.amount} {reversingTx.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 font-mono">Source &rarr; Dest:</span>
                <span className="font-mono text-[11px] text-white/80">
                  {reversingTx.source_account_code} &rarr; {reversingTx.destination_account_code}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Reason for Reversal *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Customer requested refund or error in original invoice"
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white focus:border-white focus:outline-none resize-none transition-colors"
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
          <div className="space-y-6 select-none font-sans">
            <div className="p-4 rounded-xl bg-[#16181F] border border-white/[0.08] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">TRANSACTION</span>
                <div className="text-base font-bold font-mono text-white">
                  {selectedTxDetail.reference}
                </div>
                <div className="text-xs text-white/50 mt-0.5 font-mono">
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
                <div className="text-base font-bold font-mono text-white mt-1 tabular-nums">
                  {selectedTxDetail.amount} {selectedTxDetail.currency}
                </div>
              </div>
            </div>

            {/* Entries Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Double-Entry Journal Legs ({selectedTxDetail.entries.length})
                </h4>
                <span className="text-[11px] font-mono text-[#00D26A] font-bold">
                  Balanced: {selectedTxDetail.total_debit} = {selectedTxDetail.total_credit}
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Seq</TableHead>
                    <TableHead className="whitespace-nowrap">Account Code</TableHead>
                    <TableHead className="whitespace-nowrap">Currency</TableHead>
                    <TableHead className="text-right text-[#FF453A] whitespace-nowrap">Debit</TableHead>
                    <TableHead className="text-right text-[#00D26A] whitespace-nowrap">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTxDetail.entries.map((entry: EntryView) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-white/50 whitespace-nowrap">{entry.seq}</TableCell>
                      <TableCell className="font-mono font-medium text-white whitespace-nowrap">{entry.account_code}</TableCell>
                      <TableCell className="font-mono text-xs text-white/70 whitespace-nowrap">{entry.currency}</TableCell>
                      <TableCell className="font-mono text-right tabular-nums text-[#FF453A] whitespace-nowrap">
                        {parseFloat(entry.debit) > 0 ? entry.debit : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-right tabular-nums text-[#00D26A] whitespace-nowrap">
                        {parseFloat(entry.credit) > 0 ? entry.credit : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Lifecycle Events */}
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">
                Lifecycle Audit Timeline
              </h4>
              <div className="space-y-2">
                {selectedTxDetail.lifecycle.map((lc: LifecycleEvent) => (
                  <div
                    key={lc.id}
                    className="p-3.5 rounded-xl bg-[#16181F] border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white uppercase font-mono mr-2">
                        [{lc.state}]
                      </span>
                      <span className="text-white/80">{lc.detail || 'Event registered'}</span>
                    </div>
                    <span className="font-mono text-[10px] text-white/40">
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
          <div className="py-8 text-center text-xs text-white/50 font-mono">Loading transaction details...</div>
        )}
      </Modal>
    </div>
  );
};
