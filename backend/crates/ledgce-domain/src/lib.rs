//! Ledgce domain model: money, accounts, double-entry posting rules and financial invariants.
//!
//! This crate performs **no I/O**. Everything here is pure and deterministic so the rules that protect the
//! ledger can be unit- and property-tested without a database. All monetary arithmetic uses
//! [`rust_decimal::Decimal`]; floating point is never used (the workspace denies `clippy::float_arithmetic`).

mod account;
mod currency;
mod error;
mod money;
mod posting;
mod status;

pub use account::{Account, AccountKind, AccountStatus};
pub use currency::Currency;
pub use error::DomainError;
pub use money::{MAX_AMOUNT, Money};
pub use posting::{EntryDraft, JournalPosting, Posting, Side, ensure_sufficient_funds};
pub use status::TransactionStatus;
