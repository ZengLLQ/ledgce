import React from 'react';

// 1. Hero Ledger Matrix Graphic (Technical Financial Matrix & Invariant Vector)
export const HeroLedgerMatrixGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 700 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gridFade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="vectorBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="nodeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B1B1B" />
            <stop offset="100%" stopColor="#0D0D0D" />
          </linearGradient>
        </defs>

        {/* Ambient Dark Neutral Depth */}
        <circle cx="450" cy="250" r="280" fill="#141414" opacity="0.4" />
        <ellipse cx="300" cy="400" rx="350" ry="200" fill="#0D0D0D" opacity="0.6" />

        {/* Isometric Ledger Grid Lines */}
        <g stroke="url(#gridFade)" strokeWidth="1">
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`diag1-${i}`} x1={i * 60 - 100} y1="0" x2={i * 60 + 400} y2="600" />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`diag2-${i}`} x1={i * 60 + 500} y1="0" x2={i * 60} y2="600" />
          ))}
        </g>

        {/* Central Balance Invariant Beam (\Sigma \Delta = 0) */}
        <line x1="80" y1="300" x2="620" y2="300" stroke="url(#vectorBeam)" strokeWidth="2" strokeDasharray="6 4" />

        {/* Technical Coordinate Markers & Zero Conservation Nodes */}
        <g transform="translate(140, 240)">
          <rect x="0" y="0" width="130" height="120" rx="4" fill="url(#nodeGlow)" stroke="#3A3A3A" strokeWidth="1" />
          <text x="16" y="28" fill="#737373" fontSize="10" fontFamily="monospace" letterSpacing="0.1em">DEBIT_LEG</text>
          <text x="16" y="52" fill="#F5F5F5" fontSize="16" fontFamily="sans-serif" fontWeight="700">+$250,000.00</text>
          <text x="16" y="74" fill="#A3A3A3" fontSize="11" fontFamily="monospace">TX.UUID.0A1F</text>
          <circle cx="110" cy="24" r="3" fill="#E5E5E5" />
          <line x1="16" y1="92" x2="114" y2="92" stroke="#262626" strokeWidth="1" />
          <text x="16" y="106" fill="#737373" fontSize="9" fontFamily="monospace">STATUS: COMMITTED</text>
        </g>

        <g transform="translate(430, 240)">
          <rect x="0" y="0" width="130" height="120" rx="4" fill="url(#nodeGlow)" stroke="#3A3A3A" strokeWidth="1" />
          <text x="16" y="28" fill="#737373" fontSize="10" fontFamily="monospace" letterSpacing="0.1em">CREDIT_LEG</text>
          <text x="16" y="52" fill="#F5F5F5" fontSize="16" fontFamily="sans-serif" fontWeight="700">-$250,000.00</text>
          <text x="16" y="74" fill="#A3A3A3" fontSize="11" fontFamily="monospace">TX.UUID.0A1F</text>
          <circle cx="110" cy="24" r="3" fill="#E5E5E5" />
          <line x1="16" y1="92" x2="114" y2="92" stroke="#262626" strokeWidth="1" />
          <text x="16" y="106" fill="#737373" fontSize="9" fontFamily="monospace">STATUS: COMMITTED</text>
        </g>

        {/* Central Balance Invariant Seal */}
        <g transform="translate(325, 270)">
          <circle cx="25" cy="30" r="28" fill="#050505" stroke="#FFFFFF" strokeWidth="1.5" />
          <text x="25" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="700">Σ Δ</text>
          <text x="25" y="42" textAnchor="middle" fill="#A3A3A3" fontSize="9" fontFamily="monospace">0.00</text>
        </g>

        {/* Cryptographic Merkle Hash Links */}
        <path d="M 270 300 L 325 300" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M 375 300 L 430 300" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Upper Outbox Vector Flow */}
        <path d="M 350 272 L 350 160 L 510 160" stroke="#737373" strokeWidth="1" strokeDasharray="3 3" />
        <g transform="translate(510, 140)">
          <rect x="0" y="0" width="120" height="40" rx="3" fill="#141414" stroke="#262626" />
          <text x="12" y="24" fill="#E5E5E5" fontSize="10" fontFamily="monospace">OUTBOX.STREAM</text>
        </g>
      </svg>
    </div>
  );
};

