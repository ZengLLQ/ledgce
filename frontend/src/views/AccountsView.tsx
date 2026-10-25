import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Coins,
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

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.listAccounts({
        search: search || undefined,
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
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
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
            className="h-9 px-3 text-xs rounded-md bg-[#171C2C] border border-white/10 text-[#F4F6FC] focus:outline-none focus:border-[#526CFF]"
          >
            <option value="all">All Currencies</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[#9BA5BC] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs rounded-md bg-[#171C2C] border border-white/10 text-[#F4F6FC] placeholder:text-[#5D6882] focus:outline-none focus:border-[#526CFF] w-48 sm:w-64"
            />
          </form>

          <Button
            size="md"
            variant="outline"
            onClick={() => setIsOpeningBalanceOpen(true)}
            icon={<Coins className="w-4 h-4 text-[#F2B85C]" />}
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
      </div>

      {/* Accounts List Table */}
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
            onClick={loadAccounts}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Book Balance</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length > 0 ? (
              accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-mono font-semibold text-[#F4F6FC]">
                    {acc.code}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{acc.name}</div>
                    <div className="text-[10px] text-[#9BA5BC]">ID: {acc.id.slice(0, 13)}...</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={acc.kind === 'customer' ? 'info' : 'neutral'} size="sm">
                      {acc.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{acc.currency}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm text-[#F4F6FC] tabular-nums">
                    {parseFloat(acc.balance).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-[10px] text-[#9BA5BC] font-sans font-normal">
                      {acc.currency}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#9BA5BC]">
                    v{acc.balance_version}
                  </TableCell>
                  <TableCell>
                    <Badge variant={acc.status === 'active' ? 'positive' : 'warning'} size="sm" dot>
                      {acc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openAccountDetails(acc.id)}
                        title="View Audit Invariant"
                        icon={<Eye className="w-3 h-3" />}
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openOpeningBalanceFor(acc)}
                        title="Init Opening Balance"
                        icon={<Coins className="w-3 h-3 text-[#F2B85C]" />}
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
                <TableCell colSpan={8} className="text-center py-12 text-[#9BA5BC]">
                  No accounts found matching filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Account Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Account"
        description="Initialize a customer or system clearing account with atomic projection triggers."
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
              Account Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CUST-TREASURY-01"
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] font-mono focus:border-[#526CFF] focus:outline-none"
            />
            <p className="text-[10px] text-[#9BA5BC] mt-1">Unique alphanumeric identifier code.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Treasury Escrow"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] focus:border-[#526CFF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
                Account Kind
              </label>
              <select
                value={createForm.kind}
                onChange={(e) => setCreateForm({ ...createForm, kind: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] focus:border-[#526CFF] focus:outline-none"
              >
                <option value="customer">Customer (Non-negative bound)</option>
                <option value="system">System (Clearing / Reservoir)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
                Currency
              </label>
              <select
                value={createForm.currency}
                onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] font-mono focus:border-[#526CFF] focus:outline-none"
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="synthetic-check"
              checked={createForm.synthetic}
              onChange={(e) => setCreateForm({ ...createForm, synthetic: e.target.checked })}
              className="rounded bg-[#171C2C] border-white/10 text-[#526CFF] focus:ring-[#526CFF]"
            />
            <label htmlFor="synthetic-check" className="text-xs text-[#9BA5BC] select-none">
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
        <form onSubmit={handleOpeningBalance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
              Target Account *
            </label>
            <select
              required
              value={openingBalanceForm.account_id}
              onChange={(e) =>
                setOpeningBalanceForm({ ...openingBalanceForm, account_id: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] focus:border-[#526CFF] focus:outline-none font-mono"
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
            <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
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
              className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] font-mono focus:border-[#526CFF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
              Audit Reference
            </label>
            <input
              type="text"
              placeholder="e.g. SEED-CAPITAL-TRANCHE-1"
              value={openingBalanceForm.reference || ''}
              onChange={(e) =>
                setOpeningBalanceForm({ ...openingBalanceForm, reference: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] font-mono focus:border-[#526CFF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9BA5BC] uppercase tracking-wider mb-1">
              Idempotency Key
            </label>
            <input
              type="text"
              placeholder="Auto-generated or custom key"
              value={openingBalanceForm.idempotency_key || ''}
              onChange={(e) =>
                setOpeningBalanceForm({ ...openingBalanceForm, idempotency_key: e.target.value })
              }
              className="w-full h-10 px-3 rounded-md bg-[#171C2C] border border-white/10 text-xs text-[#F4F6FC] font-mono focus:border-[#526CFF] focus:outline-none"
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
            <div className="p-4 rounded-lg bg-[#171C2C] border border-white/[0.08] flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#9BA5BC] uppercase">ACCOUNT CODE</span>
                <div className="text-lg font-bold font-mono text-[#F4F6FC]">
                  {selectedAccountDetail.code}
                </div>
                <div className="text-xs text-[#9BA5BC]">{selectedAccountDetail.name}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#9BA5BC] uppercase">BOOK BALANCE</span>
                <div className="text-xl font-bold font-mono text-[#35D6A0] tabular-nums">
                  {selectedAccountDetail.balance} {selectedAccountDetail.currency}
                </div>
                <div className="text-[10px] font-mono text-[#9BA5BC]">
                  Version {selectedAccountDetail.balance_version}
                </div>
              </div>
            </div>

            {/* Invariant verification badge */}
            <div
              className={`p-4 rounded-lg border flex items-center gap-3 ${
                selectedAccountDetail.projection_matches_journal
                  ? 'bg-[#35D6A0]/10 border-[#35D6A0]/30 text-[#35D6A0]'
                  : 'bg-[#FF6B78]/10 border-[#FF6B78]/30 text-[#FF6B78]'
              }`}
            >
              {selectedAccountDetail.projection_matches_journal ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <div className="text-xs">
                <span className="font-semibold block">
                  {selectedAccountDetail.projection_matches_journal
                    ? 'Projection Matches Journal Entries Exactly'
                    : 'Discrepancy Detected between Projection and Journal Entries'}
                </span>
                <span className="text-[11px] opacity-80">
                  Calculated from Σ(credits) - Σ(debits) = {selectedAccountDetail.journal_balance}{' '}
                  {selectedAccountDetail.currency}.
                </span>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded bg-[#171C2C] border border-white/[0.06]">
                <span className="text-[10px] text-[#9BA5BC] uppercase font-mono">Total Debits</span>
                <div className="text-sm font-bold font-mono text-[#FF6B78] mt-1 tabular-nums">
                  {selectedAccountDetail.totals.total_debits}
                </div>
              </div>

              <div className="p-3 rounded bg-[#171C2C] border border-white/[0.06]">
                <span className="text-[10px] text-[#9BA5BC] uppercase font-mono">Total Credits</span>
                <div className="text-sm font-bold font-mono text-[#35D6A0] mt-1 tabular-nums">
                  {selectedAccountDetail.totals.total_credits}
                </div>
              </div>

              <div className="p-3 rounded bg-[#171C2C] border border-white/[0.06]">
                <span className="text-[10px] text-[#9BA5BC] uppercase font-mono">Total Entries</span>
                <div className="text-sm font-bold font-mono text-[#F4F6FC] mt-1 tabular-nums">
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
          <div className="py-8 text-center text-xs text-[#9BA5BC]">Loading details...</div>
        )}
      </Modal>
    </div>
  );
};
