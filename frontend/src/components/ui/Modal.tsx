import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={onClose}
          className="relative z-[70] select-none"
        >
          {/* Dark frosted scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container: items-start with my-auto guarantees vertical scrolling without top clipping */}
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 flex min-h-full items-start sm:items-center justify-center py-8 sm:py-12">
            <DialogPanel className={twMerge(clsx('relative w-full my-auto', sizeClasses, className))}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                className="w-full rounded-2xl bg-[#0D0F14] border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.95)] p-5 sm:p-7 transition-all"
              >
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10 mb-6">
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-white uppercase font-display">
                      {title}
                    </DialogTitle>
                    {description && (
                      <p className="mt-1 text-xs text-white/50 leading-relaxed font-light">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded text-white/50 hover:text-white transition-colors focus:outline-none hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>{children}</div>
              </motion.div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
