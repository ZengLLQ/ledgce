import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

export interface StatusPillProps {
  isBalanced?: boolean;
  activeCount?: number;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  isBalanced = true,
  className,
}) => {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border select-none transition-all duration-200',
        isBalanced
          ? 'bg-[#35D6A0]/10 border-[#35D6A0]/25 text-[#35D6A0]'
          : 'bg-[#FF6B78]/10 border-[#FF6B78]/25 text-[#FF6B78]',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            isBalanced ? 'bg-[#35D6A0]' : 'bg-[#FF6B78]'
          )}
        />
        <span
          className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            isBalanced ? 'bg-[#35D6A0]' : 'bg-[#FF6B78]'
          )}
        />
      </span>

      <span className="flex items-center gap-1 font-mono tracking-tight text-[11px] font-semibold">
        {isBalanced ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>INVARIANTS PRESERVED (Σ=0)</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>LEDGER DISCREPANCY DETECTED</span>
          </>
        )}
      </span>
    </div>
  );
};
