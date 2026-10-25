use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

use crate::DomainError;

/// Lifecycle states the backend actually records for a posted transaction: `posted -> published -> processed`.
///
/// A transfer that is rejected (validation, insufficient funds) never commits, so no transaction row exists and
/// there is deliberately no persisted "failed" state for the financial posting itself.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TransactionStatus {
    Posted,
    Published,
    Processed,
}

impl TransactionStatus {
    pub const fn as_str(self) -> &'static str {
        match self {
            TransactionStatus::Posted => "posted",
            TransactionStatus::Published => "published",
            TransactionStatus::Processed => "processed",
        }
    }

    /// Only single forward steps are legal. Mirrors the database trigger `ledgce_transactions_guard`.
    pub const fn can_transition_to(self, next: TransactionStatus) -> bool {
        matches!(
            (self, next),
            (TransactionStatus::Posted, TransactionStatus::Published)
                | (TransactionStatus::Published, TransactionStatus::Processed)
        )
    }

    pub fn transition(self, next: TransactionStatus) -> Result<TransactionStatus, DomainError> {
        if self.can_transition_to(next) {
            Ok(next)
        } else {
            Err(DomainError::IllegalTransition { from: self.to_string(), to: next.to_string() })
        }
    }
}

impl fmt::Display for TransactionStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for TransactionStatus {
    type Err = DomainError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "posted" => Ok(Self::Posted),
            "published" => Ok(Self::Published),
            "processed" => Ok(Self::Processed),
            other => Err(DomainError::IllegalTransition { from: other.to_owned(), to: "?".to_owned() }),
        }
    }
}
