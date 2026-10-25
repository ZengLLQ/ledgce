import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCode2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import type { ViewRoute } from '../types/api';

interface DocsViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const DocsView: React.FC<DocsViewProps> = ({ onNavigate }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { showToast } = useToast();

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    showToast('Copied to Clipboard', 'Code snippet copied successfully.', 'info');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const curlTransfer = `curl -X POST http://127.0.0.1:8080/api/v1/transfers \\
  -H "Authorization: Bearer dev_admin_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source_account_id": "a0000000-0000-7000-8000-000000000003",
    "destination_account_id": "a0000000-0000-7000-8000-000000000004",
    "amount": "25000.00",
    "currency": "USD",
    "reference": "TX-PROD-20261026-001",
    "description": "Liquidity rebalancing",
    "idempotency_key": "idem-key-prod-001"
  }'`;

  const curlReconciliation = `curl -X POST http://127.0.0.1:8080/api/v1/reconciliation/run \\
  -H "Authorization: Bearer dev_admin_token"`;

  return (
    <div className="w-full text-white select-none font-neodin py-12 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-raised border border-border text-[11px] font-mono tracking-widest uppercase text-text-secondary mb-4">
            DEVELOPER DOCUMENTATION &amp; API CONTRACT
          </div>
          <h1 className="text-din-h1 text-white uppercase tracking-tight">
            REST API &amp; Invariant Specifications
          </h1>
          <p className="mt-4 text-base text-text-secondary max-w-3xl leading-relaxed">
            All mutating endpoints require an `Authorization: Bearer &lt;token&gt;` header with `Role::Admin` permissions. Read endpoints accept both `Role::Reader` and `Role::Admin`.
          </p>
        </div>

        <a
          href="http://127.0.0.1:8080/swagger-ui"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-surface border border-border hover:border-white text-xs font-mono uppercase text-white transition-colors"
        >
          Open Swagger UI
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* API Endpoints Summary Table */}
      <div className="rounded-lg bg-surface border border-border p-8">
        <h3 className="text-lg font-bold uppercase text-white font-sans mb-6">
          Core Endpoints Directory
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-3 uppercase w-20">Method</th>
                <th className="pb-3 uppercase">Path</th>
                <th className="pb-3 uppercase">Description</th>
                <th className="pb-3 uppercase w-24">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3 text-white font-bold">GET</td>
                <td className="py-3 text-text-primary">/api/v1/health</td>
                <td className="py-3 text-text-secondary">Public service liveness &amp; database readiness probe</td>
                <td className="py-3 text-text-muted">Public</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">GET</td>
                <td className="py-3 text-text-primary">/api/v1/overview</td>
                <td className="py-3 text-text-secondary">Summary metrics, currency volumes, and global invariant state</td>
                <td className="py-3 text-text-secondary">Reader / Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">GET</td>
                <td className="py-3 text-text-primary">/api/v1/accounts</td>
                <td className="py-3 text-text-secondary">Paginated accounts with balance projections and filter flags</td>
                <td className="py-3 text-text-secondary">Reader / Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">POST</td>
                <td className="py-3 text-text-primary">/api/v1/accounts</td>
                <td className="py-3 text-text-secondary">Create a new customer or system vault account</td>
                <td className="py-3 text-white font-bold">Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">POST</td>
                <td className="py-3 text-text-primary">/api/v1/accounts/opening-balance</td>
                <td className="py-3 text-text-secondary">Seed opening capital from World Clearing Reserve</td>
                <td className="py-3 text-white font-bold">Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">POST</td>
                <td className="py-3 text-text-primary">/api/v1/transfers</td>
                <td className="py-3 text-text-secondary">Post atomic double-entry transfer with idempotency key</td>
                <td className="py-3 text-white font-bold">Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">POST</td>
                <td className="py-3 text-text-primary">/api/v1/transfers/reversal</td>
                <td className="py-3 text-text-secondary">Execute compensating reversal transaction</td>
                <td className="py-3 text-white font-bold">Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">GET</td>
                <td className="py-3 text-text-primary">/api/v1/ledger/entries</td>
                <td className="py-3 text-text-secondary">Keyset-paginated immutable journal entries</td>
                <td className="py-3 text-text-secondary">Reader / Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">POST</td>
                <td className="py-3 text-text-primary">/api/v1/reconciliation/run</td>
                <td className="py-3 text-text-secondary">Trigger full automated zero-sum invariant audit sweep</td>
                <td className="py-3 text-white font-bold">Admin</td>
              </tr>
              <tr>
                <td className="py-3 text-white font-bold">GET</td>
                <td className="py-3 text-text-primary">/api/v1/outbox/events</td>
                <td className="py-3 text-text-secondary">Inspect transactional outbox event queue and delivery status</td>
                <td className="py-3 text-text-secondary">Reader / Admin</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono text-xs">
        <div className="rounded-lg bg-surface border border-border p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white uppercase font-sans">Submit Double-Entry Transfer</span>
            <button
              type="button"
              onClick={() => copyToClipboard(curlTransfer, 'transfer')}
              className="text-text-muted hover:text-white transition-colors p-1"
            >
              {copiedSection === 'transfer' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 rounded bg-background border border-border overflow-x-auto text-text-secondary leading-relaxed">
            {curlTransfer}
          </pre>
        </div>

        <div className="rounded-lg bg-surface border border-border p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white uppercase font-sans">Trigger Ledger Reconciliation</span>
            <button
              type="button"
              onClick={() => copyToClipboard(curlReconciliation, 'recon')}
              className="text-text-muted hover:text-white transition-colors p-1"
            >
              {copiedSection === 'recon' ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 rounded bg-background border border-border overflow-x-auto text-text-secondary leading-relaxed">
            {curlReconciliation}
          </pre>
        </div>
      </div>
    </div>
  );
};
