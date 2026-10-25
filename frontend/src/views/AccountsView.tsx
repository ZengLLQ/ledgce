import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Coins,
  Wallet,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { api } from '../api/client';
import type { AccountDetail, AccountView, CreateAccountRequest, InitOpeningBalanceRequest } from '../types/api';
import { useToast } from '../components/ui/Toast';

interface AccountsViewProps {
  onInitiateTransferFrom?: (accountId: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ onInitiateTransferFrom }) => {
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'system'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOpeningBalanceOpen, setIsOpeningBalanceOpen] = useState(false);
  const [, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<AccountDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState<CreateAccountRequest>({
    code: '',
    name: '',
    kind: 'customer',
    currency: 'USD',
    synthetic: true,
  });

  const [openingBalanceForm, setOpeningBalanceForm] = useState<InitOpeningBalanceRequest>({
    account_id: '',
    amount: '',
    reference: '',
    idempotency_key: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadAccounts = async (query?: string) => {
    try {
      setLoading(true);
      const activeSearch = query !== undefined ? query : search;
      const res = await api.listAccounts({
        search: activeSearch || undefined,
        kind: activeTab === 'all' ? undefined : activeTab,
        currency: currencyFilter === 'all' ? undefined : currencyFilter,
      });
      setAccounts(res.items);
    } catch (err: unknown) {
      showToast('Error loading accounts', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [activeTab, currencyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAccounts();
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await api.createAccount(createForm);
      showToast(
        'Account Created',
        `Account ${created.code} (${created.currency}) successfully initialized with zero book balance.`,
        'success'
      );
      setIsCreateOpen(false);
      setCreateForm({
        code: '',
        name: '',
        kind: 'customer',
        currency: 'USD',
        synthetic: true,
      });
      loadAccounts();
    } catch (err: unknown) {
      showToast('Account creation failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpeningBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const outcome = await api.initOpeningBalance({
        ...openingBalanceForm,
        idempotency_key: openingBalanceForm.idempotency_key || `open-${Date.now()}`,
      });
      showToast(
        'Opening Balance Committed',
        `Successfully credited ${outcome.transaction.amount} ${outcome.transaction.currency} with reference ${outcome.transaction.reference}.`,
        'success'
      );
      setIsOpeningBalanceOpen(false);
      setOpeningBalanceForm({
        account_id: '',
        amount: '',
        reference: '',
        idempotency_key: '',
      });
      loadAccounts();
    } catch (err: unknown) {
      showToast('Opening balance failed', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openAccountDetails = async (id: string) => {
    try {
      setSelectedAccountId(id);
      const detail = await api.getAccount(id);
      setSelectedAccountDetail(detail);
      setIsDetailOpen(true);
    } catch (err: unknown) {
      showToast('Error loading account detail', err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const openOpeningBalanceFor = (acc: AccountView) => {
    setOpeningBalanceForm({
      account_id: acc.id,
      amount: '',
      reference: `OPEN-${acc.code}-${Date.now().toString().slice(-4)}`,
      idempotency_key: `key-open-${Date.now()}`,
    });
    setIsOpeningBalanceOpen(true);
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Toolbar with Title and Primary Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-white" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">
              Accounts & Vaults
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1 font-light">
            Real-time balance projection cache kept strictly invariant-synchronized with ledger journals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            size="md"
            variant="outline"
            onClick={() => setIsOpeningBalanceOpen(true)}
            icon={<Coins className="w-4 h-4 text-[#FFAA00]" />}
          >
            Opening Balance
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </div>
      </motion.div>

      {/* 2. Structured Filter and Search Bar to eliminate collisions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="p-3 bg-[#0D0F14] border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Accounts' },
              { id: 'customer', label: 'Customer' },
              { id: 'system', label: 'System Clearing' },
            ]}
            activeTab={activeTab}
            onChange={(id: string) => setActiveTab(id as 'all' | 'customer' | 'system')}
          />

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg font-mono uppercase bg-[#16181F] border border-white/15 text-white focus:outline-none focus:border-white transition-all shrink-0"
          >
            <option value="all">ALL CURRENCIES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="IDR">IDR</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="SEARCH CODE / NAME..."
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              if (val === '') {
                loadAccounts('');
              }
            }}
            className="w-full h-9 pl-9 pr-8 text-base sm:text-xs rounded-lg bg-[#16181F] border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-all font-mono uppercase"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadAccounts('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </motion.div>

      {/* 3. Accounts List Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Accounts & Balances</CardTitle>
              <CardDescription>
                Real-time projection table kept strictly consistent with double-entry journal entries
              </CardDescription>
            </div>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => loadAccounts()}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Code</TableHead>
                <TableHead className="whitespace-nowrap">Account Name</TableHead>
                <TableHead className="whitespace-nowrap">Kind</TableHead>
                <TableHead className="whitespace-nowrap">Currency</TableHead>
                <TableHead className="text-right whitespace-nowrap">Book Balance</TableHead>
                <TableHead className="whitespace-nowrap">Version</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length > 0 ? (
                accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-mono font-bold text-white whitespace-nowrap">
                      {acc.code}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <div className="text-white font-medium">{acc.name}</div>
                      <div className="text-[10px] text-white/40 font-mono">ID: {acc.id.slice(0, 13)}...</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={acc.kind === 'customer' ? 'info' : 'neutral'} size="sm">
                        {acc.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-white/80 whitespace-nowrap">{acc.currency}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-white tabular-nums whitespace-nowrap">
                      {parseFloat(acc.balance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-[10px] text-white/40 font-mono font-normal">
                        {acc.currency}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white/50 whitespace-nowrap">
                      v{acc.balance_version}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={acc.status === 'active' ? 'positive' : 'warning'} size="sm" dot>
                        {acc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => openAccountDetails(acc.id)}
                          title="View Invariant Verification"
                          icon={<Eye className="w-3.5 h-3.5" />}
                        />
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => openOpeningBalanceFor(acc)}
                          title="Init Opening Balance"
                          icon={<Coins className="w-3.5 h-3.5 text-[#FFAA00]" />}
                        />
                        {onInitiateTransferFrom && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => onInitiateTransferFrom(acc.id)}
                            icon={<ArrowRight className="w-3 h-3" />}
                          >
                            Transfer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-white/50 font-mono">
                    No accounts found matching filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Create Account Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Account"
        description="Initialize a customer or system clearing account with atomic projection triggers."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Account Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CUST-TREASURY-01"
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
            />
            <p className="text-[10px] text-white/40 font-mono mt-1">Unique alphanumeric identifier code.</p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Account Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Treasury Escrow"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white focus:border-white focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Account Kind
              </label>
              <select
                value={createForm.kind}
                onChange={(e) => setCreateForm({ ...createForm, kind: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white focus:border-white focus:outline-none transition-colors"
              >
                <option value="customer">Customer (Non-negative bound)</option>
                <option value="system">System (Clearing Reserve)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={createForm.currency}
                onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="IDR">IDR (Indonesian Rupiah)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="synthetic-check"
              checked={createForm.synthetic}
              onChange={(e) => setCreateForm({ ...createForm, synthetic: e.target.checked })}
              className="rounded bg-[#16181F] border-white/20 text-white focus:ring-white"
            />
            <label htmlFor="synthetic-check" className="text-xs text-white/70 select-none">
              Synthetic internal ledger account
            </label>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Opening Balance Modal */}
      <Modal
        isOpen={isOpeningBalanceOpen}
        onClose={() => setIsOpeningBalanceOpen(false)}
        title="Initialize Opening Balance"
        description="Creates an initial double-entry posting from system clearing reserve to target account."
      >
        <form onSubmit={handleOpeningBalance} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Target Account *
            </label>
            <select
              required
              value={openingBalanceForm.account_id}
              onChange={(e) =>
                setOpeningBalanceForm({ ...openingBalanceForm, account_id: e.target.value })
              }
              className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white focus:border-white focus:outline-none font-mono transition-colors"
            >
              <option value="">Select target account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name} ({a.currency}) [Balance: {a.balance}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Credit Amount *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="100000.00"
              value={openingBalanceForm.amount}
              onChange={(e) =>
                setOpeningBalanceForm({ ...openingBalanceForm, amount: e.target.value })
              }
              className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Audit Reference
            </label>
            <input
              type="text"
              placeholder="e.g. SEED-CAPITAL-TRANCHE-1"
              value={openingBalanceForm.reference || ''}
              onChange={(e) =>
                setOpeningBalanceForm({ ...openingBalanceForm, reference: e.target.value })
              }
              className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Idempotency Key
            </label>
            <input
              type="text"
              placeholder="Auto-generated or custom key"
              value={openingBalanceForm.idempotency_key || ''}
              onChange={(e) =>
                setOpeningBalanceForm({ ...openingBalanceForm, idempotency_key: e.target.value })
              }
              className="w-full h-10 px-3.5 rounded-lg bg-[#16181F] border border-white/15 text-base sm:text-xs text-white font-mono focus:border-white focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsOpeningBalanceOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Commit Opening Balance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Account Detail & Invariant Verification Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Account Detail & Invariant Audit"
        description="Live verification comparing projection snapshot against real-time journal entry sum."
        size="lg"
      >
        {selectedAccountDetail ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-[#16181F] border border-white/[0.08] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">ACCOUNT CODE</span>
                <div className="text-lg font-bold font-mono text-white">
                  {selectedAccountDetail.code}
                </div>
                <div className="text-xs text-white/60 mt-0.5">{selectedAccountDetail.name}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">BOOK BALANCE</span>
                <div className="text-xl font-bold font-mono text-[#00D26A] tabular-nums">
                  {selectedAccountDetail.balance} {selectedAccountDetail.currency}
                </div>
                <div className="text-[10px] font-mono text-white/40">
                  Version {selectedAccountDetail.balance_version}
                </div>
              </div>
            </div>

            {/* Invariant verification badge */}
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                selectedAccountDetail.projection_matches_journal
                  ? 'bg-[#00D26A]/10 border-[#00D26A]/30 text-[#00D26A]'
                  : 'bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]'
              }`}
            >
              {selectedAccountDetail.projection_matches_journal ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-mono font-bold block">
                  {selectedAccountDetail.projection_matches_journal
                    ? 'Projection Matches Journal Entries Exactly'
                    : 'Discrepancy Detected between Projection and Journal Entries'}
                </span>
                <span className="text-[11px] opacity-80 font-mono">
                  Calculated from Σ(credits) - Σ(debits) = {selectedAccountDetail.journal_balance}{' '}
                  {selectedAccountDetail.currency}.
                </span>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#16181F] border border-white/[0.06]">
                <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider">Total Debits</span>
                <div className="text-sm font-bold font-mono text-[#FF453A] mt-1 tabular-nums">
                  {selectedAccountDetail.totals.total_debits}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#16181F] border border-white/[0.06]">
                <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider">Total Credits</span>
                <div className="text-sm font-bold font-mono text-[#00D26A] mt-1 tabular-nums">
                  {selectedAccountDetail.totals.total_credits}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#16181F] border border-white/[0.06]">
                <span className="text-[10px] text-white/50 uppercase font-mono tracking-wider">Total Entries</span>
                <div className="text-sm font-bold font-mono text-white mt-1 tabular-nums">
                  {selectedAccountDetail.totals.entry_count}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-white/50 font-mono">Loading details...</div>
        )}
      </Modal>
    </div>
  );
};
