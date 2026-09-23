"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const value = {
    toast: addToast,
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    info: (msg: string) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-3 sm:max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
              t.type === "success"
                ? "border-emerald-500/40 bg-emerald-950/95 text-emerald-100 shadow-emerald-950/40"
                : t.type === "error"
                  ? "border-rose-500/40 bg-rose-950/95 text-rose-100 shadow-rose-950/40"
                  : "border-slate-700 bg-slate-900/95 text-slate-100 shadow-black/40"
            }`}
          >
            {t.type === "success" && (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            )}
            {t.type === "error" && (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            )}
            {t.type === "info" && (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            )}
            <div className="flex-1 text-sm font-medium leading-snug">
              {t.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="-mr-1 -mt-1 rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Закрыть уведомление"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