// 2. Double-Entry Integrity Graphic
export const DoubleEntryIntegrityGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="20" y="20" width="460" height="360" rx="8" fill="#0D0D0D" stroke="#262626" strokeWidth="1" />
        
        {/* Ledger Header Bar */}
        <rect x="20" y="20" width="460" height="48" rx="8" fill="#141414" />
        <text x="44" y="50" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="700" letterSpacing="0.1em">
          ATOMIC TRANSACTION BOUNDARY (ACID)
        </text>
        <circle cx="450" cy="44" r="4" fill="#FFFFFF" />

        {/* Dual Balanced Columns */}
        <g transform="translate(44, 95)">
          <rect x="0" y="0" width="195" height="180" rx="4" fill="#050505" stroke="#262626" />
          <text x="16" y="28" fill="#A3A3A3" fontSize="11" fontFamily="monospace">SOURCE ACCOUNT (DEBIT)</text>
          <text x="16" y="60" fill="#FFFFFF" fontSize="20" fontFamily="sans-serif" fontWeight="700">-$500,000.00</text>
          <text x="16" y="85" fill="#737373" fontSize="11" fontFamily="monospace">CUST-TREASURY-01</text>
          <line x1="16" y1="110" x2="179" y2="110" stroke="#1F1F1F" />
          <text x="16" y="132" fill="#A3A3A3" fontSize="10" fontFamily="monospace">POSTED_BALANCE: $2.00M</text>
          <text x="16" y="152" fill="#737373" fontSize="10" fontFamily="monospace">VERIFIED BY TRIGGER</text>
        </g>

        <g transform="translate(261, 95)">
          <rect x="0" y="0" width="195" height="180" rx="4" fill="#050505" stroke="#262626" />
          <text x="16" y="28" fill="#A3A3A3" fontSize="11" fontFamily="monospace">DEST ACCOUNT (CREDIT)</text>
          <text x="16" y="60" fill="#FFFFFF" fontSize="20" fontFamily="sans-serif" fontWeight="700">+$500,000.00</text>
          <text x="16" y="85" fill="#737373" fontSize="11" fontFamily="monospace">CUST-SETTLEMENT-02</text>
          <line x1="16" y1="110" x2="179" y2="110" stroke="#1F1F1F" />
          <text x="16" y="132" fill="#A3A3A3" fontSize="10" fontFamily="monospace">POSTED_BALANCE: $1.25M</text>
          <text x="16" y="152" fill="#737373" fontSize="10" fontFamily="monospace">VERIFIED BY TRIGGER</text>
        </g>

        {/* Footer Zero-Sum Verification Status */}
        <g transform="translate(44, 300)">
          <rect x="0" y="0" width="412" height="52" rx="4" fill="#141414" stroke="#3A3A3A" />
          <text x="20" y="31" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="700">
            NET BALANCE CONSERVATION:
          </text>
          <text x="320" y="31" fill="#FFFFFF" fontSize="13" fontFamily="monospace" fontWeight="700">
            0.00000000 USD
          </text>
        </g>
      </svg>
    </div>
  );
};

// 3. Transactional Outbox Pipeline Graphic
export const TransactionalOutboxPipelineGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="20" y="20" width="460" height="360" rx="8" fill="#0D0D0D" stroke="#262626" />
        
        <text x="40" y="55" fill="#FFFFFF" fontSize="14" fontFamily="sans-serif" fontWeight="700" letterSpacing="0.05em">
          TRANSACTIONAL OUTBOX & LEASE LOOP
        </text>
        <text x="40" y="75" fill="#737373" fontSize="11" fontFamily="monospace">
          AT-LEAST-ONCE DELIVERY WITH SKIP LOCKED CONCURRENCY
        </text>

        {/* 3 Processing Stages */}
        <g transform="translate(40, 110)">
          <rect x="0" y="0" width="120" height="150" rx="4" fill="#141414" stroke="#262626" />
          <text x="12" y="28" fill="#A3A3A3" fontSize="10" fontFamily="monospace">STAGE 1</text>
          <text x="12" y="50" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="700">DB COMMIT</text>
          <text x="12" y="80" fill="#737373" fontSize="9" fontFamily="monospace">Atomic insertion with journal legs</text>
          <rect x="12" y="110" width="96" height="24" rx="2" fill="#050505" />
          <text x="20" y="126" fill="#FFFFFF" fontSize="9" fontFamily="monospace">STATUS: PENDING</text>
        </g>

        <path d="M 165 185 L 195 185" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />

        <g transform="translate(200, 110)">
          <rect x="0" y="0" width="120" height="150" rx="4" fill="#141414" stroke="#3A3A3A" />
          <text x="12" y="28" fill="#A3A3A3" fontSize="10" fontFamily="monospace">STAGE 2</text>
          <text x="12" y="50" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="700">WORKER LEASE</text>
          <text x="12" y="80" fill="#737373" fontSize="9" fontFamily="monospace">FOR UPDATE SKIP LOCKED lease</text>
          <rect x="12" y="110" width="96" height="24" rx="2" fill="#050505" />
          <text x="18" y="126" fill="#FFFFFF" fontSize="9" fontFamily="monospace">LEASE: 30s TTL</text>
        </g>

        <path d="M 325 185 L 355 185" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />

        <g transform="translate(360, 110)">
          <rect x="0" y="0" width="100" height="150" rx="4" fill="#141414" stroke="#262626" />
          <text x="10" y="28" fill="#A3A3A3" fontSize="10" fontFamily="monospace">STAGE 3</text>
          <text x="10" y="50" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="700">PUBLISHED</text>
          <text x="10" y="80" fill="#737373" fontSize="9" fontFamily="monospace">Event delivered to stream</text>
          <rect x="10" y="110" width="80" height="24" rx="2" fill="#050505" />
          <text x="18" y="126" fill="#FFFFFF" fontSize="9" fontFamily="monospace">CONFIRMED</text>
        </g>

        {/* Telemetry Metrics */}
        <g transform="translate(40, 290)">
          <rect x="0" y="0" width="420" height="60" rx="4" fill="#050505" stroke="#262626" />
          <text x="20" y="28" fill="#737373" fontSize="10" fontFamily="monospace">ACTIVE WORKERS: 2 NODES</text>
          <text x="20" y="46" fill="#FFFFFF" fontSize="11" fontFamily="monospace">BACKLOG: 0 EVENTS (REAL-TIME)</text>
          <text x="250" y="28" fill="#737373" fontSize="10" fontFamily="monospace">AVERAGE LATENCY</text>
          <text x="250" y="46" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="700">12.4 ms</text>
        </g>
      </svg>
    </div>
  );
};

