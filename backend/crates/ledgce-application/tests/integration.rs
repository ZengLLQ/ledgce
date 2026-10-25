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
    sqlx::PgPool,
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
        .max_connections(20)
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
    let system = SystemService::new(pool.clone());

    (
        pool,
        account,
        transfer,
        query,
        outbox,
        reconciliation,
        system,
    )
}

#[tokio::test]
async fn test_full_financial_core_and_reliability_lifecycle() {
    let (_pool, account_svc, transfer_svc, _query_svc, outbox_svc, recon_svc, system_svc) =
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
    let mut total_processed = 0;
    for _ in 0..10 {
        let count = outbox_svc
            .process_next_batch("test_worker_1", 50, 30)
            .await
            .expect("Outbox batch processing failed");
        total_processed += count;

        let tx_check = transfer_svc
            .get_transaction(transfer_outcome.transaction.summary.id)
            .await
            .expect("Failed to fetch transaction");
        if tx_check.summary.status == "processed" {
            break;
        }
        if count == 0 {
            break;
        }
    }

    assert!(
        total_processed > 0,
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

#[tokio::test]
async fn test_concurrent_bidirectional_transfers_no_deadlock() {
    let (_pool, account_svc, transfer_svc, _query_svc, _outbox_svc, recon_svc, _system_svc) =
        setup_test_services().await;

    let test_run_id = Uuid::now_v7().simple().to_string()[..8].to_string();
    let acct_a_code = format!("CONC:ALICE:{}", test_run_id);
    let acct_b_code = format!("CONC:BOB:{}", test_run_id);

    let alice = account_svc
        .create_account(
            CreateAccountRequest {
                code: acct_a_code,
                name: "Alice Concurrent".into(),
                kind: Some("customer".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .expect("Alice account creation failed");

    let bob = account_svc
        .create_account(
            CreateAccountRequest {
                code: acct_b_code,
                name: "Bob Concurrent".into(),
                kind: Some("customer".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .expect("Bob account creation failed");

    // Initialize 1000.00 USD opening balance for both accounts
    let init_amount = Decimal::from_str("1000.00").unwrap();
    account_svc
        .init_opening_balance(
            InitOpeningBalanceRequest {
                account_id: alice.id,
                amount: init_amount,
                reference: None,
                idempotency_key: Some(format!("init-a-{}", test_run_id)),
            },
            "admin",
        )
        .await
        .expect("Alice opening balance failed");

    account_svc
        .init_opening_balance(
            InitOpeningBalanceRequest {
                account_id: bob.id,
                amount: init_amount,
                reference: None,
                idempotency_key: Some(format!("init-b-{}", test_run_id)),
            },
            "admin",
        )
        .await
        .expect("Bob opening balance failed");

    // Spawn 20 concurrent tasks: 10 Alice -> Bob, 10 Bob -> Alice
    let mut tasks = Vec::new();
    let transfer_amount = Decimal::from_str("10.00").unwrap();

    for i in 0..10 {
        let transfer_svc = transfer_svc.clone();
        let alice_id = alice.id;
        let bob_id = bob.id;
        let test_run = test_run_id.clone();
        tasks.push(tokio::spawn(async move {
            transfer_svc
                .post_transfer(
                    PostTransferRequest {
                        source_account_id: alice_id,
                        destination_account_id: bob_id,
                        amount: transfer_amount,
                        currency: "USD".into(),
                        reference: None,
                        description: Some(format!("Alice to Bob #{}", i)),
                        idempotency_key: Some(format!("a2b-{}-{}", test_run, i)),
                    },
                    "alice",
                )
                .await
        }));
    }

    for i in 0..10 {
        let transfer_svc = transfer_svc.clone();
        let alice_id = alice.id;
        let bob_id = bob.id;
        let test_run = test_run_id.clone();
        tasks.push(tokio::spawn(async move {
            transfer_svc
                .post_transfer(
                    PostTransferRequest {
                        source_account_id: bob_id,
                        destination_account_id: alice_id,
                        amount: transfer_amount,
                        currency: "USD".into(),
                        reference: None,
                        description: Some(format!("Bob to Alice #{}", i)),
                        idempotency_key: Some(format!("b2a-{}-{}", test_run, i)),
                    },
                    "bob",
                )
                .await
        }));
    }

    for task in tasks {
        let res = task.await.expect("Tokio task panicked");
        assert!(res.is_ok(), "Transfer failed: {:?}", res);
    }

    // Verify balances: 10 transfers Alice -> Bob ($100), 10 transfers Bob -> Alice ($100)
    // Net delta is 0 for both! Total across both must remain exactly 2000.00 USD
    let alice_after = account_svc.get_account(alice.id).await.unwrap();
    let bob_after = account_svc.get_account(bob.id).await.unwrap();

    assert_eq!(
        alice_after.account.balance,
        Decimal::from_str("1000.00").unwrap()
    );
    assert_eq!(
        bob_after.account.balance,
        Decimal::from_str("1000.00").unwrap()
    );
    assert!(alice_after.projection_matches_journal);
    assert!(bob_after.projection_matches_journal);

    // Verify ledger reconciliation passes with 0 violations
    let recon = recon_svc
        .run_reconciliation("concurrent_test")
        .await
        .expect("Reconciliation run failed");
    assert_eq!(recon.summary.status, "passed");
    assert_eq!(recon.summary.violation_count, 0);
}

#[tokio::test]
async fn test_database_immutability_guards() {
    let (pool, account_svc, transfer_svc, _query_svc, ..) = setup_test_services().await;

    let test_run_id = Uuid::now_v7().simple().to_string()[..8].to_string();
    let acct_a = account_svc
        .create_account(
            CreateAccountRequest {
                code: format!("IMMUT:A:{}", test_run_id),
                name: "Immutability Test A".into(),
                kind: Some("customer".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .unwrap();

    let acct_b = account_svc
        .create_account(
            CreateAccountRequest {
                code: format!("IMMUT:B:{}", test_run_id),
                name: "Immutability Test B".into(),
                kind: Some("customer".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .unwrap();

    account_svc
        .init_opening_balance(
            InitOpeningBalanceRequest {
                account_id: acct_a.id,
                amount: Decimal::from_str("100.00").unwrap(),
                reference: None,
                idempotency_key: Some(format!("init-immut-{}", test_run_id)),
            },
            "admin",
        )
        .await
        .unwrap();

    let tx_outcome = transfer_svc
        .post_transfer(
            PostTransferRequest {
                source_account_id: acct_a.id,
                destination_account_id: acct_b.id,
                amount: Decimal::from_str("25.00").unwrap(),
                currency: "USD".into(),
                reference: None,
                description: Some("Immutability test transfer".into()),
                idempotency_key: Some(format!("tx-immut-{}", test_run_id)),
            },
            "alice",
        )
        .await
        .unwrap();

    let entry_id = tx_outcome.transaction.entries[0].id;

    // 1. Attempt to UPDATE a posted journal entry directly via SQL => rejected by trigger
    let update_entry_res = sqlx::query("UPDATE journal_entries SET debit = 0 WHERE id = $1")
        .bind(entry_id)
        .execute(&pool)
        .await;
    assert!(update_entry_res.is_err());
    let err_msg = update_entry_res.unwrap_err().to_string();
    assert!(
        err_msg.contains("forbidden") || err_msg.contains("append-only"),
        "Unexpected error: {}",
        err_msg
    );

    // 2. Attempt to DELETE a posted journal entry directly via SQL => rejected by trigger
    let delete_entry_res = sqlx::query("DELETE FROM journal_entries WHERE id = $1")
        .bind(entry_id)
        .execute(&pool)
        .await;
    assert!(delete_entry_res.is_err());
    let del_msg = delete_entry_res.unwrap_err().to_string();
    assert!(
        del_msg.contains("forbidden") || del_msg.contains("append-only"),
        "Unexpected error: {}",
        del_msg
    );

    // 3. Attempt to DELETE an account => rejected by trigger
    let delete_acct_res = sqlx::query("DELETE FROM accounts WHERE id = $1")
        .bind(acct_a.id)
        .execute(&pool)
        .await;
    assert!(delete_acct_res.is_err());
    let acct_del_msg = delete_acct_res.unwrap_err().to_string();
    assert!(
        acct_del_msg.contains("cannot be deleted"),
        "Unexpected error: {}",
        acct_del_msg
    );

    // 4. Attempt to modify immutable fields of account => rejected by trigger
    let update_acct_res = sqlx::query("UPDATE accounts SET currency = 'EUR' WHERE id = $1")
        .bind(acct_a.id)
        .execute(&pool)
        .await;
    assert!(update_acct_res.is_err());
    let acct_upd_msg = update_acct_res.unwrap_err().to_string();
    assert!(
        acct_upd_msg.contains("immutable account fields cannot change"),
        "Unexpected error: {}",
        acct_upd_msg
    );

    // 5. Attempt to mutate transaction amount => rejected by trigger
    let update_tx_res = sqlx::query("UPDATE transactions SET amount = 9999 WHERE id = $1")
        .bind(tx_outcome.transaction.summary.id)
        .execute(&pool)
        .await;
    assert!(update_tx_res.is_err());
    let tx_upd_msg = update_tx_res.unwrap_err().to_string();
    assert!(
        tx_upd_msg.contains("immutable transaction fields cannot change"),
        "Unexpected error: {}",
        tx_upd_msg
    );
}

#[tokio::test]
async fn test_outbox_required_constraint_trigger() {
    let (pool, account_svc, ..) = setup_test_services().await;

    let test_run_id = Uuid::now_v7().simple().to_string()[..8].to_string();
    let src = account_svc
        .create_account(
            CreateAccountRequest {
                code: format!("OUTBOX-SRC:{}", test_run_id),
                name: "Outbox Test Source".into(),
                kind: Some("system".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .unwrap();

    let dst = account_svc
        .create_account(
            CreateAccountRequest {
                code: format!("OUTBOX-DST:{}", test_run_id),
                name: "Outbox Test Dst".into(),
                kind: Some("system".into()),
                currency: "USD".into(),
                synthetic: Some(false),
            },
            "test_runner",
        )
        .await
        .unwrap();

    // Start manual database transaction
    let mut tx = pool.begin().await.unwrap();

    let tx_id = Uuid::now_v7();
    let ref_str = format!("TX-TEST-OUTBOX-{}", test_run_id);
    let amount = Decimal::from_str("100.00").unwrap();

    // Insert directly into transactions WITHOUT inserting outbox event
    sqlx::query!(
        r#"
        INSERT INTO transactions (
            id, reference, kind, status, currency, amount,
            source_account_id, destination_account_id, created_at, posted_at
        ) VALUES (
            $1, $2, 'transfer', 'posted', 'USD', $3, $4, $5, now(), now()
        )
        "#,
        tx_id,
        ref_str,
        amount,
        src.id,
        dst.id
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    // Insert 2 balanced journal entries so transactions_balanced trigger is satisfied
    let entry_a_id = Uuid::now_v7();
    sqlx::query!(
        r#"
        INSERT INTO journal_entries (
            id, transaction_id, account_id, currency, debit, credit, memo, posted_at
        ) VALUES (
            $1, $2, $3, 'USD', $4, 0, 'Test debit', now()
        )
        "#,
        entry_a_id,
        tx_id,
        src.id,
        amount
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    let entry_b_id = Uuid::now_v7();
    sqlx::query!(
        r#"
        INSERT INTO journal_entries (
            id, transaction_id, account_id, currency, debit, credit, memo, posted_at
        ) VALUES (
            $1, $2, $3, 'USD', 0, $4, 'Test credit', now()
        )
        "#,
        entry_b_id,
        tx_id,
        dst.id,
        amount
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    // Attempting to commit without outbox event MUST be rejected by transactions_outbox_required
    let commit_res = tx.commit().await;
    assert!(
        commit_res.is_err(),
        "Expected commit to fail without outbox event"
    );
    let err_str = commit_res.unwrap_err().to_string();
    assert!(
        err_str.contains("no outbox event") || err_str.contains("P0003"),
        "Unexpected error: {}",
        err_str
    );
}
