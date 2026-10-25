use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::{Currency, DomainError};

/// Largest amount accepted for a single posting (15 integer digits). Keeps arithmetic far from `NUMERIC(28,8)` limits.
/// Equals 999_999_999_999_999 (10^15 - 1); asserted in tests.
pub const MAX_AMOUNT: Decimal = Decimal::from_parts(0xA4C6_7FFF, 0x0003_8D7E, 0, false, 0);

/// A validated, strictly positive monetary amount with an explicit currency.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Money {
    amount: Decimal,
    currency: Currency,
}

impl Money {
    /// Validate an amount for a currency. Rejects zero/negative values, excess precision (never rounds) and huge values.
    pub fn new(amount: Decimal, currency: Currency) -> Result<Self, DomainError> {
        if amount <= Decimal::ZERO {
            return Err(DomainError::NonPositiveAmount);
        }
        if amount > MAX_AMOUNT {
            return Err(DomainError::AmountTooLarge);
        }
        let normalized = amount.normalize();
        if normalized.scale() > currency.scale() {
            return Err(DomainError::ExcessPrecision { currency, max_scale: currency.scale() });
        }
        let mut canonical = normalized;
        canonical.rescale(currency.scale());
        Ok(Self { amount: canonical, currency })
    }

    pub fn amount(&self) -> Decimal {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}
