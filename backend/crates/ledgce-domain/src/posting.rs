use rust_decimal::Decimal;
use uuid::Uuid;

use crate::{Account, AccountKind, Currency, DomainError, Money};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Debit,
    Credit,
}

/// One side of a double-entry posting, before it is persisted.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EntryDraft {
    pub account_id: Uuid,
    pub currency: Currency,
    pub side: Side,
    pub amount: Decimal,
}

/// A balanced set of journal entries for a single transaction.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JournalPosting {
    entries: Vec<EntryDraft>,
}

impl JournalPosting {
    pub fn entries(&self) -> &[EntryDraft] {
        &self.entries
    }

    pub fn total(&self, side: Side) -> Decimal {
        self.entries
            .iter()
            .filter(|e| e.side == side)
            .map(|e| e.amount)
            .sum()
    }

    /// Debits must equal credits. Never "repaired" by rounding: an imbalance is an error.
    pub fn verify_balanced(&self) -> Result<(), DomainError> {
        let (debit, credit) = (self.total(Side::Debit), self.total(Side::Credit));
        if debit == credit && self.entries.len() >= 2 {
            Ok(())
        } else {
            Err(DomainError::Unbalanced { debit, credit })
        }
    }

    /// Build from raw entries (used by tests and verification); fails if unbalanced.
    pub fn from_entries(entries: Vec<EntryDraft>) -> Result<Self, DomainError> {
        let posting = Self { entries };
        posting.verify_balanced()?;
        Ok(posting)
    }
}

/// Posting rules.
pub struct Posting;

impl Posting {
    /// Same-currency transfer of `money` from `source` to `destination`:
    /// debit the source and credit the destination by the same amount.
    pub fn transfer(
        source: &Account,
        destination: &Account,
        money: Money,
    ) -> Result<JournalPosting, DomainError> {
        if source.id == destination.id {
            return Err(DomainError::SameAccount);
        }
        source.ensure_active()?;
        destination.ensure_active()?;
        for account in [source, destination] {
            if account.currency != money.currency() {
                return Err(DomainError::CurrencyMismatch {
                    expected: money.currency(),
                    found: account.currency,
                });
            }
        }
        let posting = JournalPosting {
            entries: vec![
                EntryDraft {
                    account_id: source.id,
                    currency: money.currency(),
                    side: Side::Debit,
                    amount: money.amount(),
                },
                EntryDraft {
                    account_id: destination.id,
                    currency: money.currency(),
                    side: Side::Credit,
                    amount: money.amount(),
                },
            ],
        };
        posting.verify_balanced()?;
        Ok(posting)
    }
}

/// Customer accounts may not be overdrawn; system accounts may.
pub fn ensure_sufficient_funds(
    source: &Account,
    balance: Decimal,
    requested: Decimal,
) -> Result<(), DomainError> {
    if source.kind == AccountKind::System || balance >= requested {
        Ok(())
    } else {
        Err(DomainError::InsufficientFunds {
            available: balance,
            requested,
        })
    }
}
