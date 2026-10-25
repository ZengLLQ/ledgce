import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Database,
  Lock,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { ViewRoute } from '../types/api';

interface LandingViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full text-[#FAFAFA] select-none font-sans overflow-x-hidden">
      {/* 1. Full-Bleed Starlink Hero Section */}
      <section className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between items-center text-center px-4 sm:px-6 py-8 sm:py-12 bg-starlink-hero overflow-hidden border-b border-white/[0.08]">
        {/* Orbital horizon curvature line */}
        <div className="horizon-arc" />

        {/* Top Micro-badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00D26A] badge-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-white/90">
              MISSION-CRITICAL FINANCIAL INFRASTRUCTURE
            </span>
          </div>
        </motion.div>

        {/* Center Editorial Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 max-w-5xl mx-auto my-auto py-8 px-2"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] uppercase font-display">
            MATHEMATICAL CERTAINTY FOR GLOBAL FINANCE.
          </h1>

          <p className="mt-6 sm:mt-8 text-sm sm:text-base md:text-lg text-white/70 max-w-3xl mx-auto leading-relaxed font-light">
            Ledgce is a high-assurance double-entry financial ledger platform engineered with
            immutable append-only journals, zero-sum currency conservation, transactional outbox delivery,
            and continuous automated reconciliation.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
              variant="outline"
              onClick={() => onNavigate('transfers')}
              icon={<Zap className="w-4 h-4" />}
            >
              Submit Transfer
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => onNavigate('reconciliation')}
              icon={<Shield className="w-4 h-4 text-[#00D26A]" />}
            >
              Run Invariant Audit
            </Button>
          </div>
        </motion.div>

        {/* Bottom Telemetry Specs Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 w-full max-w-6xl mx-auto pt-8 border-t border-white/[0.12] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left"
        >
          <div className="border-l border-white/10 pl-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 block">
              INVARIANT GUARANTEE
            </span>
            <div className="text-lg sm:text-xl font-mono font-bold text-[#00D26A] mt-1 tabular-nums">
              Σ(debit) - Σ(credit) = 0
            </div>
            <p className="text-[11px] text-white/50 mt-1">Multi-currency zero-sum theorem</p>
          </div>

          <div className="border-l border-white/10 pl-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 block">
              CONCURRENCY CONTROL
            </span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              Sorted Row Locks
            </div>
            <p className="text-[11px] text-white/50 mt-1">UUID sorting deadlock immunity</p>
          </div>

          <div className="border-l border-white/10 pl-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 block">
              DUAL-WRITE PREVENTION
            </span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              Transactional Outbox
            </div>
            <p className="text-[11px] text-white/50 mt-1">Lease-based worker dispatch</p>
          </div>

          <div className="border-l border-white/10 pl-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 block">
              IDEMPOTENCY LIFECYCLE
            </span>
            <div className="text-lg sm:text-xl font-mono font-bold text-white mt-1">
              SHA-256 Hashing
            </div>
            <p className="text-[11px] text-white/50 mt-1">Payload fingerprint validation</p>
          </div>
        </motion.div>
      </section>

      {/* 2. Starlink 3-Tier Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 block mb-2">
              CORE SYSTEM CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white uppercase font-display">
              Engineered For High Financial Stakes
            </h2>
          </div>
          <p className="text-xs font-mono text-white/60 max-w-md">
            Every architectural decision enforces zero financial drift under any hardware, network, or worker fault.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <Card className="hover:border-white/30 transition-all bg-[#0D0F14]">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-6">
              <Database className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block mb-2">
              STORAGE GUARANTEE
            </span>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight font-display">
              1. Append-Only Immutable Journal
            </h3>
            <p className="text-xs text-white/60 mt-3 leading-relaxed font-light">
              Account balances are never overwritten directly. Every balance change originates as an
              immutable double-entry pair with strictly ascending sequence numbers and cryptographic audit trails.
            </p>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-white/80">
              TABLE journal_entries (IMMUTABLE)
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="hover:border-white/30 transition-all bg-[#0D0F14]">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block mb-2">
              HIGH-CONCURRENCY
            </span>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight font-display">
              2. Deadlock-Free Atomicity
            </h3>
            <p className="text-xs text-white/60 mt-3 leading-relaxed font-light">
              Row locks on participating accounts are acquired in deterministic ascending UUID sort order
              (<code className="font-mono text-white">ORDER BY id ASC FOR UPDATE</code>). Cross-transfers never
              trigger PostgreSQL <code className="font-mono text-white">40P01</code> deadlocks.
            </p>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-[#00D26A] font-bold">
              ZERO CONCURRENCY DEADLOCKS
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="hover:border-white/30 transition-all bg-[#0D0F14]">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 block mb-2">
              AUDIT ENGINE
            </span>
            <h3 className="text-xl font-bold text-white uppercase tracking-tight font-display">
              3. Continuous Reconciliation
            </h3>
            <p className="text-xs text-white/60 mt-3 leading-relaxed font-light">
              An autonomous auditing pipeline continuously recomputes the entire ledger from historical journal
              legs. Any balance drift, negative balances on customer accounts, or broken invariance triggers immediate alerts.
            </p>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] font-mono text-white/80 font-bold">
              0 INVARIANT VIOLATIONS
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Starlink System Specifications Table Layout */}
      <section className="bg-[#0A0C10] border-y border-white/[0.08] py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 block mb-2">
                SYSTEM SPECIFICATIONS
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white uppercase font-display">
                Engineering Invariants
              </h2>
            </div>
            <a
              href="http://127.0.0.1:8080/swagger-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1.5"
            >
              <span>Explore OpenAPI 3.1 Spec</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 sm:gap-y-6 pt-6 border-t border-white/[0.08] text-xs">
            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Primary Language & Toolchain</span>
              <span className="font-bold text-white font-mono">Rust 1.85+ (Axum, SQLx, Tokio)</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Authoritative Monetary Math</span>
              <span className="font-bold text-white font-mono">rust_decimal::Decimal (0 floats)</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Database Storage Engine</span>
              <span className="font-bold text-white font-mono">PostgreSQL 17 (NUMERIC 28, 8)</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Currency Conservation Law</span>
              <span className="font-bold text-[#00D26A] font-mono">Strict Debit = Credit Per Currency</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Outbox Dispatch Algorithm</span>
              <span className="font-bold text-white font-mono">FOR UPDATE SKIP LOCKED Leasing</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Idempotency Guarantee</span>
              <span className="font-bold text-white font-mono">SHA-256 Payload Hash Fingerprint</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Reversal Pattern</span>
              <span className="font-bold text-white font-mono">Balanced Compensating Legs (Append-Only)</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
              <span className="text-white/60 font-mono uppercase tracking-wider">Stress Verification</span>
              <span className="font-bold text-white font-mono">205+ ops/sec · 0 Deadlocks · 0 Drift</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center space-y-8">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white uppercase font-display">
          Ready To Inspect Live Financial Operations?
        </h2>
        <p className="text-xs sm:text-base text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
          Open the Ledger Overview to observe real-time balances, multi-currency volume distributions,
          active outbox worker leases, and continuous reconciliation runs.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => onNavigate('overview')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Launch Overview Dashboard
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigate('accounts')}
          >
            Manage Accounts & Vaults
          </Button>
        </div>
      </section>
    </div>
  );
};
