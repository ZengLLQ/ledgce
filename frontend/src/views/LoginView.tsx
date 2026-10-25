import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { setApiToken, getApiToken, api } from '../api/client';
import type { ViewRoute } from '../types/api';

interface LoginViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const [tokenInput, setTokenInput] = useState(getApiToken());
  const [activeRole, setActiveRole] = useState<'admin' | 'reader'>('admin');
  const [verifying, setVerifying] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ verified: boolean; message: string } | null>(null);
  const { showToast } = useToast();

  const handleApplyPreset = (role: 'admin' | 'reader') => {
    const token = role === 'admin' ? 'dev_admin_token' : 'dev_reader_token';
    setTokenInput(token);
    setActiveRole(role);
    setApiToken(token);
    setAuthStatus(null);
    showToast('Token Updated', `Switched active credentials to ${role.toUpperCase()} preset.`, 'info');
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      setApiToken(tokenInput.trim());
      // Test read overview
      const res = await api.getOverview();
      setAuthStatus({
        verified: true,
        message: `Authentication verified. Account count: ${res.account_count}, Transactions: ${res.transaction_count}`,
      });
      showToast('Authentication Successful', 'Token verified against live Axum service.', 'success');
    } catch (err: unknown) {
      setAuthStatus({
        verified: false,
        message: err instanceof Error ? err.message : String(err),
      });
      showToast('Authentication Failed', 'Invalid or unpermitted token.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="w-full text-white select-none font-neodin py-12 px-6 sm:px-12 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-surface-raised border border-border text-[11px] font-mono tracking-widest uppercase text-text-secondary mb-4">
          OPERATOR ACCESS &amp; CREDENTIALS
        </div>
        <h1 className="text-din-h1 text-white uppercase tracking-tight">
          Bearer Authorization Portal
        </h1>
        <p className="mt-4 text-base text-text-secondary max-w-2xl leading-relaxed">
          Ledgce uses stateless Bearer tokens to govern access between read-only observability and high-privilege financial ledger mutation.
        </p>
      </div>

      {/* Starlink Service Plans Style High-Contrast Card */}
      <div className="rounded-lg bg-surface border border-border p-8 space-y-8">
        <div>
          <h3 className="text-lg font-bold uppercase text-white font-sans">
            Select Role Preset
          </h3>
          <p className="text-xs text-text-secondary mt-1 font-mono">
            Fast credential switching for local development and integration testing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleApplyPreset('admin')}
            className={`p-6 rounded-lg text-left transition-all border ${
              activeRole === 'admin'
                ? 'bg-surface-raised border-white text-white'
                : 'bg-background border-border text-text-muted hover:border-border-strong'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                ROLE: ADMIN
              </span>
              <Badge variant="success">FULL READ / WRITE</Badge>
            </div>
            <div className="text-base font-bold text-white font-sans">dev_admin_token</div>
            <p className="text-xs text-text-secondary mt-2 font-mono leading-relaxed">
              Permissions: POST transfers, reverse transactions, inject opening equity, trigger reconciliation audits, arm chaos faults.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('reader')}
            className={`p-6 rounded-lg text-left transition-all border ${
              activeRole === 'reader'
                ? 'bg-surface-raised border-white text-white'
                : 'bg-background border-border text-text-muted hover:border-border-strong'
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                ROLE: READER
              </span>
              <Badge variant="outline">AUDIT ONLY</Badge>
            </div>
            <div className="text-base font-bold text-white font-sans">dev_reader_token</div>
            <p className="text-xs text-text-secondary mt-2 font-mono leading-relaxed">
              Permissions: Inspect ledger entries, view accounts, examine transaction history, check system telemetry. Financial writes blocked (403).
            </p>
          </button>
        </div>

        {/* Custom Token Input */}
        <div className="space-y-3 font-mono text-xs">
          <label className="text-text-muted uppercase">Active Authorization Header Value</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter Bearer token..."
              className="flex-1 px-4 py-2.5 rounded bg-background border border-border text-white focus:outline-none focus:border-white font-mono text-xs"
            />
            <Button
              variant="primary"
              size="md"
              loading={verifying}
              onClick={handleVerify}
            >
              Verify Token
            </Button>
          </div>
        </div>

        {/* Verification Status */}
        {authStatus && (
          <div
            className={`p-4 rounded border font-mono text-xs ${
              authStatus.verified
                ? 'bg-surface-raised border-white text-text-primary'
                : 'bg-surface-raised border-border-strong text-text-muted'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {authStatus.verified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  AUTHENTICATED · ROLE GRANTED
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-text-muted" />
                  AUTHENTICATION REJECTED
                </>
              )}
            </div>
            <div>{authStatus.message}</div>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onNavigate('overview')}>
            Enter Operational Workspace
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
          <span className="text-xs font-mono text-text-muted">
            Header: Authorization: Bearer {tokenInput ? '***' + tokenInput.slice(-6) : 'none'}
          </span>
        </div>
      </div>
    </div>
  );
};
