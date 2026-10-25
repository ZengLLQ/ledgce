-- Ledgce migration 0001: core ledger tables.
--
-- Conventions
--   * Money is NUMERIC(28,8). Per-currency scale is enforced by CHECK constraints (IDR=0 dp, USD/EUR=2 dp).
--   * Balance convention: balance = SUM(credit) - SUM(debit). Debiting the source reduces it, crediting the
--     destination increases it. Because every transaction balances, the sum of all balances per currency is 0.
--   * Posted journal entries are immutable (see 0002_integrity.sql). Corrections use reversal transactions.

CREATE TABLE accounts (
    id          UUID PRIMARY KEY,
    code        TEXT        NOT NULL UNIQUE CHECK (code ~ '^[A-Za-z0-9:_\-\.]{3,64}$'),
    name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    kind        TEXT        NOT NULL CHECK (kind IN ('customer', 'system')),
    currency    CHAR(3)     NOT NULL CHECK (currency IN ('USD', 'EUR', 'IDR')),
    status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    synthetic   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Needed so journal entries can reference (account, currency) and the DB guarantees currency agreement.
    UNIQUE (id, currency)
);
CREATE INDEX accounts_created_idx ON accounts (created_at DESC, id);

-- Transactional balance projection. Maintained by a trigger on journal_entries (atomic with posting);
-- reconciliation recomputes it from the journal and reports any mismatch.
CREATE TABLE account_balances (
    account_id  UUID PRIMARY KEY REFERENCES accounts (id),
    is_system   BOOLEAN        NOT NULL,
    balance     NUMERIC(28, 8) NOT NULL DEFAULT 0,
    version     BIGINT         NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    -- Customer accounts can never go negative (no overdraft). System accounts (e.g. opening equity) may.
    CONSTRAINT customer_balance_nonnegative CHECK (is_system OR balance >= 0)
);

CREATE TABLE transactions (
    id                       UUID PRIMARY KEY,
    seq                      BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    reference                TEXT           NOT NULL UNIQUE,
    kind                     TEXT           NOT NULL CHECK (kind IN ('transfer', 'opening_balance', 'reversal')),
    -- Implemented lifecycle: posted -> published -> processed. Transfers rejected before commit leave no row.
    status                   TEXT           NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'published', 'processed')),
    currency                 CHAR(3)        NOT NULL CHECK (currency IN ('USD', 'EUR', 'IDR')),
    amount                   NUMERIC(28, 8) NOT NULL CHECK (amount > 0),
    source_account_id        UUID           NOT NULL,
    destination_account_id   UUID           NOT NULL,
    description              TEXT           CHECK (description IS NULL OR char_length(description) <= 280),
    reverses_transaction_id  UUID           REFERENCES transactions (id),
    created_at               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    posted_at                TIMESTAMPTZ    NOT NULL DEFAULT now(),
    published_at             TIMESTAMPTZ,
    processed_at             TIMESTAMPTZ,
    FOREIGN KEY (source_account_id, currency)      REFERENCES accounts (id, currency),
    FOREIGN KEY (destination_account_id, currency) REFERENCES accounts (id, currency),
    CHECK (source_account_id <> destination_account_id),
    CHECK (currency = 'IDR' AND amount = trunc(amount) OR currency <> 'IDR' AND amount = round(amount, 2))
);
CREATE INDEX transactions_seq_desc_idx ON transactions (seq DESC);
CREATE INDEX transactions_source_idx ON transactions (source_account_id, seq DESC);
CREATE INDEX transactions_destination_idx ON transactions (destination_account_id, seq DESC);
CREATE UNIQUE INDEX transactions_one_reversal_idx ON transactions (reverses_transaction_id)
    WHERE reverses_transaction_id IS NOT NULL;

-- Append-only record of lifecycle facts the backend really produces.
CREATE TABLE transaction_events (
    id              UUID PRIMARY KEY,
    transaction_id  UUID        NOT NULL REFERENCES transactions (id),
    state           TEXT        NOT NULL CHECK (state IN ('accepted', 'posted', 'published', 'processed', 'failed')),
    detail          TEXT,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transaction_events_tx_idx ON transaction_events (transaction_id, occurred_at, id);

CREATE TABLE journal_entries (
    id              UUID PRIMARY KEY,
    seq             BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    transaction_id  UUID           NOT NULL REFERENCES transactions (id),
    account_id      UUID           NOT NULL,
    currency        CHAR(3)        NOT NULL,
    debit           NUMERIC(28, 8) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit          NUMERIC(28, 8) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    memo            TEXT,
    posted_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    FOREIGN KEY (account_id, currency) REFERENCES accounts (id, currency),
    -- Exactly one side of an entry is non-zero.
    CHECK ((debit = 0) <> (credit = 0)),
    CHECK (currency = 'IDR' AND debit = trunc(debit) AND credit = trunc(credit)
           OR currency <> 'IDR' AND debit = round(debit, 2) AND credit = round(credit, 2))
);
CREATE INDEX journal_entries_account_idx ON journal_entries (account_id, seq DESC);
CREATE INDEX journal_entries_transaction_idx ON journal_entries (transaction_id);
CREATE INDEX journal_entries_posted_at_idx ON journal_entries (posted_at DESC);

CREATE TABLE idempotency_records (
    id              UUID PRIMARY KEY,
    principal       TEXT        NOT NULL,
    idempotency_key TEXT        NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
    request_hash    TEXT        NOT NULL,
    -- Set before commit; the claim and the posting live in one DB transaction.
    transaction_id  UUID        REFERENCES transactions (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- The database-enforced uniqueness is the core of the idempotency guarantee.
    UNIQUE (principal, idempotency_key)
);
CREATE INDEX idempotency_transaction_idx ON idempotency_records (transaction_id);
