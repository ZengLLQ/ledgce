use ledgce_application::{
    AccountService, LedgerQueryService, OutboxService, ReconciliationService, SystemService,
    TransferService,
};
use ledgce_observability::PrometheusHandle;
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub accounts: AccountService,
    pub transfers: TransferService,
    pub queries: LedgerQueryService,
    pub reconciliation: ReconciliationService,
    pub outbox: OutboxService,
    pub system: SystemService,
    pub admin_token: String,
    pub reader_token: String,
    pub prometheus_handle: Option<PrometheusHandle>,
}

impl AppState {
    pub fn new(pool: PgPool, admin_token: String, reader_token: String) -> Self {
        let transfers = TransferService::new(pool.clone());
        let accounts = AccountService::new(pool.clone(), transfers.clone());
        let queries = LedgerQueryService::new(pool.clone());
        let reconciliation = ReconciliationService::new(pool.clone());
        let outbox = OutboxService::new(pool.clone());
        let system = SystemService::new(pool.clone());

        Self {
            pool,
            accounts,
            transfers,
            queries,
            reconciliation,
            outbox,
            system,
            admin_token,
            reader_token,
            prometheus_handle: None,
        }
    }

    pub fn with_prometheus(mut self, handle: Option<PrometheusHandle>) -> Self {
        self.prometheus_handle = handle;
        self
    }
}
