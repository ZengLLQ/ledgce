use ledgce_domain::DomainError;

/// Application-level errors. `Database` carries the source for logs only; it is never shown to clients.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error(transparent)]
    Domain(#[from] DomainError),
    #[error("{0} not found")]
    NotFound(String),
    #[error("{0}")]
    Validation(String),
    #[error("idempotency key was already used with a different request payload")]
    IdempotencyKeyReuse,
    #[error("{0}")]
    Conflict(String),
    /// A concurrent transfer consumed the funds; detected by the database `CHECK (balance >= 0)` backstop.
    #[error("insufficient funds")]
    InsufficientFundsDetectedByDatabase,
    #[error("a database error occurred")]
    Database(#[source] sqlx::Error),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err)
    }
}

/// Postgres SQLSTATE / constraint helpers.
#[allow(dead_code)]
pub(crate) fn db_code(err: &sqlx::Error) -> Option<String> {
    err.as_database_error()
        .and_then(|e| e.code().map(|c| c.to_string()))
}

#[allow(dead_code)]
pub(crate) fn db_constraint(err: &sqlx::Error) -> Option<String> {
    err.as_database_error()
        .and_then(|e| e.constraint().map(str::to_owned))
}

impl AppError {
    /// Short machine-readable class used for metrics labels and structured logs.
    pub fn class(&self) -> &'static str {
        match self {
            AppError::Domain(DomainError::InsufficientFunds { .. })
            | AppError::InsufficientFundsDetectedByDatabase => "insufficient_funds",
            AppError::Domain(_) | AppError::Validation(_) => "validation",
            AppError::NotFound(_) => "not_found",
            AppError::IdempotencyKeyReuse => "idempotency_key_reuse",
            AppError::Conflict(_) => "conflict",
            AppError::Database(_) => "internal",
        }
    }
}
