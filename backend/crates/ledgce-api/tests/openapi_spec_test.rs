use ledgce_api::openapi::ApiDoc;
use utoipa::OpenApi;

#[test]
fn test_openapi_spec_generation() {
    let spec = ApiDoc::openapi();

    // Verify info
    assert_eq!(spec.info.title, "Ledgce Core Ledger API");
    assert_eq!(spec.info.version, "0.1.0");

    // Verify paths exist
    let paths = &spec.paths.paths;
    assert!(paths.contains_key("/api/v1/health"), "Missing /api/v1/health");
    assert!(paths.contains_key("/api/v1/overview"), "Missing /api/v1/overview");
    assert!(paths.contains_key("/api/v1/accounts"), "Missing /api/v1/accounts");
    assert!(paths.contains_key("/api/v1/accounts/{id}"), "Missing /api/v1/accounts/{{id}}");
    assert!(paths.contains_key("/api/v1/accounts/opening-balance"), "Missing /api/v1/accounts/opening-balance");
    assert!(paths.contains_key("/api/v1/transfers"), "Missing /api/v1/transfers");
    assert!(paths.contains_key("/api/v1/transfers/{id}"), "Missing /api/v1/transfers/{{id}}");
    assert!(paths.contains_key("/api/v1/transfers/reversal"), "Missing /api/v1/transfers/reversal");
    assert!(paths.contains_key("/api/v1/ledger/entries"), "Missing /api/v1/ledger/entries");
    assert!(paths.contains_key("/api/v1/reconciliation/run"), "Missing /api/v1/reconciliation/run");
    assert!(paths.contains_key("/api/v1/reconciliation/runs"), "Missing /api/v1/reconciliation/runs");
    assert!(paths.contains_key("/api/v1/reconciliation/runs/{id}"), "Missing /api/v1/reconciliation/runs/{{id}}");
    assert!(paths.contains_key("/api/v1/outbox/events"), "Missing /api/v1/outbox/events");
    assert!(paths.contains_key("/api/v1/outbox/events/{id}/requeue"), "Missing /api/v1/outbox/events/{{id}}/requeue");
    assert!(paths.contains_key("/api/v1/outbox/process-batch"), "Missing /api/v1/outbox/process-batch");
    assert!(paths.contains_key("/api/v1/system/health"), "Missing /api/v1/system/health");
    assert!(paths.contains_key("/api/v1/system/faults/arm"), "Missing /api/v1/system/faults/arm");
    assert!(paths.contains_key("/api/v1/system/faults/clear"), "Missing /api/v1/system/faults/clear");

    // Verify components schemas
    let components = spec.components.as_ref().expect("components must exist");
    assert!(components.schemas.contains_key("AccountView"));
    assert!(components.schemas.contains_key("AccountDetail"));
    assert!(components.schemas.contains_key("TransactionSummary"));
    assert!(components.schemas.contains_key("TransactionDetail"));
    assert!(components.schemas.contains_key("TransferOutcome"));
    assert!(components.schemas.contains_key("ReconciliationRunDetail"));
    assert!(components.schemas.contains_key("SystemHealthView"));

    // Verify security scheme
    assert!(components.security_schemes.contains_key("bearer_auth"));

    // Serialize to JSON to confirm serializability
    let json_str = spec.to_json().expect("OpenAPI spec must serialize cleanly to JSON");
    assert!(!json_str.is_empty());
}
