import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ToastContext, type ToastKind } from "./toast-context";

type Toast = { id: number; message: string; kind: ToastKind };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-20 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-4">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm",
              item.kind === "success" && "border-green-200 bg-green-50 text-green-800",
              item.kind === "error" && "border-red-200 bg-red-50 text-red-800",
              item.kind === "info" && "border-slate-200 bg-white text-slate-800",
            )}
            role="status"
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
