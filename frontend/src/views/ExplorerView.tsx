import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  RefreshCw,
  ChevronRight,
  BookOpen,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/Table';
import { Tabs } from '../components/ui/Tabs';
import { api } from '../api/client';
import type { EntryView } from '../types/api';
import { useToast } from '../components/ui/Toast';

export const ExplorerView: React.FC = () => {
  const [entries, setEntries] = useState<EntryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const { showToast } = useToast();

  const loadEntries = async (query?: string, currentCursor?: number) => {
    try {
      setLoading(true);
      const activeSearch = query !== undefined ? query : search;
      const res = await api.listEntries({
        search: activeSearch || undefined,
        side: sideFilter === 'all' ? undefined : sideFilter,
        currency: currencyFilter === 'all' ? undefined : currencyFilter,
        cursor: currentCursor,
        limit: 25,
      });
      setEntries(res.items);
      setHasMore(res.has_more);
    } catch (err: unknown) {
      showToast('Error loading ledger journal', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [sideFilter, currencyFilter]);

  const handleNextPage = () => {
    if (entries.length > 0) {
      const lastSeq = entries[entries.length - 1].seq;
      setCursor(lastSeq);
      loadEntries(undefined, lastSeq);
    }
  };

  const handleResetPagination = () => {
    setCursor(undefined);
    loadEntries(undefined, undefined);
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {/* 1. Header Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display">
              Immutable Journal Explorer
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1 font-light">
            Granular append-only audit trail. Every atomic transaction writes strictly equal debits and credits.
          </p>
        </div>

        <Button
          size="md"
          variant="outline"
          onClick={handleResetPagination}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="shrink-0"
        >
          Reset Journal
        </Button>
      </motion.div>

      {/* 2. Structured Filter & Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="p-3 bg-[#0D0F14] border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Journal Legs' },
              { id: 'debit', label: 'Debits' },
              { id: 'credit', label: 'Credits' },
            ]}
            activeTab={sideFilter}
            onChange={(id: string) => setSideFilter(id as 'all' | 'debit' | 'credit')}
          />

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg font-mono uppercase bg-[#16181F] border border-white/15 text-white focus:outline-none focus:border-white transition-all shrink-0"
          >
            <option value="all">ALL CURRENCIES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="IDR">IDR</option>
          </select>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); loadEntries(); }} className="relative w-full md:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="FILTER ACCOUNT / MEMO..."
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              if (val === '') {
                loadEntries('');
              }
            }}
            className="w-full h-9 pl-9 pr-8 text-base sm:text-xs rounded-lg bg-[#16181F] border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-all font-mono uppercase"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadEntries('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </motion.div>

      {/* 3. Explorer Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Immutable Journal Log</CardTitle>
              <CardDescription>
                Chronological double-entry legs. Each transaction writes strictly equal debits and credits.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" size="sm">
                Keyset Cursor Pagination
              </Badge>
            </div>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Seq</TableHead>
                <TableHead className="whitespace-nowrap">Transaction Ref</TableHead>
                <TableHead className="whitespace-nowrap">Account Code</TableHead>
                <TableHead className="whitespace-nowrap">Currency</TableHead>
                <TableHead className="text-right text-[#FF453A] whitespace-nowrap">Debit (-)</TableHead>
                <TableHead className="text-right text-[#00D26A] whitespace-nowrap">Credit (+)</TableHead>
                <TableHead className="whitespace-nowrap">Memo</TableHead>
                <TableHead className="whitespace-nowrap">Posted Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-white/50 font-bold whitespace-nowrap">
                      #{entry.seq}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-white whitespace-nowrap">
                      {entry.transaction_reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-white">{entry.account_code}</div>
                      <div className="text-[10px] text-white/40">{entry.account_name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-white/80 whitespace-nowrap">
                      {entry.currency}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold tabular-nums text-[#FF453A] whitespace-nowrap">
                      {parseFloat(entry.debit) > 0 ? (
                        parseFloat(entry.debit).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        <span className="text-white/20 font-normal">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold tabular-nums text-[#00D26A] whitespace-nowrap">
                      {parseFloat(entry.credit) > 0 ? (
                        parseFloat(entry.credit).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        <span className="text-white/20 font-normal">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-white/50 max-w-xs truncate whitespace-nowrap">
                      {entry.memo || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-white/50 whitespace-nowrap">
                      {new Date(entry.posted_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-white/50 font-mono">
                    No journal entries found matching criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Keyset Cursor Footer */}
          <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50">
            <div>
              Showing <span className="font-mono font-bold text-white">{entries.length}</span> ledger
              entries
              {cursor !== undefined && (
                <span className="font-mono">
                  {' '}
                  (Cursor: <code>seq &lt; {cursor}</code>)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cursor !== undefined && (
                <Button size="xs" variant="outline" onClick={handleResetPagination}>
                  Top of Journal
                </Button>
              )}
              <Button
                size="xs"
                variant="secondary"
                disabled={!hasMore}
                onClick={handleNextPage}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Older Entries
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
