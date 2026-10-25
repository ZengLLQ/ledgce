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
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-[0.12em] uppercase border select-none transition-all duration-300',
        isBalanced
          ? 'bg-[#00D26A]/10 border-[#00D26A]/30 text-[#00D26A]'
          : 'bg-[#FF453A]/10 border-[#FF453A]/30 text-[#FF453A]',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            isBalanced ? 'bg-[#00D26A]' : 'bg-[#FF453A]'
          )}
        />
        <span
          className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            isBalanced ? 'bg-[#00D26A]' : 'bg-[#FF453A]'
          )}
        />
      </span>

      <span className="flex items-center gap-1.5 text-[10px]">
        {isBalanced ? (
          <>
            <ShieldCheck className="w-3 h-3" />
            <span>INVARIANTS VERIFIED · Σ=0</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-3 h-3" />
            <span>LEDGER VARIANCE DETECTED</span>
          </>
        )}
      </span>
    </div>
  );
};
