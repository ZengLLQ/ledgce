import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'positive' | 'warning' | 'error' | 'info' | 'neutral' | 'accent';
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

  const variantStyles = {
    positive: 'bg-[#00D26A]/10 text-[#00D26A] border-[#00D26A]/30',
    warning: 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/30',
    error: 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/30',
    info: 'bg-white/10 text-white border-white/20',
    neutral: 'bg-white/5 text-white/60 border-white/10',
    accent: 'bg-white text-black border-transparent font-bold',
  }[variant];

  const dotColors = {
    positive: 'bg-[#00D26A]',
    warning: 'bg-[#FFAA00]',
    error: 'bg-[#FF453A]',
    info: 'bg-white',
    neutral: 'bg-white/50',
    accent: 'bg-black',
  }[variant];

  return (
    <span className={twMerge(clsx(baseStyles, sizeStyles, variantStyles, className))} {...props}>
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors,
            pulse && 'badge-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
};
