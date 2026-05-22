"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const toastConfig: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string; text: string }> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-success-50",
    border: "border-success-200",
    text: "text-success-700",
  },
  error: {
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${config.bg} ${config.border} ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
      }`}
    >
      <Icon size={18} className={config.text} />
      <p className={`flex-1 text-14 font-medium ${config.text}`}>{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/50 hover:text-gray-600"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[9999] flex flex-col gap-2 sm:left-auto sm:max-w-sm">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
