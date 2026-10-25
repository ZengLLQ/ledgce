use sqlx::PgPool;
use std::str::FromStr;
use uuid::Uuid;

use ledgce_domain::Currency;

use crate::error::AppError;
use crate::model::{
    AccountDetail, AccountFilter, AccountPage, AccountTotals, AccountView, CreateAccountRequest,
    InitOpeningBalanceRequest, PostTransferRequest, TransferOutcome,
};
use crate::transfer::TransferService;

#[derive(Clone)]
pub struct AccountService {
    pool: PgPool,
    transfer_service: TransferService,
}

impl AccountService {
    pub fn new(pool: PgPool, transfer_service: TransferService) -> Self {
        Self {
            pool,
            transfer_service,
        }
    }

    /// Creates a new customer or system account.
    /// The database trigger `accounts_create_balance` atomically initializes the `account_balances` projection.
    pub async fn create_account(
        &self,
        req: CreateAccountRequest,
        actor: &str,
    ) -> Result<AccountView, AppError> {
        let currency = Currency::from_str(&req.currency)?;
        let kind = req.kind.unwrap_or_else(|| "customer".into());
        if kind != "customer" && kind != "system" {
            return Err(AppError::Validation(
                "Account kind must be either 'customer' or 'system'".into(),
            ));
        }

        let id = Uuid::now_v7();
        let synthetic = req.synthetic.unwrap_or(true);

        sqlx::query!(
            r#"
            INSERT INTO accounts (id, code, name, kind, currency, status, synthetic, created_at)
            VALUES ($1, $2, $3, $4, $5, 'active', $6, now())
            "#,
            id,
            req.code,
            req.name,
            kind,
            currency.code(),
            synthetic
        )
        .execute(&self.pool)
        .await
        .map_err(|err| {
            if let Some(db_err) = err.as_database_error() {
                if db_err.code() == Some("23505".into()) {
                    return AppError::Conflict(format!(
                        "Account with code '{}' already exists",
                        req.code
                    ));
                }
            }
            AppError::Database(err)
        })?;

        let audit_id = Uuid::now_v7();
        let detail = serde_json::json!({
            "code": req.code,
            "kind": kind,
            "currency": currency.code(),
        });
        sqlx::query!(
            r#"
            INSERT INTO audit_events (id, actor, action, entity_type, entity_id, detail, occurred_at)
            VALUES ($1, $2, 'create_account', 'account', $3, $4, now())
            "#,
            audit_id,
            actor,
            id.to_string(),
            detail
        )
        .execute(&self.pool)
        .await?;

        self.get_account_view(id).await
    }

