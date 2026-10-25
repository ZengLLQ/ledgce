# Ledgce Frontend Architecture

## 1. Architectural Principles

The Ledgce web application is designed as an operational command deck for high-integrity financial ledger management. It strictly adheres to:

1. **Non-Authoritative Frontend**: The browser never computes financial state. All balances, double-entry journal proofs, invariant checks, and idempotency validations are authoritatively determined and returned by the Rust Axum backend.
2. **String-Preserved Monetary Values**: Money is received and handled as exact decimal strings (e.g. `"145000.50"`), never parsed into floating-point numbers (`f64` / JavaScript `Number`) for authoritative operations.
3. **Optimistic Updates Prohibited on Writes**: Financial transactions and reversals are NEVER optimistically assumed to succeed. The UI transitions from pending submission directly to backend confirmation or error.
4. **URL-Persisted Route State**: All public and operational routes are first-class URL paths (`/platform`, `/architecture`, `/app/accounts`, `/app/transfers`, `/app/ledger`, etc.) supporting browser navigation, bookmarking, and deep links.

---

## 2. Directory & Modular Organization

```text
frontend/src/
├── api/
│   └── client.ts             # Strongly typed REST client with proxy fallback
├── components/
│   ├── charts/               # Recharts telemetry graphs (monochromatic)
│   ├── graphics/             # Technical SVG diagrams (LedgceVisuals)
│   ├── layout/               # Shell, Topbar, Sidebar, StatusPill
│   └── ui/                   # Reusable design system primitives (Button, Card, Table, Modal, Tabs, Toast)
├── views/                    # First-class views for all required routes
│   ├── LandingView.tsx       # / - Product storytelling & cinematic hero
│   ├── PlatformView.tsx      # /platform - Engine capabilities
│   ├── ArchitectureView.tsx  # /architecture - C4 diagrams & data flows
│   ├── SecurityView.tsx      # /security - Threat model & guarantees
│   ├── DocsView.tsx          # /docs - API contracts & invariant specs
│   ├── LoginView.tsx         # /login - Dev token authorization
│   ├── OverviewView.tsx      # /app/overview - Platform telemetry
│   ├── AccountsView.tsx      # /app/accounts - Account & vault management
│   ├── TransfersView.tsx     # /app/transfers - Transfer postings & reversals
│   ├── TransactionsView.tsx  # /app/transactions - Transaction history & inspection
│   ├── ExplorerView.tsx      # /app/ledger - Immutable journal explorer
│   ├── OutboxView.tsx        # /app/events - Outbox event stream
│   ├── ReconciliationView.tsx# /app/reconciliation - Invariant audit engine
│   ├── SystemHealthView.tsx  # /app/observability - Fleet health & fault injection
│   └── SettingsView.tsx      # /app/settings - Local configuration & tokens
└── types/
    └── api.ts                # TypeScript interfaces mirroring Rust domain DTOs
```
