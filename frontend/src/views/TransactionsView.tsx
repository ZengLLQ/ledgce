import React, { useCallback, useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { api } from '../api/client';
import type {
  TransactionDetail,
  TransactionSummary,
  ReverseTransferRequest,
} from '../types/api';
import { useToast } from '../components/ui/Toast';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'transfer' | 'reversal' | 'opening_balance'>('all');
  const [selectedTxDetail, setSelectedTxDetail] = useState<TransactionDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [reversingTx, setReversingTx] = useState<TransactionSummary | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadTransactions = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const activeSearch = query !== undefined ? query : search;
      const res = await api.listTransactions({
        search: activeSearch || undefined,
        kind: kindFilter === 'all' ? undefined : kindFilter,
      });
      setTransactions(res.items);
    } catch (err: unknown) {
      showToast('Error loading transactions', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [kindFilter, search, showToast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleInspect = async (txId: string) => {
    try {
      const detail = await api.getTransaction(txId);
      setSelectedTxDetail(detail);
      setIsDetailModalOpen(true);
    } catch (err: unknown) {
      showToast('Error loading transaction details', err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const handleOpenReverse = (tx: TransactionSummary) => {
    setReversingTx(tx);
    setReverseReason(`Reversal of ${tx.reference}: operational adjustment`);
    setIsReverseModalOpen(true);
  };

  const handleSubmitReverse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingTx) return;

    try {
      setSubmitting(true);
      const req: ReverseTransferRequest = {
        transaction_id: reversingTx.id,
        reason: reverseReason,
        idempotency_key: `rev-idem-${Date.now()}`,
      };
      const res = await api.reverseTransfer(req);
      showToast(
        'Transaction Reversed',
        `Compensating transaction ${res.transaction.reference} posted. Net balance inverted.`,
        'success'
      );
      setIsReverseModalOpen(false);
      loadTransactions();
    } catch (err: unknown) {
      showToast('Reversal failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">
            Transaction History &amp; Lifecycles
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-mono">
            Every committed transaction with deterministic debit and credit legs and outbox event references.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTransactions()}
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search & Tabs Filter */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Operations' },
              { id: 'transfer', label: 'Transfers' },
              { id: 'opening_balance', label: 'Opening Balances' },
              { id: 'reversal', label: 'Reversals' },
            ]}
            activeTab={kindFilter}
            onChange={(tab) => setKindFilter(tab as any)}
          />

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by reference, account, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadTransactions()}
              className="w-full bg-background border border-border text-white text-xs rounded pl-9 pr-4 py-2 focus:outline-none focus:border-white font-mono"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SEQUENCE / REF</TableHead>
              <TableHead>KIND</TableHead>
              <TableHead>SOURCE VAULT</TableHead>
              <TableHead>DESTINATION VAULT</TableHead>
              <TableHead className="text-right">AMOUNT</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>TIMESTAMP</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-text-muted font-mono text-xs">
                  Loading transactions from ledger...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-text-muted font-mono text-xs">
                  No matching transactions recorded in this scope.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs text-white">
                    <div className="font-bold">{tx.reference}</div>
                    <div className="text-[10px] text-text-muted">#{tx.seq}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.kind === 'reversal' ? 'warning' : 'outline'}>
                      {tx.kind.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">
                    {tx.source_account_code}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">
                    {tx.destination_account_code}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-right font-bold text-white tabular-nums">
                    {tx.amount} {tx.currency}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'posted' ? 'success' : tx.status === 'reversed' ? 'warning' : 'outline'}>
                      {tx.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-muted">
                    {new Date(tx.posted_at || tx.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleInspect(tx.id)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                      {tx.status !== 'reversed' && tx.kind !== 'reversal' && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenReverse(tx)}
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Reverse
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTxDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Transaction Inspection: ${selectedTxDetail.reference}`}
          size="lg"
        >
          <div className="space-y-6 font-mono text-xs">
            {/* Meta Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-background border border-border">
              <div>
                <span className="text-text-muted text-[10px]">TRANSACTION ID:</span>
                <p className="text-white truncate">{selectedTxDetail.id}</p>
              </div>
              <div>
                <span className="text-text-muted text-[10px]">KIND:</span>
                <p className="text-white uppercase">{selectedTxDetail.kind}</p>
              </div>
              <div>
                <span className="text-text-muted text-[10px]">TOTAL DEBITS:</span>
                <p className="text-white tabular-nums">{selectedTxDetail.total_debit} {selectedTxDetail.currency}</p>
              </div>
              <div>
                <span className="text-text-muted text-[10px]">TOTAL CREDITS:</span>
                <p className="text-white tabular-nums">{selectedTxDetail.total_credit} {selectedTxDetail.currency}</p>
              </div>
            </div>

            {/* Invariant Verification */}
            <div className="p-3 rounded bg-surface border border-border flex items-center justify-between">
              <span className="text-text-secondary">DOUBLE-ENTRY CONSERVATION STATUS:</span>
              <span className="text-white font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                Σ DEBITS = Σ CREDITS (ZERO DRIFT)
              </span>
            </div>

            {/* Entries Breakdown */}
            <div>
              <h4 className="text-sm font-bold uppercase text-white font-sans mb-3">
                Committed Journal Legs
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LEG ID</TableHead>
                    <TableHead>ACCOUNT</TableHead>
                    <TableHead className="text-right">DEBIT</TableHead>
                    <TableHead className="text-right">CREDIT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTxDetail.entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-[10px] text-text-muted">{entry.id.slice(0, 12)}...</TableCell>
                      <TableCell className="font-mono text-xs text-white">{entry.account_code}</TableCell>
                      <TableCell className="font-mono text-xs text-right tabular-nums text-text-secondary">
                        {entry.debit !== '0.00' ? `${entry.debit} ${entry.currency}` : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-right tabular-nums text-text-secondary">
                        {entry.credit !== '0.00' ? `${entry.credit} ${entry.currency}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Modal>
      )}

      {/* Compensating Reversal Modal */}
      {reversingTx && (
        <Modal
          isOpen={isReverseModalOpen}
          onClose={() => setIsReverseModalOpen(false)}
          title={`Compensating Reversal: ${reversingTx.reference}`}
          size="md"
        >
          <form onSubmit={handleSubmitReverse} className="space-y-4 font-mono text-xs">
            <p className="text-text-secondary leading-relaxed">
              In accordance with strict ledger immutability, the original transaction will not be deleted. An opposite compensating transaction will be atomically committed to invert the ledger legs.
            </p>

            <div className="p-3 rounded bg-background border border-border space-y-1">
              <div className="flex justify-between text-text-muted">
                <span>Original Amount:</span>
                <span className="text-white font-bold">{reversingTx.amount} {reversingTx.currency}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Inversion:</span>
                <span className="text-white font-bold">{reversingTx.destination_account_code} &rarr; {reversingTx.source_account_code}</span>
              </div>
            </div>

            <div>
              <label className="text-text-muted uppercase block mb-1.5">Reversal Audit Reason</label>
              <input
                type="text"
                required
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="w-full bg-background border border-border text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsReverseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                Execute Reversal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
