use rust_decimal::Decimal;

use crate::Currency;

/// Domain errors. Messages are safe to show to API clients (no internal details).
#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum DomainError {
    #[error("unsupported currency: {0}")]
    UnsupportedCurrency(String),
    #[error("amount must be greater than zero")]
    NonPositiveAmount,
    #[error("amount exceeds the maximum supported value")]
    AmountTooLarge,
    #[error("amount has more than {max_scale} decimal places for {currency}")]
    ExcessPrecision { currency: Currency, max_scale: u32 },
    #[error("source and destination accounts must be different")]
    SameAccount,
    #[error("account {account} is {status}, not active")]
    AccountNotActive { account: String, status: String },
    #[error("currency mismatch: expected {expected}, found {found}")]
    CurrencyMismatch { expected: Currency, found: Currency },
    #[error("insufficient funds: available {available}, requested {requested}")]
    InsufficientFunds {
        available: Decimal,
        requested: Decimal,
    },
    #[error("journal is unbalanced: debit {debit}, credit {credit}")]
    Unbalanced { debit: Decimal, credit: Decimal },
    #[error("illegal transaction status transition {from} -> {to}")]
    IllegalTransition { from: String, to: String },
}
