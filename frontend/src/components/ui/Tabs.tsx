import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'pill',
}) => {
  if (variant === 'underline') {
    return (
      <div className={twMerge(clsx('flex items-center gap-6 border-b border-white/10 select-none', className))}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'py-3 text-xs font-mono font-bold uppercase tracking-[0.14em] flex items-center gap-2 border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50 hover:text-white hover:border-white/30'
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded font-mono',
                    isActive ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/60'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Starlink minimalist pill container
  return (
    <div
      className={twMerge(
        clsx('inline-flex items-center p-1 rounded-md bg-[#141414] border border-white/10 select-none', className))
      }
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-[0.1em] rounded-sm transition-all duration-150 flex items-center gap-2',
              isActive
                ? 'bg-white text-black shadow-sm'
                : 'text-white/60 hover:text-white'
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded font-mono',
                  isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
