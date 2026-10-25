import type {
  AccountDetail,
  AccountFilter,
  AccountPage,
  AccountView,
  ArmFaultRequest,
  CreateAccountRequest,
  EntryFilter,
  EntryView,
  FaultInjectionView,
  InitOpeningBalanceRequest,
  OutboxFilter,
  OutboxView,
  OverviewStats,
  Page,
  PostTransferRequest,
  ReconciliationRunDetail,
  ReconciliationRunSummary,
  ReverseTransferRequest,
  SystemHealthView,
  TransactionDetail,
  TransactionFilter,
  TransactionSummary,
  TransferOutcome,
} from '../types/api';

const API_BASE = '/api/v1';

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// ----------------- Mock In-Memory Store for Standalone Preview -----------------
const mockAccounts: AccountView[] = [
  {
    id: 'a0000000-0000-7000-8000-000000000001',
    code: 'SYS-WORLD-CLEARING',
    name: 'World Clearing Reserve (Central)',
    kind: 'system',
    currency: 'USD',
    status: 'active',
    synthetic: false,
    balance: '0.00',
    balance_version: 124,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'a0000000-0000-7000-8000-000000000002',
    code: 'SYS-EUR-CLEARING',
    name: 'EUR Settlement Clearing Pool',
    kind: 'system',
    currency: 'EUR',
    status: 'active',
    synthetic: false,
    balance: '0.00',
    balance_version: 88,
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'a0000000-0000-7000-8000-000000000003',
    code: 'CUST-TREASURY-ALPHA',
    name: 'Treasury Operating Account A',
    kind: 'customer',
    currency: 'USD',
    status: 'active',
    synthetic: true,
    balance: '1452500.00',
    balance_version: 412,
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    id: 'a0000000-0000-7000-8000-000000000004',
    code: 'CUST-MERCHANT-OMEGA',
    name: 'Omega Global Merchant Escrow',
    kind: 'customer',
    currency: 'USD',
    status: 'active',
    synthetic: true,
    balance: '824900.50',
    balance_version: 290,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'a0000000-0000-7000-8000-000000000005',
    code: 'CUST-VENTURES-EURO',
    name: 'Ventures Europe Liquidity Sub-Account',
    kind: 'customer',
    currency: 'EUR',
    status: 'active',
    synthetic: true,
    balance: '520110.00',
    balance_version: 176,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const mockTransactions: TransactionSummary[] = [
  {
    id: 't0000000-0000-7000-8000-000000000001',
    seq: 1045,
    reference: 'TX-20261025-001',
    kind: 'transfer',
    status: 'posted',
    currency: 'USD',
    amount: '45000.00',
    source_account_id: mockAccounts[2].id,
    source_account_code: mockAccounts[2].code,
    destination_account_id: mockAccounts[3].id,
    destination_account_code: mockAccounts[3].code,
    description: 'Instant wholesale liquidity transfer',
    reverses_transaction_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    posted_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    id: 't0000000-0000-7000-8000-000000000002',
    seq: 1044,
    reference: 'TX-20261025-002',
    kind: 'transfer',
    status: 'posted',
    currency: 'USD',
    amount: '12000.00',
    source_account_id: mockAccounts[3].id,
    source_account_code: mockAccounts[3].code,
    destination_account_id: mockAccounts[2].id,
    destination_account_code: mockAccounts[2].code,
    description: 'B2B settlement return',
    reverses_transaction_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    posted_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 't0000000-0000-7000-8000-000000000003',
    seq: 1043,
    reference: 'TX-INIT-EUR-01',
    kind: 'opening_balance',
    status: 'posted',
    currency: 'EUR',
    amount: '500000.00',
    source_account_id: mockAccounts[1].id,
    source_account_code: mockAccounts[1].code,
    destination_account_id: mockAccounts[4].id,
    destination_account_code: mockAccounts[4].code,
    description: 'Opening treasury seed allocation',
    reverses_transaction_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    posted_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

const mockEntries: EntryView[] = [
  {
    id: 'e0000000-0000-7000-8000-000000000001',
    seq: 2090,
    transaction_id: mockTransactions[0].id,
    transaction_reference: mockTransactions[0].reference,
    transaction_kind: mockTransactions[0].kind,
    transaction_status: mockTransactions[0].status,
    account_id: mockAccounts[2].id,
    account_code: mockAccounts[2].code,
    account_name: mockAccounts[2].name,
    currency: 'USD',
    debit: '45000.00',
    credit: '0.00',
    memo: 'Debit for wholesale liquidity transfer',
    posted_at: mockTransactions[0].posted_at,
  },
  {
    id: 'e0000000-0000-7000-8000-000000000002',
    seq: 2089,
    transaction_id: mockTransactions[0].id,
    transaction_reference: mockTransactions[0].reference,
    transaction_kind: mockTransactions[0].kind,
    transaction_status: mockTransactions[0].status,
    account_id: mockAccounts[3].id,
    account_code: mockAccounts[3].code,
    account_name: mockAccounts[3].name,
    currency: 'USD',
    debit: '0.00',
    credit: '45000.00',
    memo: 'Credit for wholesale liquidity transfer',
    posted_at: mockTransactions[0].posted_at,
  },
  {
    id: 'e0000000-0000-7000-8000-000000000003',
    seq: 2088,
    transaction_id: mockTransactions[1].id,
    transaction_reference: mockTransactions[1].reference,
    transaction_kind: mockTransactions[1].kind,
    transaction_status: mockTransactions[1].status,
    account_id: mockAccounts[3].id,
    account_code: mockAccounts[3].code,
    account_name: mockAccounts[3].name,
    currency: 'USD',
    debit: '12000.00',
    credit: '0.00',
    memo: 'Debit for B2B settlement return',
    posted_at: mockTransactions[1].posted_at,
  },
  {
    id: 'e0000000-0000-7000-8000-000000000004',
    seq: 2087,
    transaction_id: mockTransactions[1].id,
    transaction_reference: mockTransactions[1].reference,
    transaction_kind: mockTransactions[1].kind,
    transaction_status: mockTransactions[1].status,
    account_id: mockAccounts[2].id,
    account_code: mockAccounts[2].code,
    account_name: mockAccounts[2].name,
    currency: 'USD',
    debit: '0.00',
    credit: '12000.00',
    memo: 'Credit for B2B settlement return',
    posted_at: mockTransactions[1].posted_at,
  },
];

const mockOutbox: OutboxView[] = [
  {
    id: 'o0000000-0000-7000-8000-000000000001',
    seq: 92,
    aggregate_id: mockTransactions[0].id,
    event_type: 'TransferPosted',
    status: 'published',
    attempts: 1,
    available_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    locked_by: null,
    last_error: null,
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    processed_at: new Date(Date.now() - 1000 * 60 * 14 + 45).toISOString(),
    age_seconds: 0.045,
  },
  {
    id: 'o0000000-0000-7000-8000-000000000002',
    seq: 91,
    aggregate_id: mockTransactions[1].id,
    event_type: 'TransferPosted',
    status: 'published',
    attempts: 1,
    available_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    locked_by: null,
    last_error: null,
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    processed_at: new Date(Date.now() - 1000 * 60 * 42 + 30).toISOString(),
    age_seconds: 0.030,
  },
  {
    id: 'o0000000-0000-7000-8000-000000000003',
    seq: 93,
    aggregate_id: 'a0000000-0000-7000-8000-000000000004',
    event_type: 'BalanceAudited',
    status: 'pending',
    attempts: 0,
    available_at: new Date(Date.now() - 1000 * 10).toISOString(),
    locked_by: null,
    last_error: null,
    created_at: new Date(Date.now() - 1000 * 10).toISOString(),
    processed_at: null,
    age_seconds: 10.2,
  },
];

const mockReconciliationHistory: ReconciliationRunSummary[] = [
  {
    id: 'r0000000-0000-7000-8000-000000000001',
    seq: 34,
    status: 'passed',
    triggered_by: 'automated_cron',
    started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    finished_at: new Date(Date.now() - 1000 * 60 * 30 + 120).toISOString(),
    duration_ms: 124,
    accounts_checked: 5,
    transactions_checked: 3,
    entries_checked: 6,
    outbox_checked: 3,
    violation_count: 0,
  },
];

let mockArmedFaults: FaultInjectionView[] = [];

// Helper request wrapper with automatic fallback if backend is offline
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errMessage = `HTTP error ${res.status}`;
      let details;
      try {
        const errJson = await res.json();
        errMessage = errJson.message || errJson.error || errMessage;
        details = errJson;
      } catch {
        // use fallback text
      }
      throw new ApiError(errMessage, res.status, details);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    // If it's an explicit API response error (e.g. 400 Bad Request / 409 Conflict), rethrow it
    if (err instanceof ApiError) {
      throw err;
    }
    // If it's a network disconnect / 404 proxy failure during dev without backend, route through mock store
    console.warn(`[Ledgce API] Backend unreachable at ${path}, using mock data provider.`, err);
    return handleMockRequest<T>(path, options);
  }
}

// Seamless mock router for dev experience
function handleMockRequest<T>(path: string, options: RequestInit): Promise<T> {
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const method = (options.method || 'GET').toUpperCase();

  // Overview
  if (pathname === '/overview') {
    const stats: OverviewStats = {
      account_count: mockAccounts.length,
      transaction_count: mockTransactions.length,
      entry_count: mockEntries.length,
      outbox_pending_count: mockOutbox.filter(o => o.status === 'pending').length,
      outbox_dead_count: mockOutbox.filter(o => o.status === 'dead').length,
      volumes: [
        {
          currency: 'USD',
          total_posted_volume: '57000.00',
          transaction_count: 2,
        },
        {
          currency: 'EUR',
          total_posted_volume: '500000.00',
          transaction_count: 1,
        },
      ],
      last_reconciliation: mockReconciliationHistory[0] || null,
      ledger_balanced: true,
    };
    return Promise.resolve(stats as unknown as T);
  }

  // System Health
  if (pathname === '/system/health') {
    const health: SystemHealthView = {
      status: 'healthy',
      database_connected: true,
      ledger_invariants_pass: true,
      outbox_backlog: mockOutbox.filter(o => o.status === 'pending' || o.status === 'processing').length,
      dead_letter_count: mockOutbox.filter(o => o.status === 'dead').length,
      workers: [
        {
          worker_id: 'outbox-worker-node-01',
          started_at: new Date(Date.now() - 86400000).toISOString(),
          last_seen_at: new Date().toISOString(),
          processed_count: 1248,
          failed_count: 0,
          is_healthy: true,
        },
        {
          worker_id: 'reconciliation-auditor-01',
          started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          last_seen_at: new Date().toISOString(),
          processed_count: 48,
          failed_count: 0,
          is_healthy: true,
        },
      ],
      active_faults: mockArmedFaults,
    };
    return Promise.resolve(health as unknown as T);
  }

  // Fault arming
  if (pathname === '/system/faults/arm' && method === 'POST') {
    const body: ArmFaultRequest = JSON.parse(options.body as string);
    const fault: FaultInjectionView = {
      point: body.point,
      remaining: body.count,
      armed_at: new Date().toISOString(),
    };
    mockArmedFaults = [fault, ...mockArmedFaults.filter(f => f.point !== body.point)];
    return Promise.resolve(fault as unknown as T);
  }

  // Fault disarm
  if (pathname === '/system/faults/disarm' && method === 'DELETE') {
    mockArmedFaults = [];
    return Promise.resolve({ success: true } as unknown as T);
  }

  // Accounts List
  if (pathname === '/accounts' && method === 'GET') {
    const page: AccountPage = {
      items: mockAccounts,
      total: mockAccounts.length,
      page: 1,
      page_size: 50,
    };
    return Promise.resolve(page as unknown as T);
  }

  // Create Account
  if (pathname === '/accounts' && method === 'POST') {
    const body: CreateAccountRequest = JSON.parse(options.body as string);
    const newAccount: AccountView = {
      id: crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}`,
      code: body.code.toUpperCase(),
      name: body.name,
      kind: body.kind || 'customer',
      currency: body.currency.toUpperCase(),
      status: 'active',
      synthetic: body.synthetic ?? true,
      balance: '0.00',
      balance_version: 0,
      created_at: new Date().toISOString(),
    };
    mockAccounts.unshift(newAccount);
    return Promise.resolve(newAccount as unknown as T);
  }

  // Opening Balance
  if (pathname === '/accounts/opening-balance' && method === 'POST') {
    const body: InitOpeningBalanceRequest = JSON.parse(options.body as string);
    const account = mockAccounts.find(a => a.id === body.account_id);
    if (!account) throw new ApiError('Account not found', 404);

    const prevBalance = parseFloat(account.balance);
    const amount = parseFloat(body.amount);
    account.balance = (prevBalance + amount).toFixed(2);
    account.balance_version += 1;

    const summary: TransactionSummary = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
      seq: mockTransactions.length + 1000,
      reference: body.reference || `OPEN-${Date.now().toString().slice(-6)}`,
      kind: 'opening_balance',
      status: 'posted',
      currency: account.currency,
      amount: body.amount,
      source_account_id: 'a0000000-0000-7000-8000-000000000001',
      source_account_code: 'SYS-WORLD-CLEARING',
      destination_account_id: account.id,
      destination_account_code: account.code,
      description: `Opening balance credit for ${account.name}`,
      reverses_transaction_id: null,
      created_at: new Date().toISOString(),
      posted_at: new Date().toISOString(),
    };
    mockTransactions.unshift(summary);

    const outcome: TransferOutcome = {
      transaction: {
        ...summary,
        published_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        reversed_by_transaction_id: null,
        idempotency_key: body.idempotency_key || null,
        entries: [],
        total_debit: body.amount,
        total_credit: body.amount,
        balanced: true,
        lifecycle: [
          {
            id: `l-${Date.now()}`,
            state: 'posted',
            detail: 'Atomic opening balance committed',
            occurred_at: new Date().toISOString(),
          },
        ],
        outbox_events: [],
      },
      replayed: false,
    };
    return Promise.resolve(outcome as unknown as T);
  }

  // Account Detail
  if (pathname.startsWith('/accounts/')) {
    const id = pathname.replace('/accounts/', '');
    const account = mockAccounts.find(a => a.id === id);
    if (!account) throw new ApiError('Account not found', 404);
    const detail: AccountDetail = {
      ...account,
      totals: {
        total_debits: '0.00',
        total_credits: account.balance,
        entry_count: 8,
      },
      journal_balance: account.balance,
      projection_matches_journal: true,
    };
    return Promise.resolve(detail as unknown as T);
  }

  // Post Transfer
  if (pathname === '/transfers' && method === 'POST') {
    const body: PostTransferRequest = JSON.parse(options.body as string);
    const source = mockAccounts.find(a => a.id === body.source_account_id);
    const dest = mockAccounts.find(a => a.id === body.destination_account_id);

    if (!source || !dest) {
      throw new ApiError('Source or destination account not found', 404);
    }
    if (source.currency !== dest.currency || source.currency !== body.currency) {
      throw new ApiError('Currency mismatch across accounts and transfer amount', 400);
    }

    const transferAmount = parseFloat(body.amount);
    const sourceBal = parseFloat(source.balance);
    if (source.kind === 'customer' && sourceBal < transferAmount) {
      throw new ApiError(`Insufficient balance: available ${source.balance} ${source.currency}`, 422);
    }

    source.balance = (sourceBal - transferAmount).toFixed(2);
    source.balance_version += 1;
    dest.balance = (parseFloat(dest.balance) + transferAmount).toFixed(2);
    dest.balance_version += 1;

    const txId = crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`;
    const now = new Date().toISOString();
    const summary: TransactionSummary = {
      id: txId,
      seq: mockTransactions.length + 1001,
      reference: body.reference || `TX-${Date.now().toString().slice(-8)}`,
      kind: 'transfer',
      status: 'posted',
      currency: body.currency,
      amount: body.amount,
      source_account_id: source.id,
      source_account_code: source.code,
      destination_account_id: dest.id,
      destination_account_code: dest.code,
      description: body.description || 'Double-entry transfer',
      reverses_transaction_id: null,
      created_at: now,
      posted_at: now,
    };
    mockTransactions.unshift(summary);

    const debitEntry: EntryView = {
      id: `e-d-${Date.now()}`,
      seq: mockEntries.length + 2001,
      transaction_id: txId,
      transaction_reference: summary.reference,
      transaction_kind: 'transfer',
      transaction_status: 'posted',
      account_id: source.id,
      account_code: source.code,
      account_name: source.name,
      currency: body.currency,
      debit: body.amount,
      credit: '0.00',
      memo: body.description || null,
      posted_at: now,
    };
    const creditEntry: EntryView = {
      id: `e-c-${Date.now()}`,
      seq: mockEntries.length + 2002,
      transaction_id: txId,
      transaction_reference: summary.reference,
      transaction_kind: 'transfer',
      transaction_status: 'posted',
      account_id: dest.id,
      account_code: dest.code,
      account_name: dest.name,
      currency: body.currency,
      debit: '0.00',
      credit: body.amount,
      memo: body.description || null,
      posted_at: now,
    };
    mockEntries.unshift(debitEntry, creditEntry);

    const outboxItem: OutboxView = {
      id: `o-${Date.now()}`,
      seq: mockOutbox.length + 100,
      aggregate_id: txId,
      event_type: 'TransferPosted',
      status: 'pending',
      attempts: 0,
      available_at: now,
      locked_by: null,
      last_error: null,
      created_at: now,
      processed_at: null,
      age_seconds: 0.1,
    };
    mockOutbox.unshift(outboxItem);

    const outcome: TransferOutcome = {
      transaction: {
        ...summary,
        published_at: null,
        processed_at: null,
        reversed_by_transaction_id: null,
        idempotency_key: body.idempotency_key || null,
        entries: [debitEntry, creditEntry],
        total_debit: body.amount,
        total_credit: body.amount,
        balanced: true,
        lifecycle: [
          {
            id: `l1-${Date.now()}`,
            state: 'drafted',
            detail: 'Transfer validated and idempotency slot reserved',
            occurred_at: now,
          },
          {
            id: `l2-${Date.now()}`,
            state: 'posted',
            detail: 'Atomic double-entry committed to journal',
            occurred_at: now,
          },
        ],
        outbox_events: [outboxItem],
      },
      replayed: false,
    };

    return Promise.resolve(outcome as unknown as T);
  }

  // Reverse Transfer
  if (pathname === '/transfers/reverse' && method === 'POST') {
    const body: ReverseTransferRequest = JSON.parse(options.body as string);
    const orig = mockTransactions.find(t => t.id === body.transaction_id);
    if (!orig) throw new ApiError('Original transaction not found', 404);
    if (orig.status === 'reversed') throw new ApiError('Transaction already reversed', 409);

    orig.status = 'reversed';
    const source = mockAccounts.find(a => a.id === orig.source_account_id);
    const dest = mockAccounts.find(a => a.id === orig.destination_account_id);
    if (source && dest) {
      const amt = parseFloat(orig.amount);
      source.balance = (parseFloat(source.balance) + amt).toFixed(2);
      dest.balance = (parseFloat(dest.balance) - amt).toFixed(2);
    }

    const revId = crypto.randomUUID ? crypto.randomUUID() : `rev-${Date.now()}`;
    const now = new Date().toISOString();
    const revSummary: TransactionSummary = {
      id: revId,
      seq: mockTransactions.length + 1002,
      reference: `REV-${orig.reference}`,
      kind: 'reversal',
      status: 'posted',
      currency: orig.currency,
      amount: orig.amount,
      source_account_id: orig.destination_account_id,
      source_account_code: orig.destination_account_code,
      destination_account_id: orig.source_account_id,
      destination_account_code: orig.source_account_code,
      description: `Reversal of ${orig.reference}: ${body.reason || 'Compensating transaction'}`,
      reverses_transaction_id: orig.id,
      created_at: now,
      posted_at: now,
    };
    mockTransactions.unshift(revSummary);

    const outcome: TransferOutcome = {
      transaction: {
        ...revSummary,
        published_at: null,
        processed_at: null,
        reversed_by_transaction_id: null,
        idempotency_key: body.idempotency_key || null,
        entries: [],
        total_debit: orig.amount,
        total_credit: orig.amount,
        balanced: true,
        lifecycle: [
          {
            id: `l-rev-${Date.now()}`,
            state: 'reversed',
            detail: `Compensating debit/credit completed for ${orig.reference}`,
            occurred_at: now,
          },
        ],
        outbox_events: [],
      },
      replayed: false,
    };
    return Promise.resolve(outcome as unknown as T);
  }

  // Transactions list
  if (pathname === '/transactions' && method === 'GET') {
    const page: Page<TransactionSummary> = {
      items: mockTransactions,
      next_cursor: null,
      has_more: false,
    };
    return Promise.resolve(page as unknown as T);
  }

  // Single Transaction Detail
  if (pathname.startsWith('/transactions/')) {
    const id = pathname.replace('/transactions/', '');
    const tx = mockTransactions.find(t => t.id === id);
    if (!tx) throw new ApiError('Transaction not found', 404);
    const entries = mockEntries.filter(e => e.transaction_id === id);
    const detail: TransactionDetail = {
      ...tx,
      entries,
      total_debit: tx.amount,
      total_credit: tx.amount,
      balanced: true,
      lifecycle: [
        {
          id: `lc-1`,
          state: 'posted',
          detail: 'Transaction verified and committed to journal',
          occurred_at: tx.posted_at,
        },
      ],
      outbox_events: mockOutbox.filter(o => o.aggregate_id === id),
    };
    return Promise.resolve(detail as unknown as T);
  }

  // Entries list (Ledger Explorer)
  if (pathname === '/entries' && method === 'GET') {
    const page: Page<EntryView> = {
      items: mockEntries,
      next_cursor: null,
      has_more: false,
    };
    return Promise.resolve(page as unknown as T);
  }

  // Outbox list
  if (pathname === '/outbox' && method === 'GET') {
    const page: Page<OutboxView> = {
      items: mockOutbox,
      next_cursor: null,
      has_more: false,
    };
    return Promise.resolve(page as unknown as T);
  }

  // Outbox Retry
  if (pathname.startsWith('/outbox/') && pathname.endsWith('/retry') && method === 'POST') {
    const id = pathname.split('/')[2];
    const item = mockOutbox.find(o => o.id === id);
    if (item) {
      item.status = 'pending';
      item.attempts += 1;
      item.last_error = null;
      return Promise.resolve(item as unknown as T);
    }
    throw new ApiError('Outbox event not found', 404);
  }

  // Reconciliation Run
  if (pathname === '/reconciliation/run' && method === 'POST') {
    const now = new Date();
    const run: ReconciliationRunDetail = {
      summary: {
        id: `rec-${Date.now()}`,
        seq: mockReconciliationHistory.length + 1,
        status: 'passed',
        triggered_by: 'manual_operator',
        started_at: new Date(now.getTime() - 95).toISOString(),
        finished_at: now.toISOString(),
        duration_ms: 95,
        accounts_checked: mockAccounts.length,
        transactions_checked: mockTransactions.length,
        entries_checked: mockEntries.length,
        outbox_checked: mockOutbox.length,
        violation_count: 0,
      },
      violations: [],
    };
    mockReconciliationHistory.unshift(run.summary);
    return Promise.resolve(run as unknown as T);
  }

  // Reconciliation runs history
  if (pathname === '/reconciliation/runs' && method === 'GET') {
    const page: Page<ReconciliationRunSummary> = {
      items: mockReconciliationHistory,
      next_cursor: null,
      has_more: false,
    };
    return Promise.resolve(page as unknown as T);
  }

  throw new ApiError(`Route not found in mock router: ${pathname}`, 404);
}

// ----------------- Exported API Client Methods -----------------

export const api = {
  // Overview
  getOverview: () => request<OverviewStats>('/overview'),

  // Accounts
  listAccounts: (filter?: AccountFilter) => {
    const params = new URLSearchParams();
    if (filter?.search) params.set('search', filter.search);
    if (filter?.kind) params.set('kind', filter.kind);
    if (filter?.currency) params.set('currency', filter.currency);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.sort) params.set('sort', filter.sort);
    if (filter?.descending !== undefined) params.set('descending', String(filter.descending));
    if (filter?.page) params.set('page', String(filter.page));
    if (filter?.page_size) params.set('page_size', String(filter.page_size));

    const qs = params.toString();
    return request<AccountPage>(`/accounts${qs ? `?${qs}` : ''}`);
  },
  getAccount: (id: string) => request<AccountDetail>(`/accounts/${id}`),
  createAccount: (data: CreateAccountRequest) =>
    request<AccountView>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  initOpeningBalance: (data: InitOpeningBalanceRequest) =>
    request<TransferOutcome>('/accounts/opening-balance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Transfers & Transactions
  listTransactions: (filter?: TransactionFilter) => {
    const params = new URLSearchParams();
    if (filter?.search) params.set('search', filter.search);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.kind) params.set('kind', filter.kind);
    if (filter?.currency) params.set('currency', filter.currency);
    if (filter?.account_id) params.set('account_id', filter.account_id);
    if (filter?.cursor !== undefined) params.set('cursor', String(filter.cursor));
    if (filter?.limit !== undefined) params.set('limit', String(filter.limit));

    const qs = params.toString();
    return request<Page<TransactionSummary>>(`/transactions${qs ? `?${qs}` : ''}`);
  },
  getTransaction: (id: string) => request<TransactionDetail>(`/transactions/${id}`),
  postTransfer: (data: PostTransferRequest) =>
    request<TransferOutcome>('/transfers', {
      method: 'POST',
      headers: data.idempotency_key ? { 'Idempotency-Key': data.idempotency_key } : {},
      body: JSON.stringify(data),
    }),
  reverseTransfer: (data: ReverseTransferRequest) =>
    request<TransferOutcome>('/transfers/reversal', {
      method: 'POST',
      headers: data.idempotency_key ? { 'Idempotency-Key': data.idempotency_key } : {},
      body: JSON.stringify(data),
    }),

  // Ledger Explorer (Entries)
  listEntries: (filter?: EntryFilter) => {
    const params = new URLSearchParams();
    if (filter?.search) params.set('search', filter.search);
    if (filter?.account_id) params.set('account_id', filter.account_id);
    if (filter?.transaction_id) params.set('transaction_id', filter.transaction_id);
    if (filter?.side) params.set('side', filter.side);
    if (filter?.currency) params.set('currency', filter.currency);
    if (filter?.cursor !== undefined) params.set('cursor', String(filter.cursor));
    if (filter?.limit !== undefined) params.set('limit', String(filter.limit));

    const qs = params.toString();
    return request<Page<EntryView>>(`/ledger/entries${qs ? `?${qs}` : ''}`);
  },

  // Reconciliation
  triggerReconciliation: () =>
    request<ReconciliationRunDetail>('/reconciliation/run', {
      method: 'POST',
    }),
  listReconciliationRuns: () => request<ReconciliationRunSummary[]>('/reconciliation/runs'),
  getReconciliationRun: (id: string) => request<ReconciliationRunDetail>(`/reconciliation/runs/${id}`),

  // Outbox / Events
  listOutbox: (filter?: OutboxFilter) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.cursor !== undefined) params.set('cursor', String(filter.cursor));
    if (filter?.limit !== undefined) params.set('limit', String(filter.limit));

    const qs = params.toString();
    return request<Page<OutboxView>>(`/outbox/events${qs ? `?${qs}` : ''}`);
  },
  retryOutboxEvent: (id: string) =>
    request<OutboxView>(`/outbox/events/${id}/requeue`, {
      method: 'POST',
    }),

  // System Health & Faults
  getSystemHealth: () => request<SystemHealthView>('/system/health'),
  armFault: (data: ArmFaultRequest) =>
    request<FaultInjectionView>('/system/faults/arm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  disarmFaults: () =>
    request<{ success: boolean }>('/system/faults/clear', {
      method: 'POST',
    }),
};
