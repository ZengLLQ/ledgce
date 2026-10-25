import React, { createContext, useContext, useState, useCallback } from 'react';
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
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => {
          const icon = {
            success: <CheckCircle2 className="w-4 h-4 text-[#35D6A0] shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-[#F2B85C] shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-[#FF6B78] shrink-0" />,
            info: <Info className="w-4 h-4 text-[#526CFF] shrink-0" />,
          }[toast.type];

          const borderColor = {
            success: 'border-[#35D6A0]/30',
            warning: 'border-[#F2B85C]/30',
            error: 'border-[#FF6B78]/30',
            info: 'border-[#526CFF]/30',
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={clsx(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg bg-[#111522] border shadow-elevated transition-all duration-200 animate-in slide-in-from-right-4',
                borderColor
              )}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 text-xs">
                <p className="font-semibold text-[#F4F6FC]">{toast.title}</p>
                {toast.description && (
                  <p className="text-[#9BA5BC] mt-0.5 leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#9BA5BC] hover:text-[#F4F6FC] p-0.5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
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
