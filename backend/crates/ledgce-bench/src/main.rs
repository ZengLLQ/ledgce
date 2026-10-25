use std::str::FromStr;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

use hdrhistogram::Histogram;
use rust_decimal::Decimal;
use sqlx::postgres::PgPoolOptions;
use tokio::sync::Mutex;
use uuid::Uuid;

use ledgce_application::model::{
    CreateAccountRequest, InitOpeningBalanceRequest, PostTransferRequest,
};
use ledgce_application::{AccountService, ReconciliationService, TransferService, db};

#[tokio::main]
#[allow(clippy::float_arithmetic)]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    println!("============================================================");
    println!("  LEDGCE HIGH-CONCURRENCY FINANCIAL BENCHMARK HARNESS");
    println!("  Double-Entry Atomic Invariants & Idempotency Stress Test");
    println!("============================================================");

    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://ledgce:ledgce_local_dev@127.0.0.1:5433/ledgce".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(50)
        .connect(&db_url)
        .await?;

    db::run_migrations(&pool).await?;

    let transfer_svc = TransferService::new(pool.clone());
    let account_svc = AccountService::new(pool.clone(), transfer_svc.clone());
    let recon_svc = ReconciliationService::new(pool.clone());

    let bench_batch_id = format!(
        "{}-{}",
        &Uuid::now_v7().simple().to_string()[24..],
        rand::random::<u16>()
    );
    println!("\n[1/4] Provisioning 10 test benchmark accounts ({bench_batch_id})...");

    let mut account_ids = Vec::new();
    let initial_balance = Decimal::from_str("100000.00")?;

    for i in 0..10 {
        let code = format!("BENCH:{}:{}", bench_batch_id, i);
        let acct = account_svc
            .create_account(
                CreateAccountRequest {
                    code: code.clone(),
                    name: format!("Bench Account {i}"),
                    kind: Some("customer".into()),
                    currency: "USD".into(),
                    synthetic: Some(false),
                },
                "benchmark_harness",
            )
            .await?;

        account_svc
            .init_opening_balance(
                InitOpeningBalanceRequest {
                    account_id: acct.id,
                    amount: initial_balance,
                    reference: None,
                    idempotency_key: Some(format!("init-bench-{}-{}", bench_batch_id, i)),
                },
                "admin",
            )
            .await?;

        account_ids.push(acct.id);
    }
    println!("  ✓ 10 accounts provisioned with $100,000.00 USD each.");

    let total_transfers = 500;
    let concurrency = 10;
    let transfers_per_worker = total_transfers / concurrency;

    println!(
        "\n[2/4] Executing {total_transfers} concurrent transfers across {concurrency} async workers..."
    );

    let histogram = Arc::new(Mutex::new(
        Histogram::<u64>::new_with_bounds(1, 60_000, 3).expect("Failed to create histogram"),
    ));
    let posted_count = Arc::new(AtomicUsize::new(0));
    let replayed_count = Arc::new(AtomicUsize::new(0));
    let failed_count = Arc::new(AtomicUsize::new(0));

    let start_time = Instant::now();
    let mut handles = Vec::new();

    for worker_idx in 0..concurrency {
        let transfer_svc = transfer_svc.clone();
        let account_ids = account_ids.clone();
        let histogram = histogram.clone();
        let posted_count = posted_count.clone();
        let replayed_count = replayed_count.clone();
        let failed_count = failed_count.clone();
        let batch_id = bench_batch_id.clone();

        handles.push(tokio::spawn(async move {
            for j in 0..transfers_per_worker {
                // Replay test: every 5th transfer replays the exact same payload with same idempotency key
                let is_replay = j > 0 && j % 5 == 0;
                let (src, dst, amount, idem_key) = if is_replay {
                    let prev_j = j - 1;
                    let prev_src_idx = (worker_idx + prev_j) % account_ids.len();
                    let prev_dst_idx = (prev_src_idx + 1 + (prev_j % 3)) % account_ids.len();
                    let prev_amount = Decimal::from((prev_j % 50 + 1) * 10);
                    let prev_key = format!("bench-tx-{}-{}-{}", batch_id, worker_idx, prev_j);
                    (
                        account_ids[prev_src_idx],
                        account_ids[prev_dst_idx],
                        prev_amount,
                        prev_key,
                    )
                } else {
                    let src_idx = (worker_idx + j) % account_ids.len();
                    let dst_idx = (src_idx + 1 + (j % 3)) % account_ids.len();
                    let amount = Decimal::from((j % 50 + 1) * 10);
                    let key = format!("bench-tx-{}-{}-{}", batch_id, worker_idx, j);
                    (account_ids[src_idx], account_ids[dst_idx], amount, key)
                };

                let tx_start = Instant::now();
                let res = transfer_svc
                    .post_transfer(
                        PostTransferRequest {
                            source_account_id: src,
                            destination_account_id: dst,
                            amount,
                            currency: "USD".into(),
                            reference: None,
                            description: Some("Bench stress transfer".into()),
                            idempotency_key: Some(idem_key),
                        },
                        "benchmark_worker",
                    )
                    .await;

                let elapsed_ms = tx_start.elapsed().as_millis() as u64;

                match res {
                    Ok(outcome) => {
                        let mut hist = histogram.lock().await;
                        let _ = hist.record(elapsed_ms.max(1));
                        if outcome.replayed {
                            replayed_count.fetch_add(1, Ordering::Relaxed);
                        } else {
                            posted_count.fetch_add(1, Ordering::Relaxed);
                        }
                    }
                    Err(err) => {
                        failed_count.fetch_add(1, Ordering::Relaxed);
                        eprintln!("  [Worker {worker_idx}] Transfer failed: {err}");
                    }
                }
            }
        }));
    }

    for h in handles {
        h.await?;
    }

    let total_duration = start_time.elapsed();
    let total_sec = total_duration.as_secs_f64();
    let posted = posted_count.load(Ordering::Relaxed);
    let replayed = replayed_count.load(Ordering::Relaxed);
    let failed = failed_count.load(Ordering::Relaxed);
    let throughput = (posted + replayed) as f64 / total_sec;

    let hist = histogram.lock().await;

    println!("\n============================================================");
    println!("  BENCHMARK RESULTS SUMMARY");
    println!("============================================================");
    println!("  Total Processed:    {} operations", posted + replayed);
    println!("  - New Postings:     {} transactions", posted);
    println!("  - Replayed (Idem):  {} transactions", replayed);
    println!("  - Failures:         {} transactions", failed);
    println!("  Wall-Clock Time:    {:.2}s", total_sec);
    println!("  Throughput:         {:.1} ops/sec", throughput);
    println!("------------------------------------------------------------");
    println!("  LATENCY DISTRIBUTION (ms):");
    println!("  - Min:              {} ms", hist.min());
    println!("  - p50 (Median):     {} ms", hist.value_at_quantile(0.50));
    println!("  - p90:              {} ms", hist.value_at_quantile(0.90));
    println!("  - p95:              {} ms", hist.value_at_quantile(0.95));
    println!("  - p99:              {} ms", hist.value_at_quantile(0.99));
    println!("  - Max:              {} ms", hist.max());
    println!("============================================================");

    println!("\n[3/4] Triggering automated ledger reconciliation post-stress...");
    let recon_result = recon_svc
        .run_reconciliation("benchmark_post_run_audit")
        .await?;

    println!(
        "  Status:             {}",
        recon_result.summary.status.to_uppercase()
    );
    println!(
        "  Accounts Audited:   {}",
        recon_result.summary.accounts_checked
    );
    println!(
        "  Tx Audited:         {}",
        recon_result.summary.transactions_checked
    );
    println!(
        "  Entries Audited:    {}",
        recon_result.summary.entries_checked
    );
    println!(
        "  Violations:         {}",
        recon_result.summary.violation_count
    );

    if recon_result.summary.status != "passed" {
        eprintln!("\nCRITICAL: Invariants violated during concurrent stress test!");
        for v in recon_result.violations {
            eprintln!("  - [{}] {}", v.violation_type, v.message);
        }
        std::process::exit(1);
    }

    println!("\n[4/4] Invariant verification PASSED: Zero drift, zero data corruption.");
    println!("============================================================\n");

    Ok(())
}
