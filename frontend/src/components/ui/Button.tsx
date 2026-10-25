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
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526CFF] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeStyles = {
    xs: 'h-7 px-2.5 text-xs rounded-sm gap-1.5',
    sm: 'h-8 px-3 text-xs rounded-sm gap-1.5',
    md: 'h-9 px-4 text-sm rounded-md gap-2',
    lg: 'h-11 px-5 text-sm rounded-md gap-2.5',
  }[size];

  // Highest contrast primary button inspired by SpaceX/Starlink (white fill, dark text)
  const variantStyles = {
    primary:
      'bg-[#F4F6FC] text-[#090B12] hover:bg-white hover:shadow-lg shadow-sm font-semibold border border-white/20',
    secondary:
      'bg-[#171C2C] text-[#F4F6FC] hover:bg-[#20263A] border border-white/10 hover:border-white/20',
    outline:
      'bg-transparent text-[#F4F6FC] hover:bg-white/5 border border-white/10 hover:border-white/25',
    ghost:
      'bg-transparent text-[#9BA5BC] hover:text-[#F4F6FC] hover:bg-white/5 border border-transparent',
    danger:
      'bg-[#FF6B78]/15 text-[#FF6B78] hover:bg-[#FF6B78]/25 border border-[#FF6B78]/30',
    accent:
      'bg-[#526CFF] text-white hover:bg-[#627bff] shadow-accent border border-[#526CFF]/50',
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
