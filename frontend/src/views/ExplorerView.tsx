import React, { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  ChevronRight,
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

  const loadEntries = async (currentCursor?: number) => {
    try {
      setLoading(true);
      const res = await api.listEntries({
        search: search || undefined,
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
      loadEntries(lastSeq);
    }
  };

  const handleResetPagination = () => {
    setCursor(undefined);
    loadEntries(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
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
            className="h-10 px-3.5 text-xs rounded bg-[#141414] border border-white/15 text-white focus:outline-none focus:border-white font-mono uppercase transition-all"
          >
            <option value="all">ALL CURRENCIES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="IDR">IDR</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="FILTER ACCOUNT / MEMO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEntries(cursor)}
              className="h-10 pl-9 pr-3 text-xs rounded bg-[#141414] border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-all w-48 sm:w-64 font-mono uppercase"
            />
          </div>

          <Button
            size="md"
            variant="outline"
            onClick={handleResetPagination}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Explorer Table */}
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
              <TableHead>Seq</TableHead>
              <TableHead>Transaction Ref</TableHead>
              <TableHead>Account Code</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right text-[#FF6B78]">Debit</TableHead>
              <TableHead className="text-right text-[#35D6A0]">Credit</TableHead>
              <TableHead>Memo</TableHead>
              <TableHead>Posted Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length > 0 ? (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-[#9BA5BC] font-medium">
                    #{entry.seq}
                  </TableCell>
                  <TableCell className="font-mono font-medium text-[#F4F6FC]">
                    {entry.transaction_reference}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs font-semibold">{entry.account_code}</div>
                    <div className="text-[10px] text-[#9BA5BC]">{entry.account_name}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">
                    {entry.currency}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums text-[#FF6B78]">
                    {parseFloat(entry.debit) > 0 ? (
                      parseFloat(entry.debit).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    ) : (
                      <span className="text-[#5D6882] font-normal">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums text-[#35D6A0]">
                    {parseFloat(entry.credit) > 0 ? (
                      parseFloat(entry.credit).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    ) : (
                      <span className="text-[#5D6882] font-normal">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#9BA5BC] max-w-xs truncate">
                    {entry.memo || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-[#9BA5BC]">
                    {new Date(entry.posted_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-[#9BA5BC]">
                  No journal entries found matching criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Keyset Cursor Footer */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9BA5BC]">
          <div>
            Showing <span className="font-mono text-[#F4F6FC]">{entries.length}</span> ledger
            entries
            {cursor !== undefined && (
              <span>
                {' '}
                (Keyset cursor <code>seq &lt; {cursor}</code>)
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
    </div>
  );
};
