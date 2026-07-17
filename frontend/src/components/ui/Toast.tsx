import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'], duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col gap-2 sm:max-w-md"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const toastStyles = {
  success: 'bg-emerald-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-amber-500 text-white',
};

export const Toast: React.FC<Toast> = ({ id, message, type }) => {
  const { removeToast } = useToast();

  return (
    <div className={`
      flex items-center justify-between gap-3
      px-4 py-3 rounded-lg shadow-lg pointer-events-auto
      animate-in fade-in slide-in-from-top-4 duration-300
      ${toastStyles[type]}
    `}>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => removeToast(id)}
        className="hover:opacity-80 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
};
