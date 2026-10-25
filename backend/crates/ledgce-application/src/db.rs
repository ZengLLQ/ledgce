use sqlx::migrate::MigrateError;
use sqlx::PgPool;

pub static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!("../../../migrations");

pub async fn run_migrations(pool: &PgPool) -> Result<(), MigrateError> {
    MIGRATOR.run(pool).await
}
