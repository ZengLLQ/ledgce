#![allow(clippy::unwrap_used)]

use rust_decimal::Decimal;
use sqlx::postgres::PgPoolOptions;
use std::str::FromStr;
use uuid::Uuid;

use ledgce_application::model::{
    CreateAccountRequest, InitOpeningBalanceRequest, PostTransferRequest, ReverseTransferRequest,
};
use ledgce_application::{
    AccountService, AppError, LedgerQueryService, OutboxService, ReconciliationService,
    SystemService, TransferService, db,
};

async fn setup_test_services() -> (
    AccountService,
    TransferService,
    LedgerQueryService,
    OutboxService,
    ReconciliationService,
    SystemService,
) {
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://ledgce:ledgce_local_dev@127.0.0.1:5433/ledgce".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .expect("Failed to connect to test Postgres database");

    db::run_migrations(&pool)
        .await
        .expect("Failed to run migrations");

    let transfer = TransferService::new(pool.clone());
    let account = AccountService::new(pool.clone(), transfer.clone());
    let query = LedgerQueryService::new(pool.clone());
    let outbox = OutboxService::new(pool.clone());
    let reconciliation = ReconciliationService::new(pool.clone());
    let system = SystemService::new(pool);

    (account, transfer, query, outbox, reconciliation, system)
}

