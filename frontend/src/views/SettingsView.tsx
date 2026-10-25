import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Key,
  Database,
  Globe,
  Shield,
  RefreshCw,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { setApiToken, getApiToken } from '../api/client';

export const SettingsView: React.FC = () => {
  const [token, setToken] = useState(getApiToken());
  const [apiUrl, setApiUrl] = useState('http://127.0.0.1:8080');
  const { showToast } = useToast();

  const handleSaveToken = () => {
    setApiToken(token.trim());
    showToast('Settings Saved', 'Active operator token updated.', 'success');
  };

  return (
    <div className="space-y-8 select-none font-sans max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">
          Platform Settings &amp; Telemetry Config
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-mono">
          Local development runtime variables, credential management, and loopback endpoints.
        </p>
      </div>

      {/* Connection & Auth */}
      <Card>
        <CardHeader>
          <CardTitle>Core API Endpoint &amp; Security</CardTitle>
          <CardDescription>
            Configuration governing API client communication with the Axum backend daemon.
          </CardDescription>
        </CardHeader>
        <div className="p-6 space-y-6 font-mono text-xs">
          <div>
            <label className="text-text-muted uppercase block mb-1.5">Backend REST Service URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-background border border-border text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-white font-mono"
            />
          </div>

          <div>
            <label className="text-text-muted uppercase block mb-1.5">Active Authorization Bearer Token</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="dev_admin_token"
                className="flex-1 bg-background border border-border text-white text-xs rounded px-3 py-2 focus:outline-none focus:border-white font-mono"
              />
              <Button variant="primary" size="sm" onClick={handleSaveToken}>
                Save Token
              </Button>
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              Default local tokens: `dev_admin_token` (Read/Write) or `dev_reader_token` (Audit only).
            </p>
          </div>
        </div>
      </Card>

      {/* Runtime Environment Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Diagnostics &amp; Invariants</CardTitle>
          <CardDescription>
            Reported configuration from `.env` and PostgreSQL 17 transactional database.
          </CardDescription>
        </CardHeader>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 rounded bg-background border border-border space-y-1">
            <span className="text-text-muted text-[10px] uppercase">ENVIRONMENT GUARD</span>
            <p className="text-white font-bold">LEDGCE_ENV = local</p>
            <p className="text-text-muted text-[11px]">Chaos fault injection enabled for testing</p>
          </div>

          <div className="p-4 rounded bg-background border border-border space-y-1">
            <span className="text-text-muted text-[10px] uppercase">POSTGRESQL BINDING</span>
            <p className="text-white font-bold">127.0.0.1:5433 (ledgce)</p>
            <p className="text-text-muted text-[11px]">Loopback isolated, 25 max connection pool</p>
          </div>

          <div className="p-4 rounded bg-background border border-border space-y-1">
            <span className="text-text-muted text-[10px] uppercase">RATE LIMITING POLICY</span>
            <p className="text-white font-bold">600 req / min</p>
            <p className="text-text-muted text-[11px]">Token bucket governor per client IP</p>
          </div>

          <div className="p-4 rounded bg-background border border-border space-y-1">
            <span className="text-text-muted text-[10px] uppercase">OUTBOX WORKER LEASE</span>
            <p className="text-white font-bold">30s TTL · SKIP LOCKED</p>
            <p className="text-text-muted text-[11px]">Max retry attempts: 6 before DLQ</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
