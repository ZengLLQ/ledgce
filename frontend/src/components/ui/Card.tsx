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
  const variantStyles = {
    primary: 'bg-[#111522] border-white/[0.08]',
    secondary: 'bg-[#171C2C] border-white/[0.08]',
    elevated: 'bg-[#20263A] border-white/[0.12] shadow-elevated',
    glass: 'bg-[#111522]/80 backdrop-blur-md border-white/[0.1]',
  }[variant];

  return (
    <div
      className={twMerge(
        clsx(
          'border rounded-lg p-5 transition-all duration-200',
          variantStyles,
          glow && 'box-glow border-[#526CFF]/30',
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
  <h3 className={twMerge(clsx('text-base font-semibold text-[#F4F6FC] tracking-tight', className))} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={twMerge(clsx('text-xs text-[#9BA5BC] mt-0.5 leading-relaxed', className))} {...props}>
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
      clsx('mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#9BA5BC]', className)
    )}
    {...props}
  >
    {children}
  </div>
);

// High-density KPI Stat Tile inspired by Starlink micro-label pattern
export interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'warning' | 'negative' | 'neutral';
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  unit,
  change,
  changeType = 'neutral',
  meta,
  icon,
  className,
}) => {
  const changeColor = {
    positive: 'text-[#35D6A0]',
    warning: 'text-[#F2B85C]',
    negative: 'text-[#FF6B78]',
    neutral: 'text-[#9BA5BC]',
  }[changeType];

  return (
    <div
      className={twMerge(
        clsx(
          'bg-[#111522] border border-white/[0.08] hover:border-white/[0.14] rounded-lg p-4 transition-colors relative overflow-hidden',
          className
        )
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-[#9BA5BC]/90 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-[#9BA5BC] opacity-70">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1.5 font-mono">
        <span className="text-2xl font-bold tracking-tight text-[#F4F6FC] tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs text-[#9BA5BC] font-sans font-medium">{unit}</span>}
      </div>

      {(change || meta) && (
        <div className="mt-2.5 flex items-center justify-between text-xs">
          {change && <span className={clsx('font-medium', changeColor)}>{change}</span>}
          {meta && <span className="text-[#9BA5BC]/80 truncate">{meta}</span>}
        </div>
      )}
    </div>
  );
};
