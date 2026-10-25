-- Ledgce migration 0002: invariants enforced by the database itself.
-- Application-level validation exists too, but these protect the ledger even against buggy or hostile callers.

-- 1. Balance projection: created with the account, updated atomically with every journal entry.
CREATE FUNCTION ledgce_create_balance_row() RETURNS trigger AS $$
BEGIN
    INSERT INTO account_balances (account_id, is_system) VALUES (NEW.id, NEW.kind = 'system');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_create_balance
    AFTER INSERT ON accounts FOR EACH ROW EXECUTE FUNCTION ledgce_create_balance_row();

-- Account identity fields are immutable; only status may change.
CREATE FUNCTION ledgce_accounts_guard() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'ledgce: accounts cannot be deleted' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.id <> OLD.id OR NEW.code <> OLD.code OR NEW.kind <> OLD.kind OR NEW.currency <> OLD.currency
       OR NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'ledgce: immutable account fields cannot change' USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_guard
    BEFORE UPDATE OR DELETE ON accounts FOR EACH ROW EXECUTE FUNCTION ledgce_accounts_guard();

-- 2. A journal entry may only be written against an ACTIVE account, and it updates the balance projection.
CREATE FUNCTION ledgce_entry_before_insert() RETURNS trigger AS $$
DECLARE
    acct_status TEXT;
BEGIN
    SELECT status INTO acct_status FROM accounts WHERE id = NEW.account_id;
    IF acct_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'ledgce: account % is not active', NEW.account_id USING ERRCODE = 'P0002';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_before_insert
    BEFORE INSERT ON journal_entries FOR EACH ROW EXECUTE FUNCTION ledgce_entry_before_insert();

CREATE FUNCTION ledgce_entry_apply_balance() RETURNS trigger AS $$
BEGIN
    UPDATE account_balances
       SET balance = balance + NEW.credit - NEW.debit,
           version = version + 1,
           updated_at = now()
     WHERE account_id = NEW.account_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_apply_balance
    AFTER INSERT ON journal_entries FOR EACH ROW EXECUTE FUNCTION ledgce_entry_apply_balance();

-- 3. Immutable journal: no UPDATE, DELETE or TRUNCATE of posted entries.
CREATE FUNCTION ledgce_immutable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'ledgce: % on % is forbidden (append-only); use a reversal transaction', TG_OP, TG_TABLE_NAME
        USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_immutable
    BEFORE UPDATE OR DELETE ON journal_entries FOR EACH ROW EXECUTE FUNCTION ledgce_immutable();
CREATE TRIGGER journal_entries_no_truncate
    BEFORE TRUNCATE ON journal_entries FOR EACH STATEMENT EXECUTE FUNCTION ledgce_immutable();
CREATE TRIGGER transaction_events_immutable
    BEFORE UPDATE OR DELETE ON transaction_events FOR EACH ROW EXECUTE FUNCTION ledgce_immutable();

-- 4. Transactions: financial fields are immutable; only lifecycle status may advance, one forward step at a time.
CREATE FUNCTION ledgce_transactions_guard() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'ledgce: transactions cannot be deleted' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.id <> OLD.id OR NEW.reference <> OLD.reference OR NEW.kind <> OLD.kind
       OR NEW.currency <> OLD.currency OR NEW.amount <> OLD.amount
       OR NEW.source_account_id <> OLD.source_account_id
       OR NEW.destination_account_id <> OLD.destination_account_id
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.reverses_transaction_id IS DISTINCT FROM OLD.reverses_transaction_id
       OR NEW.created_at <> OLD.created_at OR NEW.posted_at <> OLD.posted_at THEN
        RAISE EXCEPTION 'ledgce: immutable transaction fields cannot change' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.status <> OLD.status AND NOT (
           (OLD.status = 'posted' AND NEW.status = 'published')
        OR (OLD.status = 'published' AND NEW.status = 'processed')) THEN
        RAISE EXCEPTION 'ledgce: illegal transaction status transition % -> %', OLD.status, NEW.status
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_guard
    BEFORE UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION ledgce_transactions_guard();

-- 5. Commit-time invariant: every transaction is balanced per currency, has >= 2 entries, and has an outbox record.
--    (The outbox check is created in migration 0003 once the outbox table exists.)
CREATE FUNCTION ledgce_assert_transaction_balanced(tx UUID) RETURNS void AS $$
DECLARE
    entry_count BIGINT;
    total_debit NUMERIC;
    total_credit NUMERIC;
BEGIN
    SELECT count(*), COALESCE(sum(debit), 0), COALESCE(sum(credit), 0)
      INTO entry_count, total_debit, total_credit
      FROM journal_entries WHERE transaction_id = tx;
    IF entry_count < 2 THEN
        RAISE EXCEPTION 'ledgce: transaction % has % journal entries (need >= 2)', tx, entry_count
            USING ERRCODE = 'P0003';
    END IF;
    IF total_debit <> total_credit THEN
        RAISE EXCEPTION 'ledgce: transaction % is unbalanced (debit %, credit %)', tx, total_debit, total_credit
            USING ERRCODE = 'P0003';
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION ledgce_entry_balanced_check() RETURNS trigger AS $$
BEGIN
    PERFORM ledgce_assert_transaction_balanced(NEW.transaction_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION ledgce_transaction_balanced_check() RETURNS trigger AS $$
BEGIN
    PERFORM ledgce_assert_transaction_balanced(NEW.id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER journal_entries_balanced
    AFTER INSERT ON journal_entries DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION ledgce_entry_balanced_check();
CREATE CONSTRAINT TRIGGER transactions_balanced
    AFTER INSERT ON transactions DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION ledgce_transaction_balanced_check();
