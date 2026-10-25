// Ledgce Domain & API Types (mirrors backend crates/ledgce-application/src/model.rs)

export interface Page<T> {
  items: T[];
  next_cursor?: string | null;
  has_more: boolean;
}

export type AccountKind = 'customer' | 'system';
export type AccountStatus = 'active' | 'suspended' | 'closed';

export interface AccountView {
  id: string;
  code: string;
  name: string;
  kind: AccountKind | string;
  currency: string;
  status: AccountStatus | string;
  synthetic: boolean;
  balance: string; // Decimal serialized as exact string
  balance_version: number;
  created_at: string;
}

export interface AccountTotals {
  total_debits: string;
  total_credits: string;
  entry_count: number;
}

export interface AccountDetail extends AccountView {
  totals: AccountTotals;
  journal_balance: string;
  projection_matches_journal: boolean;
}

export type TransactionKind = 'transfer' | 'opening_balance' | 'reversal' | 'adjustment';
export type TransactionStatus = 'posted' | 'reversed' | 'failed' | 'pending';

export interface TransactionSummary {
  id: string;
  seq: number;
  reference: string;
  kind: TransactionKind | string;
  status: TransactionStatus | string;
  currency: string;
  amount: string;
  source_account_id: string;
  source_account_code: string;
  destination_account_id: string;
  destination_account_code: string;
  description?: string | null;
  reverses_transaction_id?: string | null;
  created_at: string;
  posted_at: string;
}

export interface EntryView {
  id: string;
  seq: number;
  transaction_id: string;
  transaction_reference: string;
  transaction_kind: string;
  transaction_status: string;
  account_id: string;
  account_code: string;
  account_name: string;
  currency: string;
  debit: string;
  credit: string;
  memo?: string | null;
  posted_at: string;
}

export interface LifecycleEvent {
  id: string;
  state: string;
  detail?: string | null;
  occurred_at: string;
}

export type OutboxStatus = 'pending' | 'processing' | 'published' | 'failed' | 'dead';

export interface OutboxView {
  id: string;
  seq: number;
  aggregate_id: string;
  event_type: string;
  status: OutboxStatus | string;
  attempts: number;
  available_at: string;
  locked_by?: string | null;
  last_error?: string | null;
  created_at: string;
  processed_at?: string | null;
  age_seconds: number;
}

export interface TransactionDetail extends TransactionSummary {
  published_at?: string | null;
  processed_at?: string | null;
  reversed_by_transaction_id?: string | null;
  idempotency_key?: string | null;
  entries: EntryView[];
  total_debit: string;
  total_credit: string;
  balanced: boolean;
  lifecycle: LifecycleEvent[];
  outbox_events: OutboxView[];
}

export interface TransferOutcome {
  transaction: TransactionDetail;
  replayed: boolean;
}

export interface CreateAccountRequest {
  code: string;
  name: string;
  kind?: AccountKind | string;
  currency: string;
  synthetic?: boolean;
}

export interface InitOpeningBalanceRequest {
  account_id: string;
  amount: string;
  reference?: string;
  idempotency_key?: string;
}

export interface PostTransferRequest {
  source_account_id: string;
  destination_account_id: string;
  amount: string;
  currency: string;
  reference?: string;
  description?: string;
  idempotency_key?: string;
}

export interface ReverseTransferRequest {
  transaction_id: string;
  reason?: string;
  idempotency_key?: string;
}

export interface ReconciliationViolation {
  violation_type: string;
  entity_type: string;
  entity_id?: string | null;
  message: string;
  details: Record<string, unknown>;
}

export interface ReconciliationRunSummary {
  id: string;
  seq: number;
  status: 'passed' | 'violations_found' | 'failed' | string;
  triggered_by: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  accounts_checked: number;
  transactions_checked: number;
  entries_checked: number;
  outbox_checked: number;
  violation_count: number;
}

export interface ReconciliationRunDetail {
  summary: ReconciliationRunSummary;
  violations: ReconciliationViolation[];
}

export interface CurrencyVolume {
  currency: string;
  total_posted_volume: string;
  transaction_count: number;
}

export interface OverviewStats {
  account_count: number;
  transaction_count: number;
  entry_count: number;
  outbox_pending_count: number;
  outbox_dead_count: number;
  volumes: CurrencyVolume[];
  last_reconciliation?: ReconciliationRunSummary | null;
  ledger_balanced: boolean;
}

export interface WorkerHeartbeatView {
  worker_id: string;
  started_at: string;
  last_seen_at: string;
  processed_count: number;
  failed_count: number;
  is_healthy: boolean;
}

export interface FaultInjectionView {
  point: string;
  remaining: number;
  armed_at: string;
}

export interface ArmFaultRequest {
  point: string;
  count: number;
}

export interface SystemHealthView {
  status: 'healthy' | 'degraded' | 'critical' | string;
  database_connected: boolean;
  ledger_invariants_pass: boolean;
  outbox_backlog: number;
  dead_letter_count: number;
  workers: WorkerHeartbeatView[];
  active_faults: FaultInjectionView[];
}

export interface AccountFilter {
  search?: string;
  kind?: string;
  currency?: string;
  status?: string;
  sort?: string;
  descending?: boolean;
  page?: number;
  page_size?: number;
}

export interface AccountPage {
  items: AccountView[];
  total: number;
  page: number;
  page_size: number;
}

export interface TransactionFilter {
  search?: string;
  status?: string;
  kind?: string;
  currency?: string;
  account_id?: string;
  cursor?: number;
  limit?: number;
}

export interface EntryFilter {
  search?: string;
  account_id?: string;
  transaction_id?: string;
  side?: 'debit' | 'credit' | string;
  currency?: string;
  cursor?: number;
  limit?: number;
}

export interface OutboxFilter {
  status?: string;
  cursor?: number;
  limit?: number;
}

export type ViewRoute = 
  | 'landing'
  | 'platform'
  | 'architecture'
  | 'security'
  | 'docs'
  | 'login'
  | 'overview'
  | 'accounts'
  | 'transfers'
  | 'transactions'
  | 'explorer'
  | 'reconciliation'
  | 'outbox'
  | 'system-health'
  | 'settings';
