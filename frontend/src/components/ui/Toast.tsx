import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, title, description, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full select-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icon = {
              success: <CheckCircle2 className="w-4 h-4 text-[#00D26A] shrink-0" />,
              warning: <AlertTriangle className="w-4 h-4 text-[#FFAA00] shrink-0" />,
              error: <AlertCircle className="w-4 h-4 text-[#FF453A] shrink-0" />,
              info: <Info className="w-4 h-4 text-white shrink-0" />,
            }[toast.type];

            const borderColor = {
              success: 'border-[#00D26A]/30',
              warning: 'border-[#FFAA00]/30',
              error: 'border-[#FF453A]/30',
              info: 'border-white/20',
            }[toast.type];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={clsx(
                  'pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-[#0D0F14]/95 backdrop-blur-md border shadow-[0_12px_30px_rgba(0,0,0,0.8)] transition-all',
                  borderColor
                )}
              >
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1 text-xs">
                  <p className="font-mono font-bold uppercase tracking-wider text-white text-[11px]">{toast.title}</p>
                  {toast.description && (
                    <p className="text-white/60 mt-1 leading-relaxed text-[11px] font-light">{toast.description}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-white/40 hover:text-white p-0.5 rounded transition-colors"
                  aria-label="Dismiss toast"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