#[tokio::test]
async fn test_full_financial_core_and_reliability_lifecycle() {
    let (account_svc, transfer_svc, _query_svc, outbox_svc, recon_svc, system_svc) =
        setup_test_services().await;

    let test_run_id = Uuid::now_v7().simple().to_string()[..8].to_string();

    // 1. Account Creation
    let acct_a_code = format!("USER:ALICE:{}", test_run_id);
    let acct_b_code = format!("USER:BOB:{}", test_run_id);

    let alice = account_svc
        .create_account(
            CreateAccountRequest {
                code: acct_a_code.clone(),
                name: "Alice Test".into(),
                kind: Some("customer".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .expect("Failed to create Alice account");

    assert_eq!(alice.code, acct_a_code);
    assert_eq!(alice.balance, Decimal::ZERO);

    let bob = account_svc
        .create_account(
            CreateAccountRequest {
                code: acct_b_code.clone(),
                name: "Bob Test".into(),
                kind: Some("customer".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .expect("Failed to create Bob account");

    assert_eq!(bob.balance, Decimal::ZERO);

    // 2. Opening Balance Injection via System Equity
    let init_amount = Decimal::from_str("1000.00").unwrap();
    let init_outcome = account_svc
        .init_opening_balance(
            InitOpeningBalanceRequest {
                account_id: alice.id,
                amount: init_amount,
                reference: None,
                idempotency_key: Some(format!("init-alice-{}", test_run_id)),
            },
            "admin",
        )
        .await
        .expect("Failed to initialize Alice opening balance");

    assert!(!init_outcome.replayed);
    assert_eq!(init_outcome.transaction.summary.amount, init_amount);
    assert!(init_outcome.transaction.balanced);

    // Verify Alice's balance
    let alice_detail = account_svc
        .get_account(alice.id)
        .await
        .expect("Failed to get Alice detail");
    assert_eq!(alice_detail.account.balance, init_amount);
    assert!(alice_detail.projection_matches_journal);

    // 3. Internal Transfer Alice -> Bob
    let transfer_amount = Decimal::from_str("250.00").unwrap();
    let transfer_outcome = transfer_svc
        .post_transfer(
            PostTransferRequest {
                source_account_id: alice.id,
                destination_account_id: bob.id,
                amount: transfer_amount,
                currency: "USD".into(),
                reference: None,
                description: Some("Peer transfer".into()),
                idempotency_key: Some(format!("tx-alice-bob-{}", test_run_id)),
            },
            "alice",
        )
        .await
        .expect("Transfer Alice -> Bob failed");

    assert!(!transfer_outcome.replayed);
    assert_eq!(transfer_outcome.transaction.summary.amount, transfer_amount);
    assert_eq!(transfer_outcome.transaction.entries.len(), 2);
    assert!(transfer_outcome.transaction.balanced);

    // Check updated balances
    let alice_after = account_svc.get_account(alice.id).await.unwrap();
    let bob_after = account_svc.get_account(bob.id).await.unwrap();
    assert_eq!(
        alice_after.account.balance,
        Decimal::from_str("750.00").unwrap()
    );
    assert_eq!(
        bob_after.account.balance,
        Decimal::from_str("250.00").unwrap()
    );

    // 4. Idempotency Replay Test
    // Same idempotency key + same payload => returns replayed: true with identical transaction
    let replay_outcome = transfer_svc
        .post_transfer(
            PostTransferRequest {
                source_account_id: alice.id,
                destination_account_id: bob.id,
                amount: transfer_amount,
                currency: "USD".into(),
                reference: None,
                description: Some("Peer transfer".into()),
                idempotency_key: Some(format!("tx-alice-bob-{}", test_run_id)),
            },
            "alice",
        )
        .await
        .expect("Replay should succeed");

    assert!(replay_outcome.replayed);
    assert_eq!(
        replay_outcome.transaction.summary.id,
        transfer_outcome.transaction.summary.id
    );

    // Idempotency key reuse with DIFFERENT payload => returns IdempotencyKeyReuse error
    let reuse_err = transfer_svc
        .post_transfer(
            PostTransferRequest {
                source_account_id: alice.id,
                destination_account_id: bob.id,
                amount: Decimal::from_str("50.00").unwrap(), // different amount!
                currency: "USD".into(),
                reference: None,
                description: Some("Different payload".into()),
                idempotency_key: Some(format!("tx-alice-bob-{}", test_run_id)),
            },
            "alice",
        )
        .await;

    match reuse_err {
        Err(AppError::IdempotencyKeyReuse) => {}
        other => panic!("Expected IdempotencyKeyReuse error, got: {:?}", other),
    }

    // 5. Insufficient Funds Protection
    let excessive_amount = Decimal::from_str("10000.00").unwrap();
    let insufficient_err = transfer_svc
        .post_transfer(
            PostTransferRequest {
                source_account_id: alice.id,
                destination_account_id: bob.id,
                amount: excessive_amount,
                currency: "USD".into(),
                reference: None,
                description: None,
                idempotency_key: None,
            },
            "alice",
        )
        .await;

    match insufficient_err {
        Err(AppError::Domain(ledgce_domain::DomainError::InsufficientFunds { .. })) => {}
        other => panic!("Expected InsufficientFunds domain error, got: {:?}", other),
    }

    // 6. Reversal of Transfer
    let rev_outcome = transfer_svc
        .reverse_transfer(
            ReverseTransferRequest {
                transaction_id: transfer_outcome.transaction.summary.id,
                reason: Some("Customer requested refund".into()),
                idempotency_key: Some(format!("rev-tx-{}", test_run_id)),
            },
            "support_agent",
        )
        .await
        .expect("Reversal should succeed");

    assert!(!rev_outcome.replayed);
    assert_eq!(rev_outcome.transaction.summary.kind, "reversal");
    assert_eq!(
        rev_outcome.transaction.summary.reverses_transaction_id,
        Some(transfer_outcome.transaction.summary.id)
    );

    // Balances returned to pre-transfer state
    let alice_after_rev = account_svc.get_account(alice.id).await.unwrap();
    let bob_after_rev = account_svc.get_account(bob.id).await.unwrap();
    assert_eq!(
        alice_after_rev.account.balance,
        Decimal::from_str("1000.00").unwrap()
    );
    assert_eq!(bob_after_rev.account.balance, Decimal::ZERO);

    // 7. Background Outbox Processing
    let processed_count = outbox_svc
        .process_next_batch("test_worker_1", 20, 30)
        .await
        .expect("Outbox batch processing failed");

    assert!(
        processed_count > 0,
        "Expected at least 1 outbox event to be processed"
    );

    // Verify transaction lifecycle advanced to processed
    let tx_check = transfer_svc
        .get_transaction(transfer_outcome.transaction.summary.id)
        .await
        .expect("Failed to fetch transaction");
    assert_eq!(tx_check.summary.status, "processed");

    // 8. Ledger Reconciliation
    let recon_run = recon_svc
        .run_reconciliation("integration_test")
        .await
        .expect("Reconciliation run failed");

    assert_eq!(
        recon_run.summary.status, "passed",
        "Reconciliation violations found: {:?}",
        recon_run.violations
    );
    assert_eq!(recon_run.summary.violation_count, 0);

    // 9. System Health Check
    let health = system_svc.get_health().await.expect("Failed to get health");
    assert_eq!(health.status, "healthy");
    assert!(health.database_connected);
    assert!(health.ledger_invariants_pass);
}
