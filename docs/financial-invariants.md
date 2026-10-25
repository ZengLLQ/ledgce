# Ledgce Financial Invariants & Correctness Proofs

## 1. Mathematical Formalism

Let $\mathcal{A}$ be the set of all accounts, and $\mathcal{J}$ be the set of all posted journal entries.
Each journal entry $j \in \mathcal{J}$ is defined by:
$$j = (\text{id}, \text{account\_id}, \text{transaction\_id}, c, d, k, t)$$
where $c \in \{\text{USD}, \text{EUR}, \text{IDR}\}$ is currency, $d \ge 0$ is debit, $k \ge 0$ is credit, and $t$ is timestamp.

---

### Invariant 1: Double-Entry Zero Sum
For any transaction $\tau$:
$$\sum_{j \in \mathcal{J}_\tau} d_j = \sum_{j \in \mathcal{J}_\tau} k_j$$
Summed over all transactions in the ledger for any given currency $c$:
$$\sum_{j \in \mathcal{J}_c} d_j = \sum_{j \in \mathcal{J}_c} k_j \implies \sum_{a \in \mathcal{A}_c} \text{balance}(a) = 0$$

### Invariant 2: Balance Projection Identity
For any account $a \in \mathcal{A}$:
$$\text{account\_balances.balance}(a) \equiv \sum_{j \in \mathcal{J}_a} k_j - \sum_{j \in \mathcal{J}_a} d_j$$
This equality is updated atomically by database trigger `journal_entries_apply_balance` and verified during each reconciliation run.

### Invariant 3: Customer Non-Negative Balance
For all customer accounts $a \in \mathcal{A}_{\text{customer}}$:
$$\text{balance}(a) \ge 0$$
Enforced by Postgres table constraint: `CHECK (is_system OR balance >= 0)`.

### Invariant 4: Forward-Only Transaction Lifecycle
For any transaction $\tau$, the status transition sequence is strictly monotonic:
$$\text{posted} \xrightarrow{\text{worker claim}} \text{published} \xrightarrow{\text{downstream ack}} \text{processed}$$
Invalid transitions (e.g. `processed` $\to$ `posted`, or `posted` $\to$ `processed` skipping `published`) are rejected with Postgres error code `P0001`.

### Invariant 5: Idempotency Key Invariance
For any principal $p$ and key $\kappa$:
$$f(p, \kappa, \text{payload}_1) = \tau_1$$
Subsequent invocation:
$$f(p, \kappa, \text{payload}_2) = \begin{cases} \tau_1 & \text{if } \text{SHA-256}(\text{payload}_2) = \text{SHA-256}(\text{payload}_1) \\ \text{Error}(\text{IdempotencyKeyReuse}) & \text{otherwise} \end{cases}$$
