# ADR 0001: Strict Double-Entry Invariant Enforcement

## Context
A financial ledger must preserve mathematical balance at all times. Partial postings, single-sided debit/credits, or rounding drift destroy trust and create irreversible accounting discrepancies.

## Decision
1. Every financial transaction must consist of balanced debit and credit journal entries ($\sum \text{debits} = \sum \text{credits}$) in the identical currency.
2. The invariant is verified in-memory by the domain layer before database submission.
3. The invariant is enforced by PostgreSQL deferred constraint triggers (`transactions_balanced` and `journal_entries_balanced`).
4. Financial postings are append-only; mutations and deletions are blocked by triggers. Corrections occur solely via reversal transactions.

## Status
Accepted and Implemented.
