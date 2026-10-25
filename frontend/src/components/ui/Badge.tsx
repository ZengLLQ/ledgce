import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'positive' | 'warning' | 'error' | 'info' | 'neutral' | 'accent' | 'success' | 'outline';
  dot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  dot = false,
  pulse = false,
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-mono font-bold rounded-sm border uppercase select-none';

  const sizeStyles = {
    sm: 'text-[9px] px-2 py-0.5 gap-1.5 tracking-[0.15em]',
    md: 'text-[11px] px-2.5 py-0.5 gap-2 tracking-[0.12em]',
  }[size];

  // Monochromatic Starlink-inspired styling
  const variantStyles = {
    positive: 'bg-surface-raised text-text-primary border-border-strong',
    success: 'bg-surface-raised text-text-primary border-border-strong',
    warning: 'bg-surface-raised text-warning border-border',
    error: 'bg-surface-raised text-negative border-border',
    info: 'bg-surface-raised text-white border-border-strong',
    neutral: 'bg-surface text-text-muted border-border',
    outline: 'bg-transparent text-text-secondary border-border',
    accent: 'bg-white text-black border-transparent font-bold',
  }[variant];

  const dotColors = {
    positive: 'bg-white',
    success: 'bg-white',
    warning: 'bg-text-secondary',
    error: 'bg-text-muted',
    info: 'bg-white',
    neutral: 'bg-text-muted',
    outline: 'bg-text-muted',
    accent: 'bg-black',
  }[variant];

  return (
    <span className={twMerge(clsx(baseStyles, sizeStyles, variantStyles, className))} {...props}>
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors,
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
};
