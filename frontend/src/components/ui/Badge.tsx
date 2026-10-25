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
    'inline-flex items-center font-medium rounded-xs border tracking-tight uppercase select-none';

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1 tracking-wider',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  }[size];

  const variantStyles = {
    positive: 'bg-[#35D6A0]/10 text-[#35D6A0] border-[#35D6A0]/25',
    warning: 'bg-[#F2B85C]/10 text-[#F2B85C] border-[#F2B85C]/25',
    error: 'bg-[#FF6B78]/10 text-[#FF6B78] border-[#FF6B78]/25',
    info: 'bg-[#526CFF]/10 text-[#7588FF] border-[#526CFF]/25',
    neutral: 'bg-white/5 text-[#9BA5BC] border-white/10',
    accent: 'bg-[#526CFF]/15 text-[#F4F6FC] border-[#526CFF]/40',
  }[variant];

  const dotColors = {
    positive: 'bg-[#35D6A0]',
    warning: 'bg-[#F2B85C]',
    error: 'bg-[#FF6B78]',
    info: 'bg-[#526CFF]',
    neutral: 'bg-[#9BA5BC]',
    accent: 'bg-[#7588FF]',
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
