import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dark frosted scrim */}
      <div
        className="fixed inset-0 bg-[#090B12]/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={twMerge(
          clsx(
            'relative w-full rounded-lg bg-[#111522] border border-white/10 shadow-elevated z-10 overflow-hidden',
            'transition-all duration-200 transform scale-100',
            sizeClasses,
            className
          )
        )}
      >
        <div className="flex items-start justify-between p-5 border-b border-white/[0.08] bg-[#171C2C]/50">
          <div>
            <h2 className="text-base font-semibold text-[#F4F6FC]">{title}</h2>
            {description && (
              <p className="text-xs text-[#9BA5BC] mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9BA5BC] hover:text-[#F4F6FC] hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
