use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

use crate::DomainError;

/// Supported ISO-4217 currencies. Each defines the number of minor-unit decimal places.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Currency {
    Usd,
    Eur,
    Idr,
}

impl Currency {
    pub const ALL: [Currency; 3] = [Currency::Usd, Currency::Eur, Currency::Idr];

    /// Decimal places allowed for amounts in this currency. Amounts with more precision are rejected, never rounded.
    pub const fn scale(self) -> u32 {
        match self {
            Currency::Usd | Currency::Eur => 2,
            Currency::Idr => 0,
        }
    }

    pub const fn code(self) -> &'static str {
        match self {
            Currency::Usd => "USD",
            Currency::Eur => "EUR",
            Currency::Idr => "IDR",
        }
    }
}

impl fmt::Display for Currency {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())
    }
}

impl FromStr for Currency {
    type Err = DomainError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim().to_ascii_uppercase().as_str() {
            "USD" => Ok(Currency::Usd),
            "EUR" => Ok(Currency::Eur),
            "IDR" => Ok(Currency::Idr),
            other => Err(DomainError::UnsupportedCurrency(other.to_owned())),
        }
    }
}
