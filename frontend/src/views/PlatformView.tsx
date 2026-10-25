import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  ArrowRight,
  RefreshCw,
  GitCommit,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { ViewRoute } from '../types/api';

interface PlatformViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const PlatformView: React.FC<PlatformViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full text-white select-none font-neodin py-12 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-raised border border-border text-[11px] font-mono tracking-widest uppercase text-text-secondary mb-4">
          LEDGCE PLATFORM CAPABILITIES
        </div>
        <h1 className="text-din-h1 text-white uppercase tracking-tight">
          Engineered for Mathematical Invariant Preservation
        </h1>
        <p className="mt-4 text-base text-text-secondary max-w-3xl leading-relaxed">
          Ledgce is not a generic accounting wrapper. It is a distributed financial state engine built to withstand network partitions, concurrent execution storms, and worker failovers without a single cent of accounting drift.
        </p>
      </div>

      {/* 6 Core Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="w-8 h-8 rounded bg-surface-raised border border-border flex items-center justify-center text-white">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase font-sans">1. Double-Entry Posting</h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Every transaction is composed of balanced debit and credit journal legs (&Sigma; debits = &Sigma; credits). Single-sided postings are rejected by both domain models and PostgreSQL constraint triggers.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="w-8 h-8 rounded bg-surface-raised border border-border flex items-center justify-center text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase font-sans">2. Strict Immutability</h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Posted journal entries and transaction records cannot be modified or deleted. Direct SQL updates or deletes raise trigger errors. Corrections are executed exclusively via compensating reversal transactions.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="w-8 h-8 rounded bg-surface-raised border border-border flex items-center justify-center text-white">
            <GitCommit className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase font-sans">3. Deadlock-Free Concurrency</h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            To prevent database deadlocks under high-concurrency multi-threaded transfers, accounts and balance projections are sorted deterministically by UUID ascending before row locks are acquired.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="w-8 h-8 rounded bg-surface-raised border border-border flex items-center justify-center text-white">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase font-sans">4. Transactional Outbox</h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Eliminates dual-write anomalies. Mutations and downstream domain events are committed in a single ACID transaction. Workers claim events using PostgreSQL `FOR UPDATE SKIP LOCKED`.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="w-8 h-8 rounded bg-surface-raised border border-border flex items-center justify-center text-white">
            <RefreshCw className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase font-sans">5. Automated Reconciliation</h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Independent background sweeps verify that all customer and system balances sum to zero, detect projection drift against full historical journal sums, and flag anomalies without mutating records.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="w-8 h-8 rounded bg-surface-raised border border-border flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase font-sans">6. Payload-Verified Idempotency</h3>
          <p className="text-xs text-text-secondary leading-relaxed font-mono">
            Write requests require an idempotency key hashed against the canonical request body (SHA-256). Replays return the committed transaction safely; payload tampering triggers immediate rejection.
          </p>
        </div>
      </div>

      {/* Comparison Matrix (Starlink Service Plans Style) */}
      <div className="rounded-lg bg-surface border border-border p-8">
        <h3 className="text-xl font-bold uppercase text-white font-sans mb-6">
          Architectural Invariant Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-3 uppercase">Property</th>
                <th className="pb-3 uppercase">Generic Fintech / SaaS CRUD</th>
                <th className="pb-3 uppercase text-white">Ledgce Distributed Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 text-text-primary">Ledger Model</td>
                <td className="py-3 text-text-muted">Single-entry mutable account balance</td>
                <td className="py-3 text-white font-bold">Double-entry append-only balanced journal</td>
              </tr>
              <tr>
                <td className="py-3 text-text-primary">Money Arithmetic</td>
                <td className="py-3 text-text-muted">IEEE 754 Floating point (rounding drift)</td>
                <td className="py-3 text-white font-bold">Exact decimal (NUMERIC 28,8)</td>
              </tr>
              <tr>
                <td className="py-3 text-text-primary">Event Publishing</td>
                <td className="py-3 text-text-muted">Dual-write API to message broker (fragile)</td>
                <td className="py-3 text-white font-bold">Transactional Outbox with SKIP LOCKED lease</td>
              </tr>
              <tr>
                <td className="py-3 text-text-primary">Deadlock Prevention</td>
                <td className="py-3 text-text-muted">Random retries on 40P01 deadlocks</td>
                <td className="py-3 text-white font-bold">Deterministic UUID ASC lock ordering</td>
              </tr>
              <tr>
                <td className="py-3 text-text-primary">Auditability</td>
                <td className="py-3 text-text-muted">Application logs (ephemeral, editable)</td>
                <td className="py-3 text-white font-bold">Trigger-enforced immutable database events</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="primary" size="lg" onClick={() => onNavigate('overview')}>
          Launch Ledger Operations
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button variant="outline" size="lg" onClick={() => onNavigate('architecture')}>
          Inspect Architecture Specification
        </Button>
      </div>
    </div>
  );
};
