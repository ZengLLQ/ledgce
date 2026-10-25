use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{Currency, DomainError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccountKind {
    /// Holds customer funds; may never be overdrawn.
    Customer,
    /// Internal counter-account (e.g. opening equity); may carry a negative balance by design.
    System,
}

impl AccountKind {
    pub const fn as_str(self) -> &'static str {
        match self {
            AccountKind::Customer => "customer",
            AccountKind::System => "system",
        }
    }
}

impl FromStr for AccountKind {
    type Err = DomainError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "customer" => Ok(Self::Customer),
            "system" => Ok(Self::System),
            other => Err(DomainError::UnsupportedCurrency(format!("account kind {other}"))),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccountStatus {
    Active,
    Frozen,
    Closed,
}

impl AccountStatus {
    pub const fn as_str(self) -> &'static str {
        match self {
            AccountStatus::Active => "active",
            AccountStatus::Frozen => "frozen",
            AccountStatus::Closed => "closed",
        }
    }
}

impl fmt::Display for AccountStatus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for AccountStatus {
    type Err = DomainError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "active" => Ok(Self::Active),
            "frozen" => Ok(Self::Frozen),
            "closed" => Ok(Self::Closed),
            other => Err(DomainError::UnsupportedCurrency(format!("account status {other}"))),
        }
    }
}

/// The subset of an account the posting rules need.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Account {
    pub id: Uuid,
    pub code: String,
    pub kind: AccountKind,
    pub currency: Currency,
    pub status: AccountStatus,
}

impl Account {
    pub fn ensure_active(&self) -> Result<(), DomainError> {
        if self.status == AccountStatus::Active {
            Ok(())
        } else {
            Err(DomainError::AccountNotActive { account: self.code.clone(), status: self.status.to_string() })
        }
    }
}
