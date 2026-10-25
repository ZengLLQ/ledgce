import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  HeroRoofGraphic,
  HardwareSpotlightGraphic,
  ResilientStormGraphic,
  RemoteLandscapeGraphic,
} from '../components/graphics/StarlinkVisuals';
import type { ViewRoute } from '../types/api';

interface LandingViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'mobile'>('home');
  const [addressInput, setAddressInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emailSubscribed, setEmailSubscribed] = useState(false);

  return (
    <div className="w-full text-white select-none font-neodin overflow-x-hidden bg-starlink-radial-grey">
      {/* =========================================================================
          SECTION 1: HERO (Dusk Atmosphere + Order Selector + 3 Pricing Cards)
          ========================================================================= */}
      <section className="relative min-h-[92vh] flex flex-col justify-between pt-6 sm:pt-10 pb-16 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Dusk Sunset Sky Backdrop with A-Frame House & Dish Silhouette */}
        <div className="absolute right-0 top-0 w-full lg:w-[62%] h-[680px] opacity-85 z-0 pointer-events-none">
          <HeroRoofGraphic className="w-full h-full" />
        </div>

        {/* Ambient Warm Sunset Glow Behind Hero */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[350px] bg-[#422B22]/25 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* Left Column: Headline & Interactive 2-Tab Order Selector Card */}
        <div className="relative z-10 max-w-2xl mt-4 sm:mt-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-din-h1 sm:text-din-hero text-white tracking-tight uppercase leading-[1.04]">
              Fast, deterministic ledger
            </h1>
          </motion.div>

          {/* Starlink-Style Dual-Tab Selector Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 rounded-2xl glass-card-starlink p-6 sm:p-7 max-w-lg border border-white/15"
          >
            {/* Dual Tabs (At Home / On the Go) */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`p-3.5 rounded-xl text-left transition-all border ${
                  activeTab === 'home'
                    ? 'bg-white/10 border-white/30 shadow-lg'
                    : 'bg-black/30 border-white/10 hover:border-white/20 opacity-70'
                }`}
              >
                <div className="text-sm font-bold uppercase tracking-wider text-white">
                  At Home
                </div>
                <div className="text-[11px] text-[#9DA4B0] mt-1 leading-snug">
                  High-speed, reliable transactional core for business
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mobile')}
                className={`p-3.5 rounded-xl text-left transition-all border ${
                  activeTab === 'mobile'
                    ? 'bg-white/10 border-white/30 shadow-lg'
                    : 'bg-black/30 border-white/10 hover:border-white/20 opacity-70'
                }`}
              >
                <div className="text-sm font-bold uppercase tracking-wider text-white">
                  On the Go
                </div>
                <div className="text-[11px] text-[#9DA4B0] mt-1 leading-snug">
                  Outbox event streaming across cloud microservices
                </div>
              </button>
            </div>

            {/* Price & Latency Telemetry Header */}
            <div className="mb-6">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9DA4B0]">
                {activeTab === 'home' ? 'STARTING FROM' : 'DISTRIBUTED RATE'}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-din-price text-white tabular-nums">
                  {activeTab === 'home' ? '$0.00' : '$85'}
                </span>
                <span className="text-sm text-[#9DA4B0] font-normal">
                  /mo · 0% variance · &lt; 0.4ms ACID
                </span>
              </div>
            </div>

            {/* Address / Routing Key Input with White CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter Account ID, IBAN, or Key"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="flex-1 glass-well px-4 py-3 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white transition-all"
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('transfers')}
                className="whitespace-nowrap font-bold"
              >
                Order Now
              </Button>
            </div>
          </motion.div>
        </div>

        {/* 3 Horizontal Pricing / Plan Cards (Residential 50 / 100 / Max) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 pt-8 border-t border-white/10"
        >
          {/* Card 1: Standard 50 Mbps / 10k TPS */}
          <div className="glass-card-starlink rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/25 transition-all">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-[#9DA4B0] mb-1">
                PLAN 01
              </div>
              <h3 className="text-din-h3 text-white uppercase tracking-tight">
                Residential - 50 Mbps
              </h3>
              <p className="text-xs text-[#9DA4B0] mt-2 leading-relaxed">
                Unlimited double-entry transfers with guaranteed zero currency drift.
              </p>
              <ul className="mt-5 space-y-2.5 text-xs text-white/80">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>10,000 TPS ACID Commit Capacity</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Append-Only Journal Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>PostgreSQL 17 Storage Engine</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-5 border-t border-white/10 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-white">$35</span>
                <span className="text-xs text-[#9DA4B0]"> /mo</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('overview')}
                className="text-xs font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1"
              >
                <span>Deploy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: High Velocity 100 Mbps / 50k TPS */}
          <div className="glass-card-starlink rounded-2xl p-6 sm:p-7 flex flex-col justify-between border-white/25 hover:border-white/40 transition-all shadow-xl">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-[#00D26A] mb-1 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D26A]" />
                POPULAR · PLAN 02
              </div>
              <h3 className="text-din-h3 text-white uppercase tracking-tight">
                Residential - 100 Mbps
              </h3>
              <p className="text-xs text-[#9DA4B0] mt-2 leading-relaxed">
                High-throughput outbox dispatching with continuous automated audits.
              </p>
              <ul className="mt-5 space-y-2.5 text-xs text-white/80">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
                  <span>50,000 TPS Distributed Peak</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
                  <span>Transactional Outbox Worker Leasing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
                  <span>Autonomous Invariant Reconciler</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#00D26A] shrink-0" />
                  <span>Sorted UUID Row Locks (No 40P01)</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-5 border-t border-white/10 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-white">$85</span>
                <span className="text-xs text-[#9DA4B0]"> /mo</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transfers')}
                className="text-xs font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1"
              >
                <span>Deploy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Enterprise Mesh - Max */}
          <div className="glass-card-starlink rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/25 transition-all">
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-[#9DA4B0] mb-1">
                SOVEREIGN · PLAN 03
              </div>
              <h3 className="text-din-h3 text-white uppercase tracking-tight">
                Residential - Max
              </h3>
              <p className="text-xs text-[#9DA4B0] mt-2 leading-relaxed">
                Fastest speeds, multi-region active-active mesh, and cryptographic proofs.
              </p>
              <ul className="mt-5 space-y-2.5 text-xs text-white/80">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Multi-Region Active-Active Replication</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>SHA-256 Idempotency Fingerprints</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>24/7 Automated Invariant Sentinel</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Dedicated Financial Operations SLA</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-5 border-t border-white/10 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-white">$130</span>
                <span className="text-xs text-[#9DA4B0]"> /mo</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('reconciliation')}
                className="text-xs font-bold uppercase tracking-wider text-white hover:underline flex items-center gap-1"
              >
                <span>Deploy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footnote under 3-tier cards */}
        <div className="relative z-10 text-center mt-6 text-[11px] text-[#656B77]">
          Verified zero financial drift across all operations. 30-day trial with full access.
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: HARDWARE / CORE SPOTLIGHT (Metallic Dish + Router Render)
          ========================================================================= */}
      <section className="border-t border-white/10 py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Text */}
          <div className="space-y-6">
            <h2 className="text-din-h2 sm:text-din-h1 text-white uppercase tracking-tight leading-[1.08]">
              Starlink V4, built for reliable home internet
            </h2>
            <p className="text-din-body-lg text-[#9DA4B0] leading-relaxed max-w-lg">
              The sleek new Starlink dish features improved field of view, increased range, and
              high-temperature weather resistance. Designed to install in minutes and self-align to
              the satellite constellation in real-time.
            </p>
            <div className="text-xs font-mono text-white/70 space-y-2 pt-2">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>p99 latency under 0.4ms across 10,000+ double-entry legs</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>PostgreSQL 17 numeric(28,8) decimal precision without rounding error</span>
              </div>
            </div>
            <div className="pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('overview')}
                className="font-bold"
              >
                Order Now
              </Button>
            </div>
          </div>

          {/* Right Hardware Render Graphic */}
          <div className="relative h-[340px] sm:h-[400px] flex items-center justify-center">
            <HardwareSpotlightGraphic className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: REMOTE LANDSCAPE BANNER ("High-speed internet, no matter how remote")
          ========================================================================= */}
      <section className="relative min-h-[500px] sm:min-h-[560px] flex items-center border-t border-white/10 overflow-hidden">
        {/* Full-width Scenic Landscape Graphic */}
        <div className="absolute inset-0 z-0">
          <RemoteLandscapeGraphic className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/85" />
        </div>

        {/* Content Box Positioned Right */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 w-full flex justify-end">
          <div className="max-w-xl space-y-6 text-left">
            <h2 className="text-din-h2 sm:text-din-h1 text-white uppercase tracking-tight leading-[1.08]">
              High-speed internet, no matter how remote
            </h2>
            <p className="text-din-body-lg text-white/80 leading-relaxed font-light">
              Connect to high-speed internet in places where traditional wireline infrastructure has
              never reached. Ledgce’s distributed consensus guarantees zero balance drift across remote
              banking nodes and off-grid microservices.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate('system-health')}
                className="font-bold border-white text-white hover:bg-white hover:text-black"
              >
                View Network Specs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PORTABILITY / EDGE SYNC ("Stay connected at home & on the go")
          ========================================================================= */}
      <section className="border-t border-white/10 py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-din-h2 sm:text-din-h1 text-white uppercase tracking-tight leading-[1.08]">
              Stay connected at home & on the go
            </h2>
            <p className="text-din-body-lg text-[#9DA4B0] leading-relaxed max-w-lg">
              Stream transactions and publish outbox events seamlessly from any application layer.
              Whether running on central AWS/GCP clusters or on edge payment terminals, Ledgce maintains
              continuous transactional synchronization.
            </p>
            <div className="flex items-center gap-6 pt-4 text-xs font-mono text-white/70">
              <div>
                <span className="block text-2xl font-bold text-white">100%</span>
                <span className="text-[#9DA4B0]">ACID Atomicity</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="block text-2xl font-bold text-white">0.00</span>
                <span className="text-[#9DA4B0]">Currency Variance</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="block text-2xl font-bold text-white">&lt;0.4ms</span>
                <span className="text-[#9DA4B0]">p99 Commit</span>
              </div>
            </div>
          </div>

          <div className="glass-card-starlink rounded-2xl p-8 flex flex-col justify-center items-center text-center min-h-[300px]">
            <Radio className="w-16 h-16 text-white mb-4 animate-pulse" />
            <div className="text-lg font-bold uppercase tracking-wider text-white">
              Instant Edge Provisioning
            </div>
            <p className="text-xs text-[#9DA4B0] max-w-md mt-2">
              Portable configuration mounts. Just supply PostgreSQL connection credentials and launch
              autonomous worker leases in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: STORM RESILIENCE ("Reliable & resilient")
          ========================================================================= */}
      <section className="relative min-h-[480px] sm:min-h-[520px] flex items-center border-t border-white/10 overflow-hidden">
        {/* Full-width Tempest Storm Graphic */}
        <div className="absolute inset-0 z-0">
          <ResilientStormGraphic className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
        </div>

        {/* Content Box Positioned Left */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className="max-w-xl space-y-6">
            <h2 className="text-din-h2 sm:text-din-h1 text-white uppercase tracking-tight leading-[1.08]">
              Reliable & resilient
            </h2>
            <p className="text-din-body-lg text-white/80 leading-relaxed font-light">
              Starlink is designed and tested to withstand extreme cold, heat, hail, sleet, heavy rain,
              and gale-force winds. In the financial realm, Ledgce endures network split-brains, broker
              outages, and concurrent lock contention without dropping a single transactional journal leg.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate('reconciliation')}
                className="font-bold border-white text-white hover:bg-white hover:text-black"
              >
                Inspect Audit Engine
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: PERFORMANCE WITHOUT COMPROMISE
          ========================================================================= */}
      <section className="border-t border-white/10 py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-6">
          <h2 className="text-din-h2 sm:text-din-h1 text-white uppercase tracking-tight leading-[1.08]">
            High-speed performance without compromise
          </h2>
          <p className="text-din-body-lg text-[#9DA4B0] leading-relaxed">
            By eliminating floating-point math, ordering locks by deterministic UUID order, and using
            lease-based transactional outbox patterns, Ledgce delivers ultra-low latency alongside
            airtight cryptographic correctness.
          </p>
        </div>

        {/* High-Density Engineering Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 pt-10 mt-10 border-t border-white/10 text-xs">
          <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
            <span className="text-[#9DA4B0] uppercase tracking-wider">Primary Language</span>
            <span className="font-bold text-white font-mono">Rust 1.85+ (Axum, SQLx, Tokio)</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
            <span className="text-[#9DA4B0] uppercase tracking-wider">Monetary Math Engine</span>
            <span className="font-bold text-white font-mono">rust_decimal::Decimal (0 floats)</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
            <span className="text-[#9DA4B0] uppercase tracking-wider">Database Storage</span>
            <span className="font-bold text-white font-mono">PostgreSQL 17 (NUMERIC 28, 8)</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
            <span className="text-[#9DA4B0] uppercase tracking-wider">Currency Conservation Law</span>
            <span className="font-bold text-[#00D26A] font-mono">Strict Debit = Credit Per Currency</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
            <span className="text-[#9DA4B0] uppercase tracking-wider">Outbox Dispatch Leasing</span>
            <span className="font-bold text-white font-mono">FOR UPDATE SKIP LOCKED</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/[0.08]">
            <span className="text-[#9DA4B0] uppercase tracking-wider">Idempotency Guarantee</span>
            <span className="font-bold text-white font-mono">SHA-256 Payload Hash Fingerprint</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: CUSTOMER REVIEWS / VERIFICATION PROOFS ("What our customers say")
          ========================================================================= */}
      <section className="border-t border-white/10 py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-din-h2 sm:text-din-h1 text-white uppercase tracking-tight">
            What our customers say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Review 1 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              No more data errors
            </h3>
            <p className="text-xs text-[#9DA4B0] leading-relaxed">
              "In our audit across 10 million transactions, not a single currency conservation invariant
              failed. Double-entry enforcement guarantees total peace of mind for financial reporting."
            </p>
            <div className="text-[11px] font-mono text-white/50 pt-2">
              Fintech Core Architect · Global Payments
            </div>
          </div>

          {/* Review 2 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              Concurrency by reserve
            </h3>
            <p className="text-xs text-[#9DA4B0] leading-relaxed">
              "Deterministic UUID sort locking eliminated all 40P01 deadlocks in our high-concurrency
              payment engine. Transfer throughput tripled immediately under stress."
            </p>
            <div className="text-[11px] font-mono text-white/50 pt-2">
              Lead Systems Engineer · High-Scale Broker
            </div>
          </div>

          {/* Review 3 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              Independence from dual-writes
            </h3>
            <p className="text-xs text-[#9DA4B0] leading-relaxed">
              "The lease-based outbox worker guaranteed exactly-once downstream Kafka delivery even when
              database failovers occurred during peak transactional load."
            </p>
            <div className="text-[11px] font-mono text-white/50 pt-2">
              Principal Infrastructure Engineer · Cloud Banking
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: 30-DAY TRIAL / INTERACTIVE SANDBOX ("30-day trial")
          ========================================================================= */}
      <section className="border-t border-white/10 py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="glass-card-starlink rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-din-h2 text-white uppercase tracking-tight">
              30-day trial
            </h2>
            <p className="text-din-body text-[#9DA4B0] leading-relaxed">
              Test Ledgce in our live sandbox. Submit multi-currency transfers, verify double-entry
              balance invariants, and inspect transactional outbox events with zero setup required.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('overview')}
              className="font-bold whitespace-nowrap"
            >
              Order Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('explorer')}
              className="font-bold border-white text-white hover:bg-white hover:text-black whitespace-nowrap"
            >
              View Journal
            </Button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: EMAIL UPDATES / TELEMETRY SUBSCRIPTION ("Receive Starlink email updates")
          ========================================================================= */}
      <section className="border-t border-white/10 py-24 px-4 sm:px-8 max-w-2xl mx-auto text-center space-y-6">
        <h2 className="text-din-h2 text-white uppercase tracking-tight">
          Receive Starlink email updates
        </h2>
        <p className="text-xs text-[#9DA4B0]">
          Subscribe for service availability, engineering milestones, and ledger consensus releases.
        </p>

        {emailSubscribed ? (
          <div className="p-4 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-white">
            Thank you. You have been enrolled in Ledgce telemetry notifications.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (emailInput) setEmailSubscribed(true);
            }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <input
              type="email"
              required
              placeholder="Email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 glass-well px-4 py-3 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white transition-all text-center sm:text-left"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="font-bold whitespace-nowrap"
            >
              Sign Up
            </Button>
          </form>
        )}
      </section>

      {/* =========================================================================
          SECTION 10: STARLINK MINIMALIST FOOTER
          ========================================================================= */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#656B77]">
        <div>
          Starlink &copy; 2026. All rights reserved. Powered by Ledgce Core Engine.
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="http://127.0.0.1:8080/swagger-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="hover:text-white transition-colors"
          >
            Network Map
          </button>
          <span className="hover:text-white transition-colors cursor-pointer">
            Privacy &amp; Legal
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            Terms of Service
          </span>
        </div>
      </footer>
    </div>
  );
};
