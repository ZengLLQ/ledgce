import React from 'react';
import {
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  Database,
  Lock,
  GitCommit,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { ViewRoute } from '../types/api';

interface LandingViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section: SpaceX / Starlink cinematic authority */}
      <section className="relative pt-6 pb-12 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="accent" dot size="md">
            FINANCIAL ENGINE SPECIFICATION
          </Badge>
          <span className="text-xs font-mono text-[#9BA5BC]">POSTGRESQL 16 · RUST</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#F4F6FC] leading-[1.08] max-w-4xl">
          MATHEMATICAL CERTAINTY FOR MODERN LEDGERS.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#9BA5BC] max-w-2xl leading-relaxed">
          Ledgce is an autonomous, mission-critical double-entry accounting engine built with
          uncompromising architectural guarantees: immutable append-only journals, zero-sum
          currency conservation, transactional outbox delivery, and continuous invariant verification.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => onNavigate('overview')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Launch Overview
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => onNavigate('transfers')}
          >
            Submit Transfer
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigate('reconciliation')}
            icon={<Shield className="w-4 h-4 text-[#35D6A0]" />}
          >
            Run Invariant Audit
          </Button>
        </div>

        {/* Live architectural indicators */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/[0.06]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9BA5BC]">
              INVARIANT GUARANTEE
            </span>
            <div className="text-xl font-bold font-mono text-[#35D6A0] mt-1 tabular-nums">
              Σ(debit) - Σ(credit) = 0
            </div>
            <p className="text-[11px] text-[#9BA5BC]/80 mt-1">Multi-currency zero-sum theorem</p>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9BA5BC]">
              CONCURRENCY CONTROL
            </span>
            <div className="text-xl font-bold font-mono text-[#F4F6FC] mt-1">
              Deterministic Locks
            </div>
            <p className="text-[11px] text-[#9BA5BC]/80 mt-1">UUID sorting dead-lock immunity</p>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9BA5BC]">
              DUAL-WRITE PREVENTION
            </span>
            <div className="text-xl font-bold font-mono text-[#526CFF] mt-1">
              Transactional Outbox
            </div>
            <p className="text-[11px] text-[#9BA5BC]/80 mt-1">Atomic 2-phase ledger commits</p>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9BA5BC]">
              IDEMPOTENCY LIFECYCLE
            </span>
            <div className="text-xl font-bold font-mono text-[#F2B85C] mt-1">
              SHA-256 Hashing
            </div>
            <p className="text-[11px] text-[#9BA5BC]/80 mt-1">Payload fingerprint validation</p>
          </div>
        </div>
      </section>

      {/* 5 Invariant Pillars */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#F4F6FC]">
              Core Architectural Pillars
            </h2>
            <p className="text-xs text-[#9BA5BC] mt-1">
              Every design decision enforces zero financial drift under any hardware, network, or process fault.
            </p>
          </div>
          <Badge variant="neutral">Formal Verification</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="hover:border-[#526CFF]/40 transition-colors">
            <div className="w-10 h-10 rounded-md bg-[#526CFF]/15 border border-[#526CFF]/30 flex items-center justify-center text-[#526CFF] mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#F4F6FC]">
              1. Append-Only Immutable Journal
            </h3>
            <p className="text-xs text-[#9BA5BC] mt-2 leading-relaxed">
              No account balance is ever overwritten directly. Every balance change originates as an
              immutable double-entry pair with strictly ascending sequence numbers and cryptographic
              audit trails.
            </p>
            <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#7588FF]">
              TABLE journal_entries (IMMUTABLE)
            </div>
          </Card>

          <Card className="hover:border-[#35D6A0]/40 transition-colors">
            <div className="w-10 h-10 rounded-md bg-[#35D6A0]/15 border border-[#35D6A0]/30 flex items-center justify-center text-[#35D6A0] mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#F4F6FC]">
              2. Atomic Balance Projections
            </h3>
            <p className="text-xs text-[#9BA5BC] mt-2 leading-relaxed">
              Fast lookups utilize an inline projection table synchronized atomically inside the same
              database transaction via triggers. The continuous reconciliation auditor proves projection ≡ journal.
            </p>
            <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#35D6A0]">
              TRIGGER accounts_create_balance
            </div>
          </Card>

          <Card className="hover:border-[#F2B85C]/40 transition-colors">
            <div className="w-10 h-10 rounded-md bg-[#F2B85C]/15 border border-[#F2B85C]/30 flex items-center justify-center text-[#F2B85C] mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#F4F6FC]">
              3. Guaranteed Outbox Delivery
            </h3>
            <p className="text-xs text-[#9BA5BC] mt-2 leading-relaxed">
              Downstream subscribers receive events through a transactional outbox queue with lease
              fencing, exponential retry backoff, and dead-letter safety. Zero dual-write inconsistencies.
            </p>
            <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-[#F2B85C]">
              SKIP LOCKED · Lease Duration 30s
            </div>
          </Card>
        </div>
      </section>

      {/* System Flow Diagram / ASCII & Interactive Stepper */}
      <section className="p-6 rounded-xl bg-[#111522] border border-white/[0.08] relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-[#526CFF]" />
            <div>
              <h3 className="text-base font-semibold text-[#F4F6FC]">
                Atomic Transfer Execution Pipeline
              </h3>
              <p className="text-xs text-[#9BA5BC]">
                How Ledgce safely executes transfers across concurrency boundaries
              </p>
            </div>
          </div>
          <Badge variant="positive" dot>
            Zero-Drift Certified
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#171C2C] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono text-[#9BA5BC] mb-2">
              <span>STEP 01</span>
              <Lock className="w-3.5 h-3.5 text-[#526CFF]" />
            </div>
            <h4 className="text-xs font-semibold text-[#F4F6FC]">Idempotency & Hash Fingerprint</h4>
            <p className="text-[11px] text-[#9BA5BC] mt-1.5 leading-relaxed">
              Compute SHA-256 hash of payload. Check idempotency table. If replayed with identical
              hash, return previous outcome; if conflicting, abort with HTTP 409.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#171C2C] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono text-[#9BA5BC] mb-2">
              <span>STEP 02</span>
              <GitCommit className="w-3.5 h-3.5 text-[#526CFF]" />
            </div>
            <h4 className="text-xs font-semibold text-[#F4F6FC]">Deterministic Row Locking</h4>
            <p className="text-[11px] text-[#9BA5BC] mt-1.5 leading-relaxed">
              Sort account UUIDs lexicographically and issue <code>SELECT FOR UPDATE</code>. Eliminate
              deadlocks when two transfers execute concurrently between reverse accounts.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#171C2C] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono text-[#9BA5BC] mb-2">
              <span>STEP 03</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#35D6A0]" />
            </div>
            <h4 className="text-xs font-semibold text-[#F4F6FC]">Balanced Journal Insertion</h4>
            <p className="text-[11px] text-[#9BA5BC] mt-1.5 leading-relaxed">
              Write Debit and Credit entries. Verify balance sufficiency for customer accounts. Write
              transaction summary and stage event in outbox in the same atomic block.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#171C2C] border border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono text-[#9BA5BC] mb-2">
              <span>STEP 04</span>
              <Sparkles className="w-3.5 h-3.5 text-[#F2B85C]" />
            </div>
            <h4 className="text-xs font-semibold text-[#F4F6FC]">Outbox Worker Dispatch</h4>
            <p className="text-[11px] text-[#9BA5BC] mt-1.5 leading-relaxed">
              Worker claims batches using <code>FOR UPDATE SKIP LOCKED</code> with lease tokens. On
              successful external publication, status transitions from pending to published.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Launch CTA */}
      <section className="p-8 rounded-xl bg-gradient-to-r from-[#111522] via-[#171C2C] to-[#111522] border border-[#526CFF]/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-[#F4F6FC]">
            Ready to explore the active ledger system?
          </h3>
          <p className="text-xs text-[#9BA5BC] mt-1">
            Inspect real accounts, monitor outbox workers, or trigger an on-demand reconciliation audit.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" onClick={() => onNavigate('accounts')}>
            View Accounts
          </Button>
          <Button variant="primary" onClick={() => onNavigate('overview')}>
            Open Overview
          </Button>
        </div>
      </section>
    </div>
  );
};