    /// Retrieves an account view by ID.
    pub async fn get_account_view(&self, id: Uuid) -> Result<AccountView, AppError> {
        sqlx::query_as(
            r#"
            SELECT
                a.id,
                a.code,
                a.name,
                a.kind,
                a.currency,
                a.status,
                a.synthetic,
                ab.balance,
                ab.version AS balance_version,
                a.created_at
            FROM accounts a
            JOIN account_balances ab ON ab.account_id = a.id
            WHERE a.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Account {} not found", id)))
    }

    /// Retrieves a detailed account view including totals and live journal reconciliation.
    pub async fn get_account(&self, id: Uuid) -> Result<AccountDetail, AppError> {
        let account = self.get_account_view(id).await?;

        let totals: AccountTotals = sqlx::query_as(
            r#"
            SELECT
                COALESCE(SUM(debit), 0) AS total_debits,
                COALESCE(SUM(credit), 0) AS total_credits,
                COUNT(*) AS entry_count
            FROM journal_entries
            WHERE account_id = $1
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        let journal_balance = totals.total_credits - totals.total_debits;
        let projection_matches_journal = account.balance == journal_balance;

        Ok(AccountDetail {
            account,
            totals,
            journal_balance,
            projection_matches_journal,
        })
    }

    /// Retrieves an account detail by its unique business code.
    pub async fn get_account_by_code(&self, code: &str) -> Result<AccountDetail, AppError> {
        let id: Uuid = sqlx::query_scalar("SELECT id FROM accounts WHERE code = $1")
            .bind(code)
            .fetch_optional(&self.pool)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Account code '{}' not found", code)))?;

        self.get_account(id).await
    }

    /// Lists accounts with filtering and pagination.
    pub async fn list_accounts(&self, filter: AccountFilter) -> Result<AccountPage, AppError> {
        let page = filter.page.unwrap_or(1).max(1);
        let page_size = filter.page_size.unwrap_or(20).clamp(1, 100);
        let offset = (page - 1) * page_size;

        let search_pattern = filter.search.as_ref().map(|s| format!("%{}%", s));

        let total: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(*)
            FROM accounts a
            WHERE ($1::text IS NULL OR a.code ILIKE $1 OR a.name ILIKE $1)
              AND ($2::text IS NULL OR a.kind = $2)
              AND ($3::text IS NULL OR a.currency = $3)
              AND ($4::text IS NULL OR a.status = $4)
            "#,
        )
        .bind(&search_pattern)
        .bind(&filter.kind)
        .bind(&filter.currency)
        .bind(&filter.status)
        .fetch_one(&self.pool)
        .await?;

        let items: Vec<AccountView> = sqlx::query_as(
            r#"
            SELECT
                a.id,
                a.code,
                a.name,
                a.kind,
                a.currency,
                a.status,
                a.synthetic,
                ab.balance,
                ab.version AS balance_version,
                a.created_at
            FROM accounts a
            JOIN account_balances ab ON ab.account_id = a.id
            WHERE ($1::text IS NULL OR a.code ILIKE $1 OR a.name ILIKE $1)
              AND ($2::text IS NULL OR a.kind = $2)
              AND ($3::text IS NULL OR a.currency = $3)
              AND ($4::text IS NULL OR a.status = $4)
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT $5 OFFSET $6
            "#,
        )
        .bind(&search_pattern)
        .bind(&filter.kind)
        .bind(&filter.currency)
        .bind(&filter.status)
        .bind(page_size)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        Ok(AccountPage {
            items,
            total,
            page,
            page_size,
        })
    }

    /// Gets or creates the system equity account for the given currency.
    /// System equity accounts allow negative balances to model ledger seed capital.
    pub async fn get_or_create_system_equity(
        &self,
        currency: Currency,
    ) -> Result<AccountView, AppError> {
        let code = format!("SYSTEM:EQUITY:{}", currency.code());
        if let Ok(account) = self.get_account_by_code(&code).await {
            return Ok(account.account);
        }

        let name = format!("Ledgce System Equity ({})", currency.code());
        let id = Uuid::now_v7();

        let row = sqlx::query!(
            r#"
            INSERT INTO accounts (id, code, name, kind, currency, status, synthetic, created_at)
            VALUES ($1, $2, $3, 'system', $4, 'active', false, now())
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            "#,
            id,
            code,
            name,
            currency.code()
        )
        .fetch_one(&self.pool)
        .await?;

        self.get_account_view(row.id).await
    }

    /// Injects an opening balance into an account by executing a double-entry
    /// transfer from the designated System Equity account.
    pub async fn init_opening_balance(
        &self,
        req: InitOpeningBalanceRequest,
        principal: &str,
    ) -> Result<TransferOutcome, AppError> {
        let target = self.get_account_view(req.account_id).await?;
        let currency = Currency::from_str(&target.currency)?;

        let system_equity = self.get_or_create_system_equity(currency).await?;

        let transfer_req = PostTransferRequest {
            source_account_id: system_equity.id,
            destination_account_id: target.id,
            amount: req.amount,
            currency: target.currency,
            reference: req
                .reference
                .or_else(|| Some(format!("INIT-{}", target.code))),
            description: Some(format!("Opening balance injection for {}", target.code)),
            idempotency_key: req.idempotency_key,
        };

        self.transfer_service
            .post_transfer(transfer_req, principal)
            .await
    }
}
