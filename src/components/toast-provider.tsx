"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 gap-2 sm:bottom-6 sm:right-6 sm:left-auto sm:w-full sm:translate-x-0">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return value;
}

function ToastItem({ toast }: { toast: Toast }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : XCircle;
  const toneClassName =
    toast.tone === "success"
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
      : "border-red-200/80 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200";

  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg shadow-zinc-900/10 backdrop-blur dark:shadow-black/30 ${toneClassName}`}
      role="status"
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{toast.message}</span>
    </div>
  );
}
