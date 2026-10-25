import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'elevated' | 'glass';
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'primary',
  glow = false,
  children,
  ...props
}) => {
  // Starlink glassmorphic card aesthetic with radial dark grey backdrop and crisp hairline border
  const variantStyles = {
    primary: 'glass-card-starlink hover:border-white/25',
    secondary: 'bg-[#141923]/80 backdrop-blur-xl border-white/10 hover:border-white/20',
    elevated: 'bg-[#181F2C]/90 backdrop-blur-2xl border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.85)]',
    glass: 'glass-card-starlink',
  }[variant];

  return (
    <div
      className={twMerge(
        clsx(
          'border rounded-2xl p-6 sm:p-7 transition-all duration-300',
          variantStyles,
          glow && 'border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.15)]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={twMerge(clsx('flex items-start justify-between gap-4 mb-4', className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={twMerge(clsx('text-base sm:text-lg font-bold text-white tracking-tight uppercase font-neodin', className))} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={twMerge(clsx('text-xs text-white/60 leading-relaxed font-normal', className))} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => <div className={twMerge(clsx('space-y-4', className))} {...props}>{children}</div>;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={twMerge(
      clsx('flex items-center justify-between gap-3 pt-4 mt-4 border-t border-white/[0.08] text-xs text-white/50', className)
    )}
    {...props}
  >
    {children}
  </div>
);

export interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral' | 'warning';
  subtext?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  unit,
  change,
  changeType = 'neutral',
  subtext,
  icon,
  className,
}) => {
  const changeStyles = {
    positive: 'text-[#00D26A] bg-[#00D26A]/10 border-[#00D26A]/30',
    negative: 'text-[#FF453A] bg-[#FF453A]/10 border-[#FF453A]/30',
    warning: 'text-[#FFAA00] bg-[#FFAA00]/10 border-[#FFAA00]/30',
    neutral: 'text-white/60 bg-white/5 border-white/10',
  }[changeType];

  return (
    <div
      className={twMerge(
        clsx(
          'p-5 sm:p-6 rounded-2xl bg-[#121212] border border-white/10 flex flex-col justify-between hover:border-white/25 transition-all select-none min-w-0',
          className
        )
      )}
    >
      <div className="flex items-center justify-between text-xs text-white/50 mb-3">
        <span className="font-mono uppercase tracking-[0.2em] text-[10px] font-bold">{label}</span>
        {icon && <span className="text-white/40 shrink-0">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2 my-1 min-w-0 overflow-hidden">
        <span
          className={clsx(
            'font-bold font-mono text-white tracking-tight truncate',
            typeof value === 'string' && value.length > 8
              ? 'text-lg sm:text-xl'
              : typeof value === 'string' && value.length > 5
              ? 'text-xl sm:text-2xl'
              : 'text-3xl sm:text-4xl tabular-nums'
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-white/40 shrink-0">
            {unit}
          </span>
        )}
      </div>

      {(change || subtext) && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
          {change && (
            <span className={`px-2 py-0.5 rounded-sm border uppercase text-[9px] font-bold tracking-wider ${changeStyles}`}>
              {change}
            </span>
          )}
          {subtext && <span className="text-white/40 truncate ml-2">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
