import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Cpu,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { ViewRoute } from '../types/api';

interface ArchitectureViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full text-white select-none font-neodin py-12 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-raised border border-border text-[11px] font-mono tracking-widest uppercase text-text-secondary mb-4">
          SYSTEM TOPOLOGY &amp; DATA FLOW
        </div>
        <h1 className="text-din-h1 text-white uppercase tracking-tight">
          C4 Architecture &amp; Execution Pipeline
        </h1>
        <p className="mt-4 text-base text-text-secondary max-w-3xl leading-relaxed">
          Ledgce is architected as a modular monolith in Rust. It cleanly decouples pure domain invariants from application services, PostgreSQL transactional persistence, and background outbox leasing loops.
        </p>
      </div>

      {/* C4 Container Flow Diagram (Monochromatic Precision) */}
      <div className="rounded-lg bg-surface border border-border p-8 space-y-8">
        <h3 className="text-lg font-bold uppercase text-white font-sans">
          Synchronous &amp; Asynchronous Request Paths
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          {/* Box 1 */}
          <div className="p-5 rounded bg-background border border-border space-y-2">
            <div className="text-text-muted text-[10px]">TIER 1 · CLIENT</div>
            <div className="text-sm font-bold text-white font-sans">Web Workspace</div>
            <div className="text-text-secondary">
              Vite dev proxy injects Bearer credentials server-side. Decimal amounts sent as exact strings.
            </div>
            <div className="text-[10px] text-text-muted pt-2 border-t border-border">
              HTTP POST /api/v1/transfers
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-5 rounded bg-background border border-border space-y-2">
            <div className="text-text-muted text-[10px]">TIER 2 · REST API</div>
            <div className="text-sm font-bold text-white font-sans">Axum Service</div>
            <div className="text-text-secondary">
              Auth middleware validates role (`Role::Admin`). Canonical request hashed (SHA-256) for idempotency.
            </div>
            <div className="text-[10px] text-text-muted pt-2 border-t border-border">
              Utoipa OpenAPI · JSON Tracing
            </div>
          </div>

          {/* Box 3 */}
          <div className="p-5 rounded bg-background border border-border space-y-2">
            <div className="text-text-muted text-[10px]">TIER 3 · DOMAIN &amp; APP</div>
            <div className="text-sm font-bold text-white font-sans">Ledgce Engine</div>
            <div className="text-text-secondary">
              Sorts UUIDs ascending. Acquires row locks. Validates non-negative balance and zero-sum invariant.
            </div>
            <div className="text-[10px] text-text-muted pt-2 border-t border-border">
              TransferService · AccountService
            </div>
          </div>

          {/* Box 4 */}
          <div className="p-5 rounded bg-background border border-border space-y-2">
            <div className="text-text-muted text-[10px]">TIER 4 · DATA STORE</div>
            <div className="text-sm font-bold text-white font-sans">PostgreSQL 17</div>
            <div className="text-text-secondary">
              Single ACID commit: transactions, journal legs, balance projection, outbox event, and audit trace.
            </div>
            <div className="text-[10px] text-text-muted pt-2 border-t border-border">
              Trigger constraints · Append-only
            </div>
          </div>
        </div>

        {/* Asynchronous Path */}
        <div className="p-6 rounded bg-surface-raised border border-border font-mono text-xs space-y-4">
          <div className="text-xs font-bold uppercase text-white font-sans flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Asynchronous Outbox Delivery Pipeline
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded bg-background border border-border">
              <span className="text-text-muted text-[10px]">STEP 1 · POLL &amp; LEASE</span>
              <p className="text-text-secondary mt-1">
                `SELECT id FROM outbox_events WHERE status = 'pending' ORDER BY seq ASC FOR UPDATE SKIP LOCKED LIMIT 25`
              </p>
            </div>
            <div className="p-4 rounded bg-background border border-border">
              <span className="text-text-muted text-[10px]">STEP 2 · DISPATCH</span>
              <p className="text-text-secondary mt-1">
                Background worker (`ledgce-worker`) processes event with 30s TTL lease and records node heartbeat.
              </p>
            </div>
            <div className="p-4 rounded bg-background border border-border">
              <span className="text-text-muted text-[10px]">STEP 3 · TRANSITION</span>
              <p className="text-text-secondary mt-1">
                Success updates state to `published`. Exponential backoff on transient errors; transitions to `dead` after 6 attempts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deadlock Elimination Specification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-lg bg-surface border border-border space-y-4">
          <h3 className="text-lg font-bold uppercase text-white font-sans">
            Mathematical Deadlock Prevention
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            When two concurrent transfers cross-transfer funds between Account A and Account B simultaneously:
          </p>
          <div className="p-4 rounded bg-background border border-border font-mono text-xs text-text-muted space-y-2">
            <div><span className="text-white">Thread 1:</span> Transfer A -&gt; B</div>
            <div><span className="text-white">Thread 2:</span> Transfer B -&gt; A</div>
            <div className="pt-2 text-text-secondary border-t border-border">
              Without ordering: Thread 1 locks A, waits for B. Thread 2 locks B, waits for A -&gt; <span className="text-white font-bold">DEADLOCK (40P01)</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Ledgce mandates lexicographical UUID sorting:
          </p>
          <div className="p-4 rounded bg-background border border-border font-mono text-xs text-white">
            let (first_id, second_id) = if id_a &lt; id_b &#123; (id_a, id_b) &#125; else &#123; (id_b, id_a) &#125;;<br />
            SELECT ... WHERE id IN ($1, $2) ORDER BY id ASC FOR UPDATE;
          </div>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-4">
          <h3 className="text-lg font-bold uppercase text-white font-sans">
            Transaction State Machine Lifecycle
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Ledgce transitions transactions through strict forward-only lifecycle states:
          </p>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded bg-background border border-border flex justify-between items-center">
              <div>
                <span className="font-bold text-white">1. POSTED</span>
                <span className="text-text-muted ml-2">— Atomic double-entry legs committed to journal</span>
              </div>
              <span className="text-[10px] text-text-muted">SYNCHRONOUS</span>
            </div>
            <div className="p-3 rounded bg-background border border-border flex justify-between items-center">
              <div>
                <span className="font-bold text-white">2. PUBLISHED</span>
                <span className="text-text-muted ml-2">— Outbox event claimed and delivered by worker</span>
              </div>
              <span className="text-[10px] text-text-muted">ASYNC WORKER</span>
            </div>
            <div className="p-3 rounded bg-background border border-border flex justify-between items-center">
              <div>
                <span className="font-bold text-white">3. PROCESSED</span>
                <span className="text-text-muted ml-2">— Downstream consumers confirmed idempotent ack</span>
              </div>
              <span className="text-[10px] text-text-muted">ASYNC WORKER</span>
            </div>
            <div className="p-3 rounded bg-background border border-border flex justify-between items-center">
              <div>
                <span className="font-bold text-white">4. REVERSED</span>
                <span className="text-text-muted ml-2">— Compensating opposite debit/credit legs committed</span>
              </div>
              <span className="text-[10px] text-text-muted">AUDIT ONLY</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="primary" size="lg" onClick={() => onNavigate('overview')}>
          Launch Operational Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button variant="outline" size="lg" onClick={() => onNavigate('security')}>
          Inspect Security &amp; Threat Model
        </Button>
      </div>
    </div>
  );
};
