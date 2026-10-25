import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  RefreshCw,
  Lock,
  GitBranch,
  Terminal,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  HeroLedgerMatrixGraphic,
  DoubleEntryIntegrityGraphic,
  TransactionalOutboxPipelineGraphic,
  AutomatedReconciliationGraphic,
} from '../components/graphics/LedgceVisuals';
import type { ViewRoute } from '../types/api';

interface LandingViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'double_entry' | 'outbox' | 'reconciliation'>('double_entry');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'IDR'>('USD');

  return (
    <div className="w-full text-white select-none font-neodin overflow-x-hidden bg-background">
      {/* =========================================================================
          SECTION 1: HERO (Cinematic Minimalist Technical Ledger Hero)
          ========================================================================= */}
      <section className="relative min-h-[90vh] flex flex-col justify-between pt-8 sm:pt-16 pb-20 px-6 sm:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle Ambient Ledger Matrix Visual */}
        <div className="absolute right-0 top-0 w-full lg:w-[60%] h-[640px] opacity-90 z-0 pointer-events-none">
          <HeroLedgerMatrixGraphic className="w-full h-full" />
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 max-w-2xl mt-6 sm:mt-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-raised border border-border text-[11px] font-mono tracking-widest uppercase text-text-secondary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Rust 1.85+ · PostgreSQL 17 · Distributed Systems
            </div>
            
            <h1 className="text-din-h1 sm:text-din-hero text-white tracking-tight uppercase leading-[1.02]">
              Financial state.<br />Precisely recorded.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-xl font-normal leading-relaxed">
              A transaction ledger engineered for mathematical consistency, double-entry auditability, and distributed financial processing.
            </p>
          </motion.div>

          {/* Interactive Specification Selector (Starlink Service Plans Style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-10 rounded-lg bg-surface p-6 max-w-xl border border-border"
          >
            {/* 3 Core Architecture Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('double_entry')}
                className={`p-3 rounded text-left transition-all border ${
                  activeTab === 'double_entry'
                    ? 'bg-surface-raised border-border-strong text-white'
                    : 'bg-background border-border text-text-muted hover:border-border-strong'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase tracking-wider">
                  Double-Entry
                </div>
                <div className="text-[10px] text-text-muted mt-1 leading-snug">
                  Σ debits = Σ credits
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('outbox')}
                className={`p-3 rounded text-left transition-all border ${
                  activeTab === 'outbox'
                    ? 'bg-surface-raised border-border-strong text-white'
                    : 'bg-background border-border text-text-muted hover:border-border-strong'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase tracking-wider">
                  Outbox Lease
                </div>
                <div className="text-[10px] text-text-muted mt-1 leading-snug">
                  SKIP LOCKED worker
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reconciliation')}
                className={`p-3 rounded text-left transition-all border ${
                  activeTab === 'reconciliation'
                    ? 'bg-surface-raised border-border-strong text-white'
                    : 'bg-background border-border text-text-muted hover:border-border-strong'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase tracking-wider">
                  Reconciliation
                </div>
                <div className="text-[10px] text-text-muted mt-1 leading-snug">
                  Automated audit sweep
                </div>
              </button>
            </div>

            {/* Spec Details Based on Selection */}
            <div className="mb-6 p-4 rounded bg-background border border-border font-mono text-xs text-text-secondary space-y-2">
              {activeTab === 'double_entry' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">MATHEMATICAL INVARIANT:</span>
                    <span className="text-white font-bold">Zero-Sum Conservation (ΣΔ = 0.00)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">ENFORCEMENT LAYER:</span>
                    <span className="text-text-primary">Rust Domain + Deferred SQL Trigger</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">CONCURRENCY SAFETY:</span>
                    <span className="text-text-primary">Deterministic UUID ASC Row Locking</span>
                  </div>
                </>
              )}

              {activeTab === 'outbox' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">AT-LEAST-ONCE DELIVERY:</span>
                    <span className="text-white font-bold">PostgreSQL Outbox Table</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">CONCURRENCY DISPATCH:</span>
                    <span className="text-text-primary">FOR UPDATE SKIP LOCKED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">RETRY &amp; DLQ:</span>
                    <span className="text-text-primary">Exponential Backoff (6 attempts max)</span>
                  </div>
                </>
              )}

              {activeTab === 'reconciliation' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">PROJECTION VERIFICATION:</span>
                    <span className="text-white font-bold">account_balances vs journal_entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">DETECTION POLICY:</span>
                    <span className="text-text-primary">Non-destructive anomaly reporting</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">AUDIT RUNTIME:</span>
                    <span className="text-text-primary">&lt; 150ms for 10,000 ledger legs</span>
                  </div>
                </>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate('overview')}
                className="flex-1 justify-center"
              >
                Explore the Ledger
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('architecture')}
                className="justify-center"
              >
                View Architecture
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Live Operational Invariant Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 pt-8 border-t border-border">
          <div>
            <div className="text-[11px] font-mono uppercase text-text-muted">INVARIANT DRIFT</div>
            <div className="text-2xl font-bold tracking-tight text-white mt-1 tabular-nums">0.00000000</div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-text-muted">P99 LATENCY</div>
            <div className="text-2xl font-bold tracking-tight text-white mt-1 tabular-nums">&lt; 49 ms</div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-text-muted">DEADLOCKS DETECTED</div>
            <div className="text-2xl font-bold tracking-tight text-white mt-1 tabular-nums">0 (Eliminated)</div>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-text-muted">OUTBOX DURABILITY</div>
            <div className="text-2xl font-bold tracking-tight text-white mt-1 tabular-nums">100% ACID</div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: EDITORIAL STORYTELLING — DOUBLE-ENTRY INTEGRITY
          ========================================================================= */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">
              01 // CORE ACCOUNTING ENGINE
            </div>
            <h2 className="text-din-h2 text-white uppercase tracking-tight leading-tight">
              Every balance movement balances to zero.
            </h2>
            <p className="mt-6 text-base text-text-secondary leading-relaxed">
              In financial systems, money can neither be created nor destroyed out of thin air. Ledgce enforces strict double-entry accounting at every tier. Each transfer produces matching, atomic debit and credit journal legs.
            </p>
            <div className="mt-8 space-y-4 font-mono text-xs">
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <CheckCircle2 className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Domain-Level Verification</div>
                  <div className="text-text-muted mt-1">Rust domain types reject single-sided postings and unbalanced entries before SQL generation.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <CheckCircle2 className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Database-Level Constraint Triggers</div>
                  <div className="text-text-muted mt-1">PostgreSQL deferred constraint triggers verify net zero sum per currency on commit.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <CheckCircle2 className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Append-Only Immutability</div>
                  <div className="text-text-muted mt-1">Posted journal entries cannot be edited or deleted. Errors are corrected exclusively via compensating reversals.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border border-border bg-surface p-2">
            <DoubleEntryIntegrityGraphic className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: EDITORIAL STORYTELLING — TRANSACTIONAL OUTBOX & WORKER
          ========================================================================= */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 rounded-lg overflow-hidden border border-border bg-surface p-2">
            <TransactionalOutboxPipelineGraphic className="w-full h-auto" />
          </div>

          <div className="order-1 lg:order-2">
            <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">
              02 // RELIABLE DISTRIBUTED MESSAGING
            </div>
            <h2 className="text-din-h2 text-white uppercase tracking-tight leading-tight">
              Dual-write vulnerability eliminated.
            </h2>
            <p className="mt-6 text-base text-text-secondary leading-relaxed">
              Writing to a database while concurrently publishing to an event bus (e.g. Kafka or Webhook) creates split-brain inconsistency when failures occur. Ledgce solves this using the Transactional Outbox pattern.
            </p>
            <div className="mt-8 space-y-4 font-mono text-xs">
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <Cpu className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Single ACID Transaction</div>
                  <div className="text-text-muted mt-1">Ledger postings and outbox events are committed together in one atomic database transaction.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <Database className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">FOR UPDATE SKIP LOCKED Leasing</div>
                  <div className="text-text-muted mt-1">Distributed background workers claim batches concurrently without lock contention or duplicate execution.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <ShieldCheck className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Dead-Letter Inspection</div>
                  <div className="text-text-muted mt-1">Terminal delivery failures transition to dead-letter state with complete error history and operator 1-click retry.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: EDITORIAL STORYTELLING — CONTINUOUS RECONCILIATION
          ========================================================================= */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">
              03 // CONTINUOUS INTEGRITY VERIFICATION
            </div>
            <h2 className="text-din-h2 text-white uppercase tracking-tight leading-tight">
              Trust, verified by continuous audit.
            </h2>
            <p className="mt-6 text-base text-text-secondary leading-relaxed">
              Ledgce does not assume internal storage remains uncorrupted. An independent reconciliation engine continuously sweeps accounts and computes the mathematical integral of all historical journal entries.
            </p>
            <div className="mt-8 space-y-4 font-mono text-xs">
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <RefreshCw className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Zero-Sum Currency Balancing</div>
                  <div className="text-text-muted mt-1">Verifies that the sum of all customer and system balances in each currency equals exactly zero.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <Layers className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Projection Drift Detection</div>
                  <div className="text-text-muted mt-1">Compares cached materialized balances against the full historical sum of credits minus debits.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded bg-surface border border-border">
                <Lock className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-white uppercase">Non-Destructive Reporting</div>
                  <div className="text-text-muted mt-1">Discrepancies are logged as forensic audit runs. The system never performs silent or heuristic data repairs.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border border-border bg-surface p-2">
            <AutomatedReconciliationGraphic className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: SYSTEM ARCHITECTURE SPECIFICATION
          ========================================================================= */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-border">
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono uppercase tracking-widest text-text-muted mb-3">
            04 // SYSTEM TOPOLOGY
          </div>
          <h2 className="text-din-h2 text-white uppercase tracking-tight leading-tight">
            Designed as a modular monolith. Ready for distribution.
          </h2>
          <p className="mt-4 text-base text-text-secondary leading-relaxed">
            Ledgce isolates business invariants within a pure domain layer, wraps workflows inside an application engine, and exposes synchronous REST and asynchronous Outbox APIs.
          </p>
        </div>

        {/* Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-6 rounded bg-surface border border-border">
            <div className="text-text-muted text-[10px] uppercase">TIER 1</div>
            <div className="text-base font-bold text-white mt-2 font-sans">Web Client</div>
            <div className="text-text-secondary mt-3 leading-relaxed">
              React 19, TypeScript strict mode, Vite, Tailwind CSS, TanStack Query, Framer Motion.
            </div>
          </div>

          <div className="p-6 rounded bg-surface border border-border">
            <div className="text-text-muted text-[10px] uppercase">TIER 2</div>
            <div className="text-base font-bold text-white mt-2 font-sans">Core REST API</div>
            <div className="text-text-secondary mt-3 leading-relaxed">
              Rust Axum service, Bearer authentication, Utoipa OpenAPI, rate-limiting, and structured tracing.
            </div>
          </div>

          <div className="p-6 rounded bg-surface border border-border">
            <div className="text-text-muted text-[10px] uppercase">TIER 3</div>
            <div className="text-base font-bold text-white mt-2 font-sans">Domain Engine</div>
            <div className="text-text-secondary mt-3 leading-relaxed">
              Pure mathematical invariants, exact decimal arithmetic, deterministic lock ordering.
            </div>
          </div>

          <div className="p-6 rounded bg-surface border border-border">
            <div className="text-text-muted text-[10px] uppercase">TIER 4</div>
            <div className="text-base font-bold text-white mt-2 font-sans">PostgreSQL 17</div>
            <div className="text-text-secondary mt-3 leading-relaxed">
              ACID transactional store, deferred constraint triggers, immutability triggers, SKIP LOCKED outbox.
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: CALL TO ACTION (Starlink Service Plans Restraint)
          ========================================================================= */}
      <section className="py-24 px-6 sm:px-12 max-w-7xl mx-auto border-t border-border">
        <div className="rounded-xl bg-surface border border-border p-8 sm:p-16 text-center max-w-4xl mx-auto">
          <h2 className="text-din-h2 sm:text-din-h1 text-white uppercase tracking-tight">
            Inspect the live financial engine
          </h2>
          <p className="mt-4 text-base text-text-secondary max-w-xl mx-auto font-normal leading-relaxed">
            Enter the operational workspace to create accounts, execute double-entry transfers, trigger automated reconciliation sweeps, and monitor background outbox workers.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('overview')}
              className="px-8 justify-center"
            >
              Launch Platform Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('docs')}
              className="px-8 justify-center"
            >
              Developer Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: MINIMAL FOOTER
          ========================================================================= */}
      <footer className="py-12 px-6 sm:px-12 max-w-7xl mx-auto border-t border-border font-mono text-xs text-text-muted flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-widest uppercase text-white font-sans">LEDGCE</span>
          <span>·</span>
          <span>Financial Infrastructure, Engineered for Trust</span>
        </div>

        <div className="flex flex-wrap gap-6 text-text-secondary">
          <button type="button" onClick={() => onNavigate('platform')} className="hover:text-white transition-colors">
            Platform
          </button>
          <button type="button" onClick={() => onNavigate('architecture')} className="hover:text-white transition-colors">
            Architecture
          </button>
          <button type="button" onClick={() => onNavigate('security')} className="hover:text-white transition-colors">
            Security
          </button>
          <button type="button" onClick={() => onNavigate('docs')} className="hover:text-white transition-colors">
            Docs
          </button>
          <button type="button" onClick={() => onNavigate('login')} className="hover:text-white transition-colors">
            Authorization
          </button>
        </div>

        <div>
          © 2026 Ledgce Ledger Infrastructure. MIT License.
        </div>
      </footer>
    </div>
  );
};
