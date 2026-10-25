import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  ArrowRight,
  Terminal,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { ViewRoute } from '../types/api';

interface SecurityViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full text-white select-none font-neodin py-12 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-raised border border-border text-[11px] font-mono tracking-widest uppercase text-text-secondary mb-4">
          THREAT MODEL &amp; CONTROLS
        </div>
        <h1 className="text-din-h1 text-white uppercase tracking-tight">
          Financial Security &amp; Defensive Posture
        </h1>
        <p className="mt-4 text-base text-text-secondary max-w-3xl leading-relaxed">
          Ledgce is designed under zero-trust assumptions. Core accounting invariants are defended by multi-layered guards across HTTP middleware, domain state machines, SQL query parameterization, and database trigger triggers.
        </p>
      </div>

      {/* STRIDE Analysis Table */}
      <div className="rounded-lg bg-surface border border-border p-8">
        <h3 className="text-lg font-bold uppercase text-white font-sans mb-6">
          STRIDE Threat Matrix &amp; Mitigations
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-3 uppercase">Threat</th>
                <th className="pb-3 uppercase">Attack Scenario</th>
                <th className="pb-3 uppercase text-white">Ledgce Defensive Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 text-white font-bold">Spoofing</td>
                <td className="py-3 text-text-secondary">Unauthorized actor submitting fraudulent transfer</td>
                <td className="py-3 text-text-primary">Bearer token authentication with strict role checks (`Role::Admin`). Tokens verified in Axum middleware.</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">Tampering</td>
                <td className="py-3 text-text-secondary">Modifying historical journal entries or balance rows</td>
                <td className="py-3 text-text-primary">PostgreSQL triggers reject `UPDATE`, `DELETE`, and `TRUNCATE` on `journal_entries`. Balance projection updated exclusively via triggers.</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">Repudiation</td>
                <td className="py-3 text-text-secondary">Denying having initiated a high-value transfer</td>
                <td className="py-3 text-text-primary">Append-only `audit_events` table writes actor, action, timestamp, and request payload hash in the same ACID transaction.</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">Information Disclosure</td>
                <td className="py-3 text-text-secondary">Database connection or internal SQL errors leaked to API</td>
                <td className="py-3 text-text-primary">Axum error mapping strips internal driver diagnostics, returning sanitized standard RFC 7807 JSON errors.</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">Denial of Service</td>
                <td className="py-3 text-text-secondary">Concurrent transfer storm causing deadlocks or resource exhaustion</td>
                <td className="py-3 text-text-primary">Deterministic UUID ASC lock ordering prevents deadlocks; configurable token-bucket rate limiting (default 600 req/min).</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">Elevation of Privilege</td>
                <td className="py-3 text-text-secondary">Read-only operator issuing financial write mutation</td>
                <td className="py-3 text-text-primary">Auth middleware checks `Role::Admin` for all `POST`, `PUT`, `DELETE` operations; returns HTTP 403 Forbidden.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Policies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="text-white font-bold uppercase font-sans text-sm flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Loopback Binding
          </div>
          <p className="text-text-secondary leading-relaxed">
            All services (`ledgce-api` on 8080, PostgreSQL on 5433) bind strictly to loopback (`127.0.0.1`), ensuring zero accidental WAN exposure during local operation.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="text-white font-bold uppercase font-sans text-sm flex items-center gap-2">
            <Key className="w-4 h-4" />
            Idempotency Fingerprinting
          </div>
          <p className="text-text-secondary leading-relaxed">
            Idempotency keys are bound to a SHA-256 hash of the canonical request body. Submitting an identical key with a mutated amount triggers immediate rejection with HTTP 409 Conflict.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
          <div className="text-white font-bold uppercase font-sans text-sm flex items-center gap-2">
            <Database className="w-4 h-4" />
            Parameterized SQL Queries
          </div>
          <p className="text-text-secondary leading-relaxed">
            100% of database interactions utilize SQLx compile-time checked parameterized queries (`$1, $2, ...`), rendering SQL injection attacks impossible.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="primary" size="lg" onClick={() => onNavigate('overview')}>
          Launch Operational Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button variant="outline" size="lg" onClick={() => onNavigate('docs')}>
          Explore API Documentation
        </Button>
      </div>
    </div>
  );
};