// 4. Automated Reconciliation Graphic
export const AutomatedReconciliationGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="20" y="20" width="460" height="360" rx="8" fill="#0D0D0D" stroke="#262626" />
        
        <text x="40" y="55" fill="#FFFFFF" fontSize="14" fontFamily="sans-serif" fontWeight="700">
          CONTINUOUS INVARIANT RECONCILIATION
        </text>
        <text x="40" y="75" fill="#737373" fontSize="11" fontFamily="monospace">
          INDEPENDENT AUDITOR OF PROJECTIONS VS JOURNAL INTEGRAL
        </text>

        {/* Flow Representation */}
        <g transform="translate(40, 105)">
          <rect x="0" y="0" width="200" height="150" rx="4" fill="#141414" stroke="#262626" />
          <text x="16" y="28" fill="#A3A3A3" fontSize="10" fontFamily="monospace">PROJECTION AUDIT</text>
          <text x="16" y="52" fill="#FFFFFF" fontSize="15" fontFamily="sans-serif" fontWeight="700">Table: account_balances</text>
          <text x="16" y="76" fill="#737373" fontSize="10" fontFamily="monospace">Cached materialization</text>
          <line x1="16" y1="95" x2="184" y2="95" stroke="#262626" />
          <text x="16" y="118" fill="#FFFFFF" fontSize="11" fontFamily="monospace">Version monotonic: OK</text>
          <text x="16" y="136" fill="#A3A3A3" fontSize="10" fontFamily="monospace">Overdraft Check: 0 violations</text>
        </g>

        <g transform="translate(260, 105)">
          <rect x="0" y="0" width="200" height="150" rx="4" fill="#141414" stroke="#262626" />
          <text x="16" y="28" fill="#A3A3A3" fontSize="10" fontFamily="monospace">JOURNAL INTEGRAL</text>
          <text x="16" y="52" fill="#FFFFFF" fontSize="15" fontFamily="sans-serif" fontWeight="700">Table: journal_entries</text>
          <text x="16" y="76" fill="#737373" fontSize="10" fontFamily="monospace">Append-only truth source</text>
          <line x1="16" y1="95" x2="184" y2="95" stroke="#262626" />
          <text x="16" y="118" fill="#FFFFFF" fontSize="11" fontFamily="monospace">SUM(credit) - SUM(debit)</text>
          <text x="16" y="136" fill="#A3A3A3" fontSize="10" fontFamily="monospace">Drift vs Projection: 0.00</text>
        </g>

        {/* Audit Status Bar */}
        <g transform="translate(40, 280)">
          <rect x="0" y="0" width="420" height="70" rx="4" fill="#050505" stroke="#3A3A3A" />
          <text x="20" y="28" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="700">
            AUDIT VERDICT: PASSED
          </text>
          <text x="20" y="50" fill="#737373" fontSize="11" fontFamily="monospace">
            Zero discrepancies detected across 100% of accounts and journal legs.
          </text>
        </g>
      </svg>
    </div>
  );
};

// Aliases for backwards compatibility with any prior naming
export const HeroRoofGraphic = HeroLedgerMatrixGraphic;
export const HardwareSpotlightGraphic = DoubleEntryIntegrityGraphic;
export const ResilientStormGraphic = TransactionalOutboxPipelineGraphic;
export const RemoteLandscapeGraphic = AutomatedReconciliationGraphic;
