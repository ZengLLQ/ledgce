use ledgce_domain::*;
use proptest::prelude::*;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use uuid::Uuid;

fn account(kind: AccountKind, currency: Currency, status: AccountStatus) -> Account {
    let id = Uuid::now_v7();
    Account { id, code: format!("ACC:{}", &id.to_string()[..8]), kind, currency, status }
}

fn customer(currency: Currency) -> Account {
    account(AccountKind::Customer, currency, AccountStatus::Active)
}

#[test]
fn max_amount_constant_is_ten_to_the_fifteen_minus_one() {
    assert_eq!(MAX_AMOUNT, dec!(999999999999999));
}

#[test]
fn valid_transfer_debits_source_and_credits_destination() {
    let (a, b) = (customer(Currency::Usd), customer(Currency::Usd));
    let money = Money::new(dec!(125.50), Currency::Usd).unwrap();
    let posting = Posting::transfer(&a, &b, money).unwrap();
    let entries = posting.entries();
    assert_eq!(entries.len(), 2);
    assert_eq!((entries[0].account_id, entries[0].side, entries[0].amount), (a.id, Side::Debit, dec!(125.50)));
    assert_eq!((entries[1].account_id, entries[1].side, entries[1].amount), (b.id, Side::Credit, dec!(125.50)));
    assert_eq!(posting.total(Side::Debit), posting.total(Side::Credit));
    assert!(posting.verify_balanced().is_ok());
}

#[test]
fn zero_and_negative_amounts_are_rejected() {
    assert_eq!(Money::new(dec!(0), Currency::Usd), Err(DomainError::NonPositiveAmount));
    assert_eq!(Money::new(dec!(-1.00), Currency::Usd), Err(DomainError::NonPositiveAmount));
}

#[test]
fn excess_precision_is_rejected_not_rounded() {
    assert_eq!(
        Money::new(dec!(10.001), Currency::Usd),
        Err(DomainError::ExcessPrecision { currency: Currency::Usd, max_scale: 2 })
    );
    assert!(Money::new(dec!(10.5), Currency::Idr).is_err());
    // Trailing zeros beyond the scale are harmless and canonicalised.
    assert_eq!(Money::new(dec!(10.500), Currency::Usd).unwrap().amount().to_string(), "10.50");
    assert_eq!(Money::new(dec!(1000), Currency::Idr).unwrap().amount().to_string(), "1000");
}

#[test]
fn oversized_amounts_are_rejected() {
    assert_eq!(Money::new(dec!(1000000000000000), Currency::Usd), Err(DomainError::AmountTooLarge));
    assert!(Money::new(MAX_AMOUNT, Currency::Idr).is_ok());
}

#[test]
fn same_account_transfer_is_rejected() {
    let a = customer(Currency::Usd);
    let money = Money::new(dec!(1), Currency::Usd).unwrap();
    assert_eq!(Posting::transfer(&a, &a, money), Err(DomainError::SameAccount));
}

#[test]
fn currency_mismatch_is_rejected() {
    let (usd, eur) = (customer(Currency::Usd), customer(Currency::Eur));
    let money = Money::new(dec!(5), Currency::Usd).unwrap();
    assert_eq!(
        Posting::transfer(&usd, &eur, money),
        Err(DomainError::CurrencyMismatch { expected: Currency::Usd, found: Currency::Eur })
    );
}

#[test]
fn inactive_accounts_cannot_post() {
    let active = customer(Currency::Usd);
    for status in [AccountStatus::Frozen, AccountStatus::Closed] {
        let inactive = account(AccountKind::Customer, Currency::Usd, status);
        let money = Money::new(dec!(5), Currency::Usd).unwrap();
        assert!(matches!(Posting::transfer(&active, &inactive, money), Err(DomainError::AccountNotActive { .. })));
        assert!(matches!(Posting::transfer(&inactive, &active, money), Err(DomainError::AccountNotActive { .. })));
    }
}

#[test]
fn unbalanced_journals_are_rejected() {
    let entries = vec![
        EntryDraft { account_id: Uuid::now_v7(), currency: Currency::Usd, side: Side::Debit, amount: dec!(10.00) },
        EntryDraft { account_id: Uuid::now_v7(), currency: Currency::Usd, side: Side::Credit, amount: dec!(9.99) },
    ];
    assert!(matches!(JournalPosting::from_entries(entries), Err(DomainError::Unbalanced { .. })));
}

#[test]
fn single_sided_journal_is_rejected() {
    let entries = vec![EntryDraft {
        account_id: Uuid::now_v7(),
        currency: Currency::Usd,
        side: Side::Debit,
        amount: dec!(0),
    }];
    assert!(JournalPosting::from_entries(entries).is_err());
}

#[test]
fn customers_cannot_overdraw_but_system_accounts_can() {
    let cust = customer(Currency::Usd);
    assert!(ensure_sufficient_funds(&cust, dec!(100.00), dec!(100.00)).is_ok());
    assert_eq!(
        ensure_sufficient_funds(&cust, dec!(99.99), dec!(100.00)),
        Err(DomainError::InsufficientFunds { available: dec!(99.99), requested: dec!(100.00) })
    );
    let sys = account(AccountKind::System, Currency::Usd, AccountStatus::Active);
    assert!(ensure_sufficient_funds(&sys, dec!(0), dec!(1_000_000)).is_ok());
}

#[test]
fn lifecycle_only_allows_single_forward_steps() {
    use TransactionStatus::*;
    assert_eq!(Posted.transition(Published), Ok(Published));
    assert_eq!(Published.transition(Processed), Ok(Processed));
    for (from, to) in [(Posted, Processed), (Published, Posted), (Processed, Posted), (Processed, Published), (Posted, Posted)] {
        assert!(matches!(from.transition(to), Err(DomainError::IllegalTransition { .. })), "{from} -> {to}");
    }
}

#[test]
fn currency_parsing_is_strict() {
    assert_eq!("usd".parse::<Currency>(), Ok(Currency::Usd));
    assert!(matches!("BTC".parse::<Currency>(), Err(DomainError::UnsupportedCurrency(_))));
}

proptest! {
    /// For any valid amount, a transfer posting is balanced and moves exactly the requested amount.
    #[test]
    fn transfer_postings_are_always_balanced(minor in 1i64..=9_999_999_999_999i64, currency_idx in 0usize..3) {
        let currency = Currency::ALL[currency_idx];
        let amount = Decimal::new(minor, currency.scale());
        let money = Money::new(amount, currency).unwrap();
        let (a, b) = (customer(currency), customer(currency));
        let posting = Posting::transfer(&a, &b, money).unwrap();
        prop_assert_eq!(posting.total(Side::Debit), amount);
        prop_assert_eq!(posting.total(Side::Credit), amount);
        prop_assert!(posting.verify_balanced().is_ok());
    }

    /// Any amount with more decimals than the currency allows is rejected rather than silently rounded.
    #[test]
    fn excess_precision_always_rejected(minor in 1i64..=9_999_999_999i64) {
        let amount = Decimal::new(minor * 10 + 1, 3); // always has a non-zero 3rd decimal place
        prop_assert!(Money::new(amount, Currency::Usd).is_err());
        prop_assert!(Money::new(amount, Currency::Idr).is_err());
    }
}
