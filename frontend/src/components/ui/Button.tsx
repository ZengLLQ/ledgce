import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none';

  const sizeStyles = {
    xs: 'h-7 px-3 text-[10px] rounded-sm gap-1.5',
    sm: 'h-8 px-4 text-xs rounded-sm gap-1.5',
    md: 'h-10 px-5 text-xs rounded gap-2',
    lg: 'h-12 px-8 text-xs sm:text-sm rounded gap-2.5',
  }[size];

  // Starlink high-contrast precision buttons
  const variantStyles = {
    primary:
      'bg-[#FAFAFA] text-black hover:bg-white hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] border border-transparent',
    secondary:
      'bg-white/10 text-[#FAFAFA] hover:bg-white/20 border border-white/15 hover:border-white/30 backdrop-blur-sm',
    outline:
      'bg-transparent text-[#FAFAFA] hover:bg-white hover:text-black border border-white/50 hover:border-white',
    ghost:
      'bg-transparent text-white/70 hover:text-white hover:bg-white/5 border border-transparent',
    danger:
      'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/40 hover:border-red-500',
    accent:
      'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)] border border-transparent',
  }[variant];

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles, variantStyles, className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
